"use server";

// ============================================================================
// سرویس پرداخت - Server Actions
// ============================================================================
//
// ایجاد رکورد پرداخت و اتصال به درگاه زرین‌پال
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/role-guard";
import { getPaymentProvider, generatePaymentCallbackUrl } from "@/lib/payment";
import { triggerNotification } from "@/lib/notifications";
import {
  getBookingMoney,
  expireUnpaidBookingRequests,
  depositDeadline,
  DEPOSIT_WINDOW_HOURS,
} from "@/lib/booking-rules";
import { nanoid } from "nanoid";
import type { ApiResponse } from "@/types";

// ============================================================================
// توابع کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

function generatePaymentNumber(): string {
  return `PAY-${nanoid(8).toUpperCase()}`;
}

// ============================================================================
// Server Action: ایجاد درخواست پرداخت
// ============================================================================

export async function createPayment(data: {
  bookingId: string;
  amount?: number; // اگر مشخص نشود، ۳۰٪ بیعانه محاسبه می‌شود
  description: string;
}): Promise<ApiResponse<{ url: string; authority: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── دریافت اطلاعات رزرو ───
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      select: {
        id: true,
        clientId: true,
        agreedPrice: true,
        status: true,
        bookingNumber: true,
      },
    });

    if (!booking) return error("رزرو یافت نشد");
    if (booking.clientId !== auth.user.id) return error("دسترسی ندارید");
    if (booking.status !== "REQUESTED") return error("وضعیت رزرو نامعتبر است");

    // ─── جلوگیری از فاکتور تکراری: استفاده مجدد از بیعانه PENDING موجود ───
    const existingPending = await db.payment.findFirst({
      where: { bookingId: booking.id, purpose: "DEPOSIT", status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (existingPending) {
      return initiatePayment(existingPending.id);
    }

    // ─── محاسبه مبلغ (بیعانه = کارمزد پلتفرم) ───
    // درصد از تنظیمات ادمین خوانده می‌شود تا مبلغ پرداخت با پنل مدیریت یکی باشد
    const { getDepositPercent, depositAmountWithPercent } = await import(
      "@/lib/booking-rules"
    );
    const depositPercent = await getDepositPercent();
    let amount: bigint;
    if (data.amount) {
      amount = BigInt(data.amount);
    } else if (booking.agreedPrice) {
      amount = depositAmountWithPercent(booking.agreedPrice, depositPercent);
    } else {
      return error("مبلغ پرداخت مشخص نیست");
    }

    // ─── ایجاد رکورد پرداخت ───
    const paymentNumber = generatePaymentNumber();
    const callbackUrl = await generatePaymentCallbackUrl();

    const payment = await db.payment.create({
      data: {
        paymentNumber,
        bookingId: booking.id,
        amount,
        platformFee: amount,
        studioFee: BigInt(0),
        artistNetAmount: BigInt(0),
        method: "ZARINPAL",
        status: "PENDING",
        purpose: "DEPOSIT",
        note: `بیعانه ${depositPercent}٪ (سهم پلتفرم)`,
      },
      select: { id: true },
    });

    // ─── اتصال به درگاه پرداخت ───
    const provider = await getPaymentProvider();

    try {
      const paymentResponse = await provider.requestPayment({
        amount,
        description: data.description,
        callbackUrl,
        mobile: auth.user.phone || undefined,
      });

      // ─── به‌روزرسانی رکورد پرداخت با authority ───
      await db.payment.update({
        where: { id: payment.id },
        data: {
          gatewayTransactionId: paymentResponse.authority,
          gatewayResponse: { authority: paymentResponse.authority },
        },
      });

      // ─── ارسال اعلان ───
      await triggerNotification("BOOKING_CREATED", auth.user.id, {
        bookingNumber: booking.bookingNumber,
        amount: amount.toLocaleString("fa-IR"),
      });

      return success("درخواست پرداخت ایجاد شد", {
        url: paymentResponse.url,
        authority: paymentResponse.authority,
      });
    } catch (paymentErr: any) {
      // ─── خطا در اتصال به درگاه ───
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      console.error("خطا در اتصال به درگاه پرداخت:", paymentErr);
      return error(paymentErr.message || "خطا در اتصال به درگاه پرداخت");
    }
  } catch (err: any) {
    console.error("خطا در ایجاد پرداخت:", err);
    return error(err.message || "خطا در ایجاد پرداخت");
  }
}

// ============================================================================
// Server Action: پرداخت باقی‌مانده (مشتری — پس از تأیید رزرو)
// ============================================================================

export async function createRemainderPayment(
  bookingId: string
): Promise<ApiResponse<{ url: string; authority: string; amount: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, clientId: true, agreedPrice: true, status: true, bookingNumber: true },
    });
    if (!booking) return error("رزرو یافت نشد");
    if (booking.clientId !== auth.user.id) return error("دسترسی ندارید");
    if (!["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)) {
      return error("پرداخت باقی‌مانده فقط پس از تأیید رزرو امکان‌پذیر است");
    }

    const money = await getBookingMoney(bookingId);
    if (!money) return error("مبلغ رزرو مشخص نیست");
    if (money.remainderDue <= BigInt(0)) return error("بدهی باقی‌مانده‌ای وجود ندارد");

    const paymentNumber = generatePaymentNumber();
    const payment = await db.payment.create({
      data: {
        paymentNumber,
        bookingId: booking.id,
        amount: money.remainderDue,
        platformFee: BigInt(0),
        studioFee: BigInt(0),
        artistNetAmount: money.remainderDue,
        method: "ZARINPAL",
        status: "PENDING",
        purpose: "REMAINDER",
        note: "باقی‌مانده (سهم هنرمند)",
      },
      select: { id: true },
    });

    const initiated = await initiatePaymentInternal(payment.id);
    if (!initiated.success) return error(initiated.message || "خطا در اتصال به درگاه پرداخت");
    return success("درخواست پرداخت ایجاد شد", {
      url: (initiated.data as any).url,
      authority: (initiated.data as any).authority,
      amount: money.remainderDue.toString(),
    });
  } catch (err: any) {
    return error(err.message || "خطا در ایجاد پرداخت");
  }
}

async function initiatePaymentInternal(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, amount: true, bookingId: true },
  });
  if (!payment) return { success: false as const, message: "فاکتور یافت نشد" };
  const booking = await db.booking.findUnique({
    where: { id: payment.bookingId },
    select: { bookingNumber: true, clientId: true },
  });
  const client = booking ? await db.user.findUnique({ where: { id: booking.clientId }, select: { phone: true } }) : null;
  const provider = await getPaymentProvider();
  try {
    const paymentResponse = await provider.requestPayment({
      amount: payment.amount,
      description: `پرداخت رزرو ${booking?.bookingNumber || ""}`,
      callbackUrl: await generatePaymentCallbackUrl(),
      mobile: client?.phone || undefined,
    });
    await db.payment.update({
      where: { id: payment.id },
      data: {
        gatewayTransactionId: paymentResponse.authority,
        gatewayResponse: { authority: paymentResponse.authority },
      },
    });
    return { success: true as const, data: { url: paymentResponse.url, authority: paymentResponse.authority } };
  } catch (e: any) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { success: false as const, message: e.message || "خطا در اتصال به درگاه پرداخت" };
  }
}

// ============================================================================
// Server Action: شروع پرداخت برای فاکتور PENDING موجود (بیعانه یا باقی‌مانده)
// ============================================================================

export async function initiatePayment(
  paymentId: string
): Promise<ApiResponse<{ url: string; authority: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        amount: true,
        status: true,
        bookingId: true,
        booking: { select: { clientId: true, bookingNumber: true } },
      },
    });
    if (!payment) return error("فاکتور یافت نشد");
    if (payment.booking.clientId !== auth.user.id) return error("دسترسی ندارید");
    if (payment.status !== "PENDING") return error("این فاکتور قابل پرداخت نیست");

    const provider = await getPaymentProvider();
    try {
      const paymentResponse = await provider.requestPayment({
        amount: payment.amount,
        description: `پرداخت رزرو ${payment.booking.bookingNumber}`,
        callbackUrl: await generatePaymentCallbackUrl(),
        mobile: auth.user.phone || undefined,
      });
      await db.payment.update({
        where: { id: payment.id },
        data: {
          gatewayTransactionId: paymentResponse.authority,
          gatewayResponse: { authority: paymentResponse.authority },
        },
      });
      return success("درخواست پرداخت ایجاد شد", {
        url: paymentResponse.url,
        authority: paymentResponse.authority,
      });
    } catch (paymentErr: any) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return error(paymentErr.message || "خطا در اتصال به درگاه پرداخت");
    }
  } catch (err: any) {
    return error(err.message || "خطا در ایجاد پرداخت");
  }
}

// ============================================================================
// Server Action: یادآوری پرداخت توسط هنرمند (اعلان + پیام با لینک پرداخت)
// ============================================================================

export async function sendPaymentReminder(
  bookingId: string,
  customText?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, artistId: true, clientId: true, bookingNumber: true, agreedPrice: true, status: true },
    });
    if (!booking) return error("رزرو یافت نشد");
    if (booking.artistId !== auth.user.id) return error("دسترسی ندارید");
    if (!["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)) {
      return error("یادآوری فقط برای رزروهای تأییدشده امکان‌پذیر است");
    }

    const money = await getBookingMoney(bookingId);
    if (!money || money.remainderDue <= BigInt(0)) {
      return error("بدهی باقی‌مانده‌ای برای این رزرو وجود ندارد");
    }

    const amountFa = money.remainderDue.toLocaleString("fa-IR");
    const text = customText?.trim() || `لطفاً باقی‌مانده مبلغ (${amountFa} تومان) را از بخش پرداخت‌ها واریز کنید تا پروژه تکمیل شود.`;
    const payLink = `/client/payments?booking=${booking.id}`;

    // اعلان به مشتری
    await db.notification.create({
      data: {
        userId: booking.clientId,
        title: "یادآوری پرداخت 💳",
        message: `${text}\n\nرزرو: ${booking.bookingNumber}`,
        type: "PAYMENT",
        link: payLink,
        data: { bookingId: booking.id },
      },
    });

    // پیام در گفتگوی رزرو با لینک پرداخت (لینک نسبی، مشمول فیلتر تماس خارجی نیست)
    const { ensureBookingConversation } = await import("@/lib/booking-conversation");
    await ensureBookingConversation(booking.id);
    const conversation = await db.conversation.findUnique({
      where: { bookingId: booking.id },
      select: { id: true },
    });
    if (conversation) {
      const { sendMessage } = await import("@/services/message.service");
      await sendMessage(conversation.id, `${text}\n\nلینک پرداخت: ${payLink}`);
    }

    return success("یادآوری پرداخت ارسال شد");
  } catch (err: any) {
    return error(err.message || "خطا در ارسال یادآوری");
  }
}

// ============================================================================
// Server Action: خلاصه پرداخت‌های مشتری
// ============================================================================

export async function getClientPayments(): Promise<
  ApiResponse<{
    bookings: {
      id: string;
      bookingNumber: string;
      title: string;
      status: string;
      scheduledDate: string;
      agreedPrice: string | null;
      paidTotal: string;
      depositPaid: boolean;
      remainderDue: string;
      artistName: string;
      artistSlug: string;
      /** مهلت پرداخت بیعانه پس از ثبت درخواست */
      depositDeadline: string;
      depositWindowHours: number;
      pending: { id: string; amount: string; purpose: string }[];
    }[];
    /** تاریخچهٔ همهٔ پرداخت‌های این مشتری (موفق، ناموفق، لغوشده، در انتظار) */
    history: {
      id: string;
      paymentNumber: string;
      amount: string;
      status: string;
      purpose: string;
      method: string;
      paidAt: string | null;
      createdAt: string;
      refId: string | null;
      bookingId: string;
      bookingNumber: string;
      bookingTitle: string;
    }[];
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // درخواست‌هایی که بیعانه‌شان در مهلت مقرر پرداخت نشده را لغو کن
    // تا زمان رزروشده برای هنرمند آزاد شود.
    await expireUnpaidBookingRequests();

    const bookings = await db.booking.findMany({
      where: { clientId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        bookingNumber: true,
        title: true,
        status: true,
        scheduledDate: true,
        agreedPrice: true,
        artistId: true,
        createdAt: true,
        artist: { select: { displayName: true } },
      },
    });

    const artistUserIds = [...new Set(bookings.map((b) => b.artistId))];
    const artistProfiles = artistUserIds.length > 0
      ? await db.artistProfile.findMany({
          where: { userId: { in: artistUserIds } },
          select: { userId: true, slug: true, artistName: true },
        })
      : [];

    // نگاشت نام هنرمند
    const profileMap = new Map(artistProfiles.map((a) => [a.userId, a]));

    const pendingAll = await db.payment.findMany({
      where: { bookingId: { in: bookings.map((b) => b.id) }, status: "PENDING" },
      select: { id: true, bookingId: true, amount: true, purpose: true },
    });
    const pendingByBooking = new Map<string, { id: string; amount: string; purpose: string }[]>();
    for (const p of pendingAll) {
      const arr = pendingByBooking.get(p.bookingId) || [];
      arr.push({ id: p.id, amount: p.amount.toString(), purpose: p.purpose });
      pendingByBooking.set(p.bookingId, arr);
    }

    const items = await Promise.all(
      bookings.map(async (b) => {
        const money = await getBookingMoney(b.id);
        const prof = profileMap.get(b.artistId);
        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          title: b.title,
          status: b.status,
          scheduledDate: b.scheduledDate.toISOString(),
          agreedPrice: b.agreedPrice?.toString() ?? null,
          paidTotal: money?.paidTotal.toString() ?? "0",
          depositPaid: money?.depositPaid ?? false,
          remainderDue: money?.remainderDue.toString() ?? "0",
          artistName: prof?.artistName || b.artist.displayName,
          artistSlug: prof?.slug || "",
          depositDeadline: depositDeadline(b.createdAt).toISOString(),
          depositWindowHours: DEPOSIT_WINDOW_HOURS,
          pending: pendingByBooking.get(b.id) || [],
        };
      })
    );

    // ─── تاریخچهٔ پرداخت‌ها ───
    const historyRows = await db.payment.findMany({
      where: { booking: { clientId: auth.user.id } },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        status: true,
        purpose: true,
        method: true,
        paidAt: true,
        createdAt: true,
        trackingCode: true,
        gatewayRefId: true,
        bookingId: true,
        booking: { select: { bookingNumber: true, title: true } },
      },
    });

    const history = historyRows.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      amount: p.amount.toString(),
      status: p.status,
      purpose: p.purpose,
      method: p.method,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      refId: p.trackingCode || p.gatewayRefId || null,
      bookingId: p.bookingId,
      bookingNumber: p.booking.bookingNumber,
      bookingTitle: p.booking.title,
    }));

    return success("پرداخت‌ها دریافت شد", { bookings: items, history });
  } catch (err: any) {
    return error(err.message || "خطا در دریافت پرداخت‌ها");
  }
}

// ============================================================================
// Server Action: خلاصه پرداخت‌های هنرمند + کیف پول + برداشت‌ها
// ============================================================================

export async function getArtistPayments(): Promise<
  ApiResponse<{
    wallet: { balance: string; withdrawable: string; pending: string; frozen: string } | null;
    bookings: {
      id: string;
      bookingNumber: string;
      title: string;
      status: string;
      scheduledDate: string;
      agreedPrice: string | null;
      paidTotal: string;
      depositPaid: boolean;
      remainderDue: string;
      clientName: string;
    }[];
    withdrawals: { id: string; amount: string; status: string; createdAt: string }[];
  }>
> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const [bookings, wallet, withdrawals] = await Promise.all([
      db.booking.findMany({
        where: { artistId: auth.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          bookingNumber: true,
          title: true,
          status: true,
          scheduledDate: true,
          agreedPrice: true,
          client: { select: { displayName: true } },
        },
      }),
      db.wallet.findUnique({
        where: { ownerId: auth.user.id },
        select: { balance: true, withdrawableBalance: true, pendingBalance: true, frozenBalance: true },
      }),
      db.withdrawalRequest.findMany({
        where: { wallet: { ownerId: auth.user.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amount: true, isApproved: true, createdAt: true },
      }),
    ]);

    const items = await Promise.all(
      bookings.map(async (b) => {
        const money = await getBookingMoney(b.id);
        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          title: b.title,
          status: b.status,
          scheduledDate: b.scheduledDate.toISOString(),
          agreedPrice: b.agreedPrice?.toString() ?? null,
          paidTotal: money?.paidTotal.toString() ?? "0",
          depositPaid: money?.depositPaid ?? false,
          remainderDue: money?.remainderDue.toString() ?? "0",
          clientName: b.client.displayName,
        };
      })
    );

    return success("پرداخت‌ها دریافت شد", {
      wallet: wallet
        ? {
            balance: wallet.balance.toString(),
            withdrawable: wallet.withdrawableBalance.toString(),
            pending: wallet.pendingBalance.toString(),
            frozen: wallet.frozenBalance.toString(),
          }
        : null,
      bookings: items,
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount.toString(),
        status: w.isApproved === null ? "PENDING" : w.isApproved ? "APPROVED" : "REJECTED",
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    return error(err.message || "خطا در دریافت پرداخت‌ها");
  }
}

// ============================================================================
// Server Action: دریافت وضعیت پرداخت یک رزرو
// ============================================================================

export async function getPaymentStatus(
  bookingId: string
): Promise<ApiResponse<{
  hasPayment: boolean;
  status: string;
  amount: string | null;
  paidAt: string | null;
  trackingCode: string | null;
}>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const payment = await db.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        amount: true,
        paidAt: true,
        trackingCode: true,
      },
    });

    if (!payment) {
      return success("پرداختی ثبت نشده", {
        hasPayment: false,
        status: "NONE",
        amount: null,
        paidAt: null,
        trackingCode: null,
      });
    }

    return success("وضعیت پرداخت دریافت شد", {
      hasPayment: true,
      status: payment.status,
      amount: payment.amount.toString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      trackingCode: payment.trackingCode || null,
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error("خطا در دریافت وضعیت پرداخت");
  }
}
