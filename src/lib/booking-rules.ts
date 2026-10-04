// ============================================================================
// قوانین مالی و ظرفیتی رزرو — منطق مشترک API و Server Actionها
// مدل: بیعانه = کارمزد پلتفرم (سهم پلتفرم، همان ابتدا) / باقی‌مانده = سهم هنرمند
// درصد بیعانه از تنظیمات ادمین خوانده می‌شود (DEPOSIT_PERCENT)
// سقف پروژه هم‌زمان فعال: ۲ برای هنرمند و ۲ برای مشتری
// ============================================================================

import { db } from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES, PAYMENT_DEFAULTS } from "@/constants";
import { getNumberSetting } from "@/lib/server-settings";

const ACTIVE = [...ACTIVE_BOOKING_STATUSES] as string[];

/**
 * درصد بیعانه (= کارمزد پلتفرم) از تنظیمات ادمین خوانده می‌شود.
 *
 * پیش از این مقدار ۲۰٪ در کد هاردکد بود و تنظیم «درصد بیعانه» در پنل ادمین
 * هیچ اثری نداشت؛ یعنی ادمین ۳۰٪ ذخیره می‌کرد ولی سیستم همیشه ۲۰٪ می‌گرفت.
 */
export async function getDepositPercent(): Promise<number> {
  return getNumberSetting("DEPOSIT_PERCENT", PAYMENT_DEFAULTS.DEPOSIT_PERCENT, {
    min: 0,
    max: 100,
  });
}

function percentOf(agreedPrice: bigint | number, percent: number): bigint {
  const price =
    typeof agreedPrice === "bigint" ? agreedPrice : BigInt(Math.round(agreedPrice));
  return (price * BigInt(Math.round(percent))) / BigInt(100);
}

/**
 * محاسبه بیعانه با درصد مشخص (نسخه سنکرون).
 * برای جاهایی که درصد یک‌بار خوانده شده و در حلقه/map استفاده می‌شود.
 */
export function depositAmountWithPercent(
  agreedPrice: bigint | number,
  percent: number
): bigint {
  return percentOf(agreedPrice, percent);
}

/** بیعانه = درصدی از مبلغ توافق‌شده (سهم پلتفرم) */
export async function depositAmount(agreedPrice: bigint | number): Promise<bigint> {
  return percentOf(agreedPrice, await getDepositPercent());
}

/** کارمزد پلتفرم — طبق مدل این پروژه دقیقاً معادل بیعانه است */
export async function platformFee(agreedPrice: bigint | number): Promise<bigint> {
  return percentOf(agreedPrice, await getDepositPercent());
}

export async function countActiveClientBookings(clientId: string): Promise<number> {
  return db.booking.count({
    where: { clientId, status: { in: ACTIVE as any } },
  });
}

export async function countActiveArtistBookings(artistUserId: string): Promise<number> {
  return db.booking.count({
    where: { artistId: artistUserId, status: { in: ACTIVE as any } },
  });
}

/** مهلت پرداخت بیعانه پس از ثبت درخواست رزرو (ساعت) */
export const DEPOSIT_WINDOW_HOURS = 4;

/** لحظه انقضای مهلت پرداخت بیعانه برای یک رزرو */
export function depositDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000);
}

/**
 * فیلتر رزروهایی که واقعاً «زمان» را برای هنرمند قفل می‌کنند.
 *
 * نکته کلیدی: یک درخواست REQUESTED که بیعانه‌اش پرداخت نشده و مهلت
 * ۴ ساعته‌اش هم گذشته است، دیگر نباید زمان را اشغال کند — حتی اگر
 * پاک‌سازی خودکار هنوز اجرا نشده باشد. این تابع همان تضمین است.
 */
export function slotHoldingBookingFilter() {
  const cutoff = new Date(Date.now() - DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000);
  return {
    OR: [
      {
        status: {
          in: ["PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS", "RESCHEDULE_PENDING"],
        } as any,
      },
      {
        status: "REQUESTED" as any,
        OR: [
          // مهلت هنوز تمام نشده
          { createdAt: { gte: cutoff } },
          // یا بیعانه پرداخت شده و منتظر تأیید ادمین است
          { payments: { some: { purpose: "DEPOSIT" as any, status: "PAID" as any } } },
        ],
      },
    ],
  };
}

/**
 * لغو خودکار درخواست‌هایی که تا مهلت مقرر بیعانه‌شان پرداخت نشده است.
 * با آزاد شدن این رزروها، زمان رزروشده برای هنرمند آزاد می‌شود.
 *
 * این تابع Idempotent است و از چند نقطه (صفحه رزرو مشتری/ادمین) صدا زده می‌شود.
 */
export async function expireUnpaidBookingRequests(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000);
    const candidates = await db.booking.findMany({
      where: { status: "REQUESTED", createdAt: { lt: cutoff } },
      select: { id: true, bookingNumber: true, clientId: true, artistId: true },
      take: 200,
    });
    if (candidates.length === 0) return 0;

    const paid = await db.payment.findMany({
      where: {
        bookingId: { in: candidates.map((b) => b.id) },
        purpose: "DEPOSIT",
        status: "PAID",
      },
      select: { bookingId: true },
    });
    const paidSet = new Set(paid.map((p) => p.bookingId));
    const toExpire = candidates.filter((b) => !paidSet.has(b.id));
    if (toExpire.length === 0) return 0;

    for (const b of toExpire) {
      await db.booking.update({
        where: { id: b.id },
        data: {
          status: "CANCELLED_BY_CLIENT",
          cancellationReason: `عدم پرداخت بیعانه در مهلت ${DEPOSIT_WINDOW_HOURS} ساعته`,
        },
      });
      await db.payment
        .updateMany({
          where: { bookingId: b.id, purpose: "DEPOSIT", status: "PENDING" },
          data: { status: "CANCELLED" },
        })
        .catch(() => undefined);
      await db.notification
        .create({
          data: {
            userId: b.clientId,
            title: "رزرو شما لغو شد ⏰",
            message: `مهلت ${DEPOSIT_WINDOW_HOURS} ساعته برای پرداخت بیعانه رزرو ${b.bookingNumber} به پایان رسید و رزرو لغو شد. زمان رزروشده آزاد شد؛ می‌توانید دوباره رزرو کنید.`,
            type: "WARNING",
            link: "/client/bookings",
            data: { bookingId: b.id, bookingNumber: b.bookingNumber },
          },
        })
        .catch(() => undefined);
    }

    return toExpire.length;
  } catch (err) {
    console.error("خطا در لغو خودکار درخواست‌های بدون بیعانه:", err);
    return 0;
  }
}

export async function hasPaidDeposit(bookingId: string): Promise<boolean> {
  const p = await db.payment.findFirst({
    where: { bookingId, purpose: "DEPOSIT", status: "PAID" },
    select: { id: true },
  });
  return !!p;
}

export type BookingMoney = {
  agreed: bigint;
  paidTotal: bigint;
  depositPaid: boolean;
  remainderDue: bigint;
};

/** جمع‌بندی مالی یک رزرو: مبلغ توافق‌شده، مجموع پرداختی‌ها، وضعیت بیعانه، باقی‌مانده */
export async function getBookingMoney(bookingId: string): Promise<BookingMoney | null> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { agreedPrice: true },
  });
  if (!booking?.agreedPrice) return null;
  const agreed = booking.agreedPrice;
  const payments = await db.payment.findMany({
    where: { bookingId, status: "PAID" },
    select: { amount: true, purpose: true },
  });
  const paidTotal = payments.reduce((s, p) => s + p.amount, BigInt(0));
  const depositPaid = payments.some((p) => p.purpose === "DEPOSIT");
  const remainderDue = paidTotal >= agreed ? BigInt(0) : agreed - paidTotal;
  return { agreed, paidTotal, depositPaid, remainderDue };
}

async function ensureWallet(tx: any, userId: string) {
  let wallet = await tx.wallet.findUnique({ where: { ownerId: userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        ownerId: userId,
        balance: BigInt(0),
        pendingBalance: BigInt(0),
        withdrawableBalance: BigInt(0),
        frozenBalance: BigInt(0),
        totalDeposited: BigInt(0),
        totalWithdrawn: BigInt(0),
      },
    });
  }
  return wallet;
}

/**
 * تسویه رزرو تکمیل‌شده:
 * - ثبت کارمزد پلتفرم (درصد بیعانه تنظیم‌شده) در اولین فرصت (روی بیعانه)
 * - واریز سهم هنرمند (پرداختی‌ها منهای کارمزد ثبت‌شده) به موجودی قابل برداشت
 * - Idempotent: مبالغ قبلاً ثبت‌شده دوباره محاسبه نمی‌شوند
 */
export async function settleCompletedBooking(bookingId: string): Promise<{ settled: bigint }> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, agreedPrice: true, artistId: true },
  });
  if (!booking || booking.status !== "COMPLETED" || !booking.agreedPrice) {
    return { settled: BigInt(0) };
  }

  const agreed = booking.agreedPrice;
  const feePercent = await getDepositPercent();
  const feeTotal = await platformFee(agreed);

  const paid = await db.payment.findMany({
    where: { bookingId, status: "PAID" },
    select: { amount: true },
  });
  const paidTotal = paid.reduce((s, p) => s + p.amount, BigInt(0));
  if (paidTotal <= BigInt(0)) return { settled: BigInt(0) };

  return db.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, booking.artistId);

    const recorded = await tx.transaction.findMany({
      where: { referenceId: bookingId, referenceType: "booking", isCompleted: true },
      select: { type: true, amount: true },
    });
    const feeRecorded = recorded
      .filter((t) => t.type === "PLATFORM_FEE")
      .reduce((s, t) => s + (t.amount > BigInt(0) ? t.amount : -t.amount), BigInt(0));
    const incomeRecorded = recorded
      .filter((t) => t.type === "BOOKING_INCOME")
      .reduce((s, t) => s + t.amount, BigInt(0));

    let settled = BigInt(0);

    // ۱) ثبت کارمزد پلتفرم (تا سقف درصد بیعانه تنظیم‌شده و تا سقف پرداختی‌ها)
    const feeDue = feeTotal - feeRecorded;
    const feePayable = feeDue > BigInt(0) ? (paidTotal - incomeRecorded - feeRecorded > BigInt(0) ? (paidTotal - incomeRecorded - feeRecorded < feeDue ? paidTotal - incomeRecorded - feeRecorded : feeDue) : BigInt(0)) : BigInt(0);
    if (feePayable > BigInt(0)) {
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: booking.artistId,
          type: "PLATFORM_FEE",
          amount: feePayable,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          description: `کارمزد پلتفرم (${feePercent}٪) رزرو ${bookingId}`,
          referenceId: bookingId,
          referenceType: "booking",
          isCompleted: true,
        },
      });
    }

    // ۲) واریز سهم هنرمند به موجودی قابل برداشت
    const artistDue = paidTotal - (feeRecorded + feePayable) - incomeRecorded;
    if (artistDue > BigInt(0)) {
      const before = await tx.wallet.findUnique({
        where: { id: wallet.id },
        select: { withdrawableBalance: true },
      });
      const wbBefore = before?.withdrawableBalance ?? BigInt(0);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          withdrawableBalance: { increment: artistDue },
          totalDeposited: { increment: artistDue },
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: booking.artistId,
          type: "BOOKING_INCOME",
          amount: artistDue,
          balanceBefore: wbBefore,
          balanceAfter: wbBefore + artistDue,
          description: `سهم هنرمند از رزرو ${bookingId} (پس از کسر کارمزد پلتفرم)`,
          referenceId: bookingId,
          referenceType: "booking",
          isCompleted: true,
        },
      });
      try {
        await tx.artistProfile.updateMany({
          where: { userId: booking.artistId },
          data: { totalEarnings: { increment: artistDue } },
        });
      } catch {
        /* best-effort */
      }
      settled = artistDue;
    }

    return { settled };
  });
}

/** ثبت فوری کارمزد پلتفرم هنگام پرداخت بیعانه (سهم پلتفرم همان ابتدا) */
export async function recordPlatformFeeOnDeposit(bookingId: string, artistUserId: string, deposit: bigint): Promise<void> {
  try {
    const feePercent = await getDepositPercent();
    await db.$transaction(async (tx) => {
      const wallet = await ensureWallet(tx, artistUserId);
      const existing = await tx.transaction.findFirst({
        where: { referenceId: bookingId, referenceType: "booking", type: "PLATFORM_FEE" },
        select: { id: true },
      });
      if (existing) return;
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: artistUserId,
          type: "PLATFORM_FEE",
          amount: deposit,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          description: `کارمزد پلتفرم (بیعانه ${feePercent}٪) رزرو ${bookingId}`,
          referenceId: bookingId,
          referenceType: "booking",
          isCompleted: true,
        },
      });
    });
  } catch {
    /* best-effort — تسویه نهایی در settleCompletedBooking جبران می‌کند */
  }
}
