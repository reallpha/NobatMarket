"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getClientPayments, initiatePayment, createRemainderPayment } from "@/services/payment.service";
import {
  formatPrice,
  formatJalaliDate,
  toPersianNumbers,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_PURPOSE_LABELS,
  PAYMENT_STATUS_STYLES,
} from "@/lib/utils";

/** یک ردیف از تاریخچهٔ پرداخت‌های مشتری */
type PaymentHistoryRow = {
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
};

type BookingPay = {
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
  depositDeadline: string;
  depositWindowHours: number;
  pending: { id: string; amount: string; purpose: string }[];
};

/** فاصله زمانی تا مهلت بیعانه به شکل خوانا */
function remainingText(deadline: string): { expired: boolean; text: string } {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { expired: true, text: "مهلت تمام شده" };
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return { expired: false, text: `${toPersianNumbers(hours)} ساعت و ${toPersianNumbers(minutes)} دقیقه` };
  }
  return { expired: false, text: `${toPersianNumbers(minutes)} دقیقه` };
}

export default function ClientPaymentsPanel({
  highlightId,
  paymentStatus,
  depositPercent = 20,
}: {
  highlightId?: string;
  /** وضعیتی که درگاه/سرور پس از بازگشت در آدرس گذاشته است */
  paymentStatus?: string;
  /** درصد بیعانه از تنظیمات ادمین (DEPOSIT_PERCENT) */
  depositPercent?: number;
}) {
  const [bookings, setBookings] = useState<BookingPay[]>([]);
  const [history, setHistory] = useState<PaymentHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  // برای به‌روزرسانی شمارش معکوس مهلت بیعانه
  const [, setTick] = useState(0);

  useEffect(() => {
    getClientPayments().then((r) => {
      if (r.success && r.data) {
        setBookings(r.data.bookings as BookingPay[]);
        setHistory((r.data.history as PaymentHistoryRow[]) || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const goGateway = async (kind: string, fn: () => Promise<{ success: boolean; message?: string; data?: any }>) => {
    setPaying(kind);
    try {
      const r = await fn();
      if (r.success && (r.data as any)?.url) {
        window.location.href = (r.data as any).url;
      } else {
        toast.error((r as any).message || "خطا در اتصال به درگاه");
      }
    } catch {
      toast.error("خطا در ارتباط");
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-zinc-900/60" />;

  return (
    <div className="space-y-4">
      {/* ─── پیام نتیجهٔ بازگشت از درگاه ─── */}
      {paymentStatus && (
        <div
          className={`rounded-2xl border px-5 py-4 text-[12.5px] leading-relaxed ${
            paymentStatus === "success"
              ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200"
              : paymentStatus === "invalid"
                ? "border-zinc-600/40 bg-zinc-800/40 text-zinc-300"
                : "border-red-500/30 bg-red-500/[0.07] text-red-200"
          }`}
        >
          <p className="font-bold">
            {paymentStatus === "success" && "پرداخت شما با موفقیت ثبت شد ✓"}
            {paymentStatus === "failed" && "پرداخت انجام نشد ✕"}
            {paymentStatus === "error" && "در تأیید پرداخت مشکلی پیش آمد ⚠"}
            {paymentStatus === "invalid" && "اطلاعات بازگشتی درگاه کامل نبود ⚠"}
          </p>
          <p className="mt-1 opacity-85">
            {paymentStatus === "success" &&
              "بیعانه دریافت شد و درخواست شما برای تأیید به مدیریت ارسال شد. وضعیت آن را در «تاریخچه پرداخت‌ها» پایین همین صفحه ببینید."}
            {paymentStatus === "failed" &&
              "اگر مبلغی از حساب شما کسر شده باشد، به‌صورت خودکار بازگردانده می‌شود. می‌توانید دوباره تلاش کنید."}
            {paymentStatus === "error" &&
              "اگر مبلغی کسر شده اما اینجا «پرداخت شده» نمی‌بینید، با پشتیبانی تماس بگیرید و شماره پیگیری را اعلام کنید."}
            {paymentStatus === "invalid" &&
              "این حالت وقتی رخ می‌دهد که آدرس بازگشت درگاه ناقص باشد. اگر مبلغی از حساب شما کسر شده، با پشتیبانی تماس بگیرید."}
          </p>
        </div>
      )}

      {/* ─── راهنمای شفاف پرداخت ─── */}
      <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-l from-amber-500/[0.08] to-transparent">
        <div className="flex items-center gap-2.5 border-b border-amber-500/20 bg-amber-500/[0.06] px-5 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <h2 className="text-sm font-black text-amber-300">
            تا بیعانه را پرداخت نکنید، رزرو شما ثبت‌شده حساب نمی‌شود
          </h2>
        </div>

        <div className="space-y-3 px-5 py-4 text-[12.5px] leading-relaxed text-amber-100/85">
          <p className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>
              <b className="text-amber-200">
                بیعانه {toPersianNumbers(depositPercent)}٪
              </b>{" "}
              مبلغ توافق‌شده، همان <b className="text-amber-200">سهم پلتفرم</b> است و
              تنها با پرداخت آن، درخواست شما به مدیریت ارسال و سپس برای هنرمند فرستاده می‌شود.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>
              زمان رزروشده فقط <b className="text-amber-200">۴ ساعت</b> برای شما نگه داشته می‌شود. اگر در این مدت بیعانه
              پرداخت نشود، رزرو <b className="text-amber-200">لغو می‌شود</b> و آن زمان برای هنرمند و سایر مشتریان آزاد می‌گردد.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            <span>
              <b className="text-rose-300">باقی‌مانده (سهم هنرمند)</b> را پس از انجام تتو از همین صفحه پرداخت کنید تا
              پروژه تکمیل و تسویه شود.
            </span>
          </p>
        </div>
      </div>

      {/* ─── هشدار رزروهای بدون بیعانه ─── */}
      {bookings.filter((b) => !b.depositPaid && b.status === "REQUESTED").length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] px-5 py-4">
          <p className="text-[13px] font-bold text-rose-300">
            {toPersianNumbers(
              bookings.filter((b) => !b.depositPaid && b.status === "REQUESTED").length
            )}{" "}
            رزرو شما هنوز بیعانه ندارد
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-rose-200/75">
            این رزروها هنوز برای هنرمند ارسال نشده‌اند و زمان‌شان در حال از دست رفتن است. با پرداخت بیعانه در بخش زیر،
            فوراً به مرحله تأیید مدیریت می‌روند.
          </p>
        </div>
      )}

      {bookings.length === 0 && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-10 text-center text-sm text-zinc-500">
          هنوز رزروی ثبت نشده است.
        </p>
      )}

      {bookings.map((b) => (
        <div
          key={b.id}
          className={`rounded-2xl border p-5 backdrop-blur-sm transition-colors ${
            highlightId === b.id ? "border-rose-500/50 bg-rose-500/[0.04]" : "border-zinc-800/60 bg-zinc-900/40"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white">{b.title}</h3>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400" dir="ltr">{b.bookingNumber}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {b.artistSlug ? (
                  <Link href={`/artists/${b.artistSlug}`} className="text-rose-400 hover:text-rose-300">{b.artistName}</Link>
                ) : b.artistName}
                {" · "}{formatJalaliDate(new Date(b.scheduledDate), "short")}
                {" · "}{BOOKING_STATUS_LABELS[b.status] || b.status}
              </p>
            </div>
            <div className="text-left text-sm">
              <p className="text-zinc-500 text-xs">مبلغ توافق‌شده</p>
              <p className="font-bold text-white">{b.agreedPrice ? formatPrice(Number(b.agreedPrice)) : "—"}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <p className={`text-base font-bold ${b.depositPaid ? "text-emerald-400" : "text-amber-400"}`}>
                {b.depositPaid ? "پرداخت شده ✓" : "پرداخت نشده"}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                بیعانه {toPersianNumbers(depositPercent)}٪
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <p className="text-base font-bold text-white">{formatPrice(Number(b.paidTotal), false)}</p>
              <p className="mt-0.5 text-[10px] text-zinc-500">پرداخت‌شده (تومان)</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <p className="text-base font-bold text-rose-400">{formatPrice(Number(b.remainderDue), false)}</p>
              <p className="mt-0.5 text-[10px] text-zinc-500">باقی‌مانده (تومان)</p>
            </div>
          </div>

          {/* هشدار و شمارش معکوس مهلت بیعانه */}
          {!b.depositPaid && b.status === "REQUESTED" && (() => {
            const rem = remainingText(b.depositDeadline);
            return (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 ${
                  rem.expired
                    ? "border-red-500/40 bg-red-500/[0.08]"
                    : "border-amber-500/30 bg-amber-500/[0.07]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-[12.5px] font-bold ${rem.expired ? "text-red-300" : "text-amber-300"}`}>
                    ⏰ این زمان فقط {toPersianNumbers(b.depositWindowHours)} ساعت برای شما نگه داشته می‌شود
                  </p>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      rem.expired
                        ? "bg-red-500/20 text-red-200"
                        : "bg-amber-500/20 text-amber-100"
                    }`}
                  >
                    {rem.expired ? "مهلت تمام شده" : `باقی‌مانده: ${rem.text}`}
                  </span>
                </div>
                <p className={`mt-2 text-[11.5px] leading-relaxed ${rem.expired ? "text-red-200/75" : "text-amber-200/75"}`}>
                  تا پرداخت بیعانه، رزرو شما برای هنرمند ارسال نمی‌شود؛ یعنی در عمل رزروی انجام نشده است. با پایان یافتن
                  این مهلت، رزرو لغو و زمان رزروشده برای هنرمند آزاد می‌شود.
                </p>
              </div>
            );
          })()}

          <div className="mt-4 flex flex-wrap gap-2">
            {!b.depositPaid && b.pending.filter((p) => p.purpose === "DEPOSIT").map((p) => (
              <button
                key={p.id}
                disabled={paying === p.id}
                onClick={() => goGateway(p.id, () => initiatePayment(p.id))}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-50"
              >
                {paying === p.id ? "در حال اتصال..." : `پرداخت بیعانه (${formatPrice(Number(p.amount), false)} تومان)`}
              </button>
            ))}
            {b.depositPaid && Number(b.remainderDue) > 0 && ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status) && (
              <button
                disabled={paying === b.id}
                onClick={() => goGateway(b.id, () => createRemainderPayment(b.id))}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-500 disabled:opacity-50"
              >
                {paying === b.id ? "در حال اتصال..." : `پرداخت باقی‌مانده (${toPersianNumbers(Number(b.remainderDue).toLocaleString("fa-IR"))} تومان)`}
              </button>
            )}
            {!b.depositPaid && (
              <span className="self-center text-[11px] font-medium text-rose-400/80">
                بدون پرداخت بیعانه، رزرو شما به هنرمند ارسال نمی‌شود
              </span>
            )}
          </div>
        </div>
      ))}

      {/* ─── تاریخچهٔ پرداخت‌ها ─── */}
      <div className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-white">تاریخچه پرداخت‌ها</h2>
          {history.length > 0 && (
            <span className="text-[11px] text-zinc-500">
              {toPersianNumbers(history.length)} تراکنش
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-xs text-zinc-500">
            هنوز تراکنشی ثبت نشده است.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
            {history.map((p, i) => (
              <div
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 ${
                  i > 0 ? "border-t border-zinc-800/60" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        PAYMENT_STATUS_STYLES[p.status] ||
                        "border-zinc-600/40 bg-zinc-700/20 text-zinc-400"
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[p.status] || p.status}
                    </span>
                    <span className="text-[12px] font-bold text-zinc-200">
                      {PAYMENT_PURPOSE_LABELS[p.purpose] || p.purpose}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {p.bookingTitle}
                    {" · "}
                    <span dir="ltr">{p.bookingNumber}</span>
                    {" · "}
                    {formatJalaliDate(new Date(p.paidAt || p.createdAt), "short")}
                  </p>
                  {p.refId && (
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      شماره پیگیری: <span dir="ltr">{p.refId}</span>
                    </p>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-white">
                    {formatPrice(Number(p.amount), false)}
                  </p>
                  <p className="text-[10px] text-zinc-500">تومان</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-[10.5px] leading-relaxed text-zinc-600">
          «در انتظار پرداخت» یعنی تراکنش هنوز نهایی نشده است؛ «ناموفق» و «لغو شده» یعنی مبلغی از حساب
          شما کسر نشده است.
        </p>
      </div>
    </div>
  );
}
