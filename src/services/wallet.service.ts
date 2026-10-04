"use server";

// ============================================================================
// سرویس کیف پول و دفتر کل - Server Actions
// ============================================================================
//
// ⚠️ نکته حیاتی: تمام محاسبات مالی با BigInt انجام می‌شود.
// ⚠️ هیچ‌وقت از Number یا float برای محاسبات پولی استفاده نکنید.
//
// جریان مالی:
// 1. مشتری پرداخت می‌کند → ودیعه به حساب پلتفرم واریز می‌شود
// 2. رزرو تکمیل می‌شود → کارمزد پلتفرم کسر می‌شود → مابقی به کیف پول هنرمند
// 3. هنرمند درخواست برداشت می‌کند → ادمین بررسی و تأیید می‌کند
// ============================================================================

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/role-guard";
import { PAYMENT_DEFAULTS } from "@/constants";
import { triggerNotification } from "@/lib/notifications";
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

// ============================================================================
// Server Action: پردازش پرداخت رزرو
// ============================================================================
//
// این تابع پس از تأیید موفق پرداخت توسط درگاه فراخوانی می‌شود.
// تمام عملیات در یک تراکنش Prisma انجام می‌شود.

/**
 * @deprecated جریان قدیم (تأیید خودکار پس از پرداخت) — دیگر استفاده نمی‌شود.
 * جریان فعلی: بیعانه فقط قفل تأیید را باز می‌کند؛ تسویه در
 * settleCompletedBooking (lib/booking-rules) هنگام COMPLETED انجام می‌شود.
 */
export async function processBookingPayment(
  bookingId: string,
  paymentRefId: string,
  amount: bigint
): Promise<ApiResponse> {
  try {
    // ─── تراکنش اتمیک ───
    await db.$transaction(async (tx) => {
      // ۱. دریافت اطلاعات رزرو
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          clientId: true,
          artistId: true,
          status: true,
          agreedPrice: true,
        },
      });

      if (!booking) throw new Error("رزرو یافت نشد");
      if (booking.status !== "REQUESTED") throw new Error("وضعیت رزرو نامعتبر است");

      // ۲. به‌روزرسانی وضعیت رزرو
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });

      // ۳. دریافت پروفایل هنرمند
      const artistProfile = await tx.artistProfile.findFirst({
        where: { userId: booking.artistId },
        select: { id: true, platformFeePercent: true, userId: true },
      });

      if (!artistProfile) throw new Error("پروفایل هنرمند یافت نشد");

      // ۴. محاسبه کارمزد پلتفرم (BigInt)
      const feePercent = BigInt(Math.round(artistProfile.platformFeePercent * 100));
      const platformCommission = (amount * feePercent) / BigInt(10000);
      const artistNetAmount = amount - platformCommission;

      // ۵. ایجاد/یافتن کیف پول هنرمند
      let wallet = await tx.wallet.findUnique({
        where: { ownerId: artistProfile.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            ownerId: artistProfile.userId,
            balance: BigInt(0),
            pendingBalance: BigInt(0),
            withdrawableBalance: BigInt(0),
            frozenBalance: BigInt(0),
            totalDeposited: BigInt(0),
            totalWithdrawn: BigInt(0),
          },
        });
      }

      // ۶. ایجاد تراکنش کارمزد پلتفرم (برای پلتفرم)
      // پلتفرم کیف پول جداگانه دارد، فعلاً فقط لاگ می‌کنیم
      console.log(
        `💰 کارمزد پلتفرم: ${platformCommission.toLocaleString("fa-IR")} تومان از رزرو ${bookingId}`
      );

      // ۷. افزودن مبلغ خالص به موجودی در انتظار هنرمند
      const balanceBefore = wallet.pendingBalance;
      const balanceAfter = balanceBefore + artistNetAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { increment: artistNetAmount },
          totalDeposited: { increment: artistNetAmount },
        },
      });

      // ۸. ایجاد تراکنش در دفتر کل
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: artistProfile.userId,
          type: "BOOKING_INCOME",
          amount: artistNetAmount,
          balanceBefore,
          balanceAfter,
          description: `درآمد رزرو ${bookingId} - پس از کسر کارمزد ${platformCommission.toLocaleString("fa-IR")} تومان`,
          referenceId: bookingId,
          referenceType: "booking",
          isCompleted: false, // تا زمان تکمیل رزرو
        },
      });

      // ۹. به‌روزرسانی آمار هنرمند
      await tx.artistProfile.update({
        where: { id: artistProfile.id },
        data: {
          completedBookings: { increment: 1 },
          totalEarnings: { increment: artistNetAmount },
        },
      });
    });

    // ─── ارسال اعلان ───
    await triggerNotification("PAYMENT_SUCCESS", "", {
      bookingId,
      amount: amount.toLocaleString("fa-IR"),
    });

    return success("پرداخت با موفقیت پردازش شد");
  } catch (err: any) {
    console.error("خطا در پردازش پرداخت:", err);
    return error(err.message || "خطا در پردازش پرداخت");
  }
}

// ============================================================================
// Server Action: بازپرداخت (Refund)
// ============================================================================

export async function processRefund(
  bookingId: string,
  reason: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db.$transaction(async (tx) => {
      // ۱. دریافت اطلاعات رزرو و پرداخت
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          clientId: true,
          artistId: true,
          status: true,
          payments: {
            where: { status: "PAID" },
            select: { id: true, amount: true, artistNetAmount: true },
          },
        },
      });

      if (!booking || booking.payments.length === 0) {
        throw new Error("رزرو یا پرداخت یافت نشد");
      }

      const payment = booking.payments[0];

      // ۲. به‌روزرسانی وضعیت پرداخت
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          note: `بازپرداخت: ${reason}`,
        },
      });

      // ۳. کسر از کیف پول هنرمند
      const artistProfile = await tx.artistProfile.findFirst({
        where: { userId: booking.artistId },
        select: { id: true, userId: true },
      });

      if (artistProfile) {
        const wallet = await tx.wallet.findUnique({
          where: { ownerId: artistProfile.userId },
        });

        if (wallet) {
          const balanceBefore = wallet.pendingBalance;
          const balanceAfter = balanceBefore - payment.artistNetAmount;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              pendingBalance: { decrement: payment.artistNetAmount },
              totalDeposited: { decrement: payment.artistNetAmount },
            },
          });

          // تراکنش بازپرداخت در دفتر کل
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              userId: artistProfile.userId,
              type: "REFUND",
              amount: -payment.artistNetAmount,
              balanceBefore,
              balanceAfter,
              description: `بازپرداخت رزرو ${bookingId}: ${reason}`,
              referenceId: bookingId,
              referenceType: "booking",
              isCompleted: true,
            },
          });
        }
      }

      // ۴. به‌روزرسانی وضعیت رزرو
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED_BY_CLIENT",
          cancellationReason: reason,
        },
      });
    });

    return success("بازپرداخت با موفقیت انجام شد");
  } catch (err: any) {
    console.error("خطا در بازپرداخت:", err);
    return error(err.message || "خطا در بازپرداخت");
  }
}

// ============================================================================
// Server Action: درخواست برداشت (توسط هنرمند)
// ============================================================================

export async function requestPayout(data: {
  amount: number;
  destinationIban: string;
  accountHolderName: string;
  bankName?: string;
  cardNumber?: string;
}): Promise<ApiResponse<{ requestId: string }>> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const amount = BigInt(data.amount);

    // ─── اعتبارسنجی ───
    if (amount <= BigInt(0)) {
      return error("مبلغ باید بیشتر از صفر باشد");
    }

    // شماره کارت (اختیاری ولی در صورت ورود باید معتبر باشد)
    const { isValidCardNumber, isValidIban } = await import("@/lib/utils");
    if (data.cardNumber) {
      const clean = String(data.cardNumber).replace(/[\s-]/g, "");
      if (!isValidCardNumber(clean)) {
        return error("شماره کارت معتبر نیست (۱۶ رقم)");
      }
    }
    if (!isValidIban(data.destinationIban)) {
      return error("شماره شبا معتبر نیست (IR + ۲۴ رقم)");
    }

    if (amount < BigInt(PAYMENT_DEFAULTS.MIN_WITHDRAWAL_AMOUNT)) {
      return error(`حداقل مبلغ برداشت ${PAYMENT_DEFAULTS.MIN_WITHDRAWAL_AMOUNT.toLocaleString("fa-IR")} تومان است`);
    }

    // ─── بررسی موجودی ───
    const wallet = await db.wallet.findUnique({
      where: { ownerId: auth.user.id },
    });

    if (!wallet) return error("کیف پول یافت نشد");

    if (wallet.withdrawableBalance < amount) {
      return error("موجودی قابل برداشت کافی نیست");
    }

    // ─── ایجاد درخواست برداشت ───
    const withdrawalRequest = await db.$transaction(async (tx) => {
      // کسر از موجودی قابل برداشت
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          withdrawableBalance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });

      // ایجاد درخواست
      const request = await tx.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount,
          destinationIban: data.destinationIban,
          cardNumber: data.cardNumber ? String(data.cardNumber).replace(/[\s-]/g, "") : null,
          accountHolderName: data.accountHolderName,
          bankName: data.bankName || null,
          isApproved: null, // در انتظار بررسی
        },
      });

      return request;
    });

    return success("درخواست برداشت ثبت شد؛ تسویه حداکثر ظرف ۷۲ ساعت کاری انجام می‌شود", {
      requestId: withdrawalRequest.id,
    });
  } catch (err: any) {
    console.error("خطا در درخواست برداشت:", err);
    return error(err.message || "خطا در درخواست برداشت");
  }
}

// ============================================================================
// Server Action: تأیید درخواست برداشت (توسط ادمین)
// ============================================================================

export async function approvePayout(
  requestId: string,
  approved: boolean,
  adminNote?: string,
  transferTrackingCode?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const request = await db.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { wallet: true },
    });

    if (!request) return error("درخواست یافت نشد");
    if (request.isApproved !== null) return error("این درخواست قبلاً بررسی شده");

    await db.$transaction(async (tx) => {
      // ─── تأیید درخواست ───
      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          isApproved: approved,
          reviewedAt: new Date(),
          adminNote: adminNote || null,
          transferTrackingCode: approved ? (transferTrackingCode || null) : null,
        },
      });

      if (approved) {
        // ─── تأیید: کسر از موجودی مسدود شده و افزایش برداشت‌ها ───
        await tx.wallet.update({
          where: { id: request.walletId },
          data: {
            frozenBalance: { decrement: request.amount },
            totalWithdrawn: { increment: request.amount },
          },
        });

        // ─── تراکنش برداشت در دفتر کل ───
        const wallet = await tx.wallet.findUnique({
          where: { id: request.walletId },
          select: { balance: true, pendingBalance: true },
        });

        if (wallet) {
          await tx.transaction.create({
            data: {
              walletId: request.walletId,
              userId: request.wallet.ownerId,
              type: "WITHDRAWAL",
              amount: -request.amount,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance - request.amount,
              description: `برداشت وجه به شبا ${request.destinationIban} - ${request.accountHolderName}`,
              referenceId: requestId,
              referenceType: "withdrawal",
              isCompleted: true,
            },
          });
        }

        // ─── ارسال اعلان ───
        await triggerNotification("PAYOUT_APPROVED", request.wallet.ownerId, {
          amount: request.amount.toLocaleString("fa-IR"),
        });
      } else {
        // ─── رد: بازگشت موجودی مسدود شده ───
        await tx.wallet.update({
          where: { id: request.walletId },
          data: {
            frozenBalance: { decrement: request.amount },
            withdrawableBalance: { increment: request.amount },
          },
        });

        // ─── ارسال اعلان ───
        await triggerNotification("PAYOUT_REJECTED", request.wallet.ownerId, {
          amount: request.amount.toLocaleString("fa-IR"),
        });
      }
    });

    return success(approved ? "درخواست برداشت تأیید شد" : "درخواست برداشت رد شد");
  } catch (err: any) {
    console.error("خطا در بررسی درخواست برداشت:", err);
    return error(err.message || "خطا در بررسی درخواست");
  }
}

// ============================================================================
// Server Action: دریافت اطلاعات کیف پول
// ============================================================================

export async function getMyWallet(): Promise<
  ApiResponse<{
    balance: string;
    pendingBalance: string;
    withdrawableBalance: string;
    frozenBalance: string;
    totalDeposited: string;
    totalWithdrawn: string;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let wallet = await db.wallet.findUnique({
      where: { ownerId: auth.user.id },
    });

    if (!wallet) {
      // ایجاد کیف پول برای کاربران جدید
      wallet = await db.wallet.create({
        data: {
          ownerId: auth.user.id,
          balance: BigInt(0),
          pendingBalance: BigInt(0),
          withdrawableBalance: BigInt(0),
          frozenBalance: BigInt(0),
          totalDeposited: BigInt(0),
          totalWithdrawn: BigInt(0),
        },
      });
    }

    return success("کیف پول دریافت شد", {
      balance: wallet.balance.toString(),
      pendingBalance: wallet.pendingBalance.toString(),
      withdrawableBalance: wallet.withdrawableBalance.toString(),
      frozenBalance: wallet.frozenBalance.toString(),
      totalDeposited: wallet.totalDeposited.toString(),
      totalWithdrawn: wallet.totalWithdrawn.toString(),
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error("خطا در دریافت کیف پول");
  }
}

// ============================================================================
// Server Action: دریافت تاریخچه تراکنش‌ها
// ============================================================================

export async function getTransactionHistory(
  page: number = 1,
  limit: number = 20
): Promise<
  ApiResponse<{
    transactions: {
      id: string;
      type: string;
      amount: string;
      balanceBefore: string;
      balanceAfter: string;
      description: string;
      isCompleted: boolean;
      createdAt: string;
    }[];
    total: number;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const wallet = await db.wallet.findUnique({
      where: { ownerId: auth.user.id },
      select: { id: true },
    });

    if (!wallet) return success("تراکنشی وجود ندارد", { transactions: [], total: 0 });

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          description: true,
          isCompleted: true,
          createdAt: true,
        },
      }),
      db.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return success("تراکنش‌ها دریافت شد", {
      transactions: transactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        balanceBefore: t.balanceBefore.toString(),
        balanceAfter: t.balanceAfter.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error("خطا در دریافت تراکنش‌ها");
  }
}
