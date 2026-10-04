"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getArtistPayments, sendPaymentReminder } from "@/services/payment.service";
import { requestPayout } from "@/services/wallet.service";
import { formatPrice, formatJalaliDate, toPersianNumbers, BOOKING_STATUS_LABELS, isValidCardNumber, isValidIban } from "@/lib/utils";

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
  clientName: string;
};

export default function ArtistPaymentsPanel() {
  const [data, setData] = useState<{
    wallet: { balance: string; withdrawable: string; pending: string; frozen: string } | null;
    bookings: BookingPay[];
    withdrawals: { id: string; amount: string; status: string; createdAt: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<string | null>(null);

  // فرم برداشت
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [card, setCard] = useState("");
  const [holder, setHolder] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const refresh = () => {
    getArtistPayments().then((r) => {
      if (r.success && r.data) setData(r.data as any);
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);

  const handleRemind = async (id: string) => {
    setReminding(id);
    try {
      const r = await sendPaymentReminder(id);
      if (r.success) toast.success("یادآوری پرداخت ارسال شد");
      else toast.error((r as any).message || "خطا");
    } catch {
      toast.error("خطا در ارتباط");
    } finally {
      setReminding(null);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("مبلغ معتبر وارد کنید"); return; }
    if (!isValidIban(iban)) { toast.error("شماره شبا معتبر نیست (IR + ۲۴ رقم)"); return; }
    if (card && !isValidCardNumber(card.replace(/[\s-]/g, ""))) { toast.error("شماره کارت معتبر نیست"); return; }
    if (!holder.trim()) { toast.error("نام صاحب حساب الزامی است"); return; }
    setWithdrawing(true);
    try {
      const r = await requestPayout({
        amount: Number(amount),
        destinationIban: iban.trim(),
        accountHolderName: holder.trim(),
        cardNumber: card.trim() || undefined,
      });
      if (r.success) {
        toast.success("درخواست ثبت شد؛ تسویه حداکثر ظرف ۷۲ ساعت کاری");
        setAmount(""); setIban(""); setCard(""); setHolder("");
        refresh();
      } else {
        toast.error((r as any).message || "خطا");
      }
    } catch {
      toast.error("خطا در ارتباط");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !data) return <div className="h-64 animate-pulse rounded-xl bg-zinc-900/60" />;

  return (
    <div className="space-y-6">
      {/* کیف پول */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "قابل برداشت", value: data.wallet ? formatPrice(Number(data.wallet.withdrawable), false) : "—", color: "text-emerald-400" },
          { label: "در انتظار تسویه", value: data.wallet ? formatPrice(Number(data.wallet.pending), false) : "—", color: "text-amber-400" },
          { label: "مسدود (در بررسی)", value: data.wallet ? formatPrice(Number(data.wallet.frozen), false) : "—", color: "text-zinc-300" },
          { label: "موجودی کل", value: data.wallet ? formatPrice(Number(data.wallet.balance), false) : "—", color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-[11px] text-zinc-500">{s.label} (تومان)</p>
          </div>
        ))}
      </div>

      {/* رزروها */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">وضعیت مالی رزروها</h2>
        {data.bookings.length === 0 && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-sm text-zinc-500">رزروی ثبت نشده است.</p>
        )}
        {data.bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{b.title}</h3>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400" dir="ltr">{b.bookingNumber}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {b.clientName} · {formatJalaliDate(new Date(b.scheduledDate), "short")} · {BOOKING_STATUS_LABELS[b.status] || b.status}
                </p>
              </div>
              <div className="flex gap-4 text-center text-xs">
                <div><p className="text-zinc-500">توافق‌شده</p><p className="font-bold text-white">{b.agreedPrice ? formatPrice(Number(b.agreedPrice), false) : "—"}</p></div>
                <div><p className="text-zinc-500">پرداخت‌شده</p><p className="font-bold text-emerald-400">{formatPrice(Number(b.paidTotal), false)}</p></div>
                <div><p className="text-zinc-500">باقی‌مانده</p><p className="font-bold text-rose-400">{formatPrice(Number(b.remainderDue), false)}</p></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${b.depositPaid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                بیعانه: {b.depositPaid ? "دریافت شد" : "پرداخت نشده"}
              </span>
              {Number(b.remainderDue) > 0 && ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status) && (
                <button
                  disabled={reminding === b.id}
                  onClick={() => handleRemind(b.id)}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {reminding === b.id ? "در حال ارسال..." : "ارسال یادآوری پرداخت + لینک"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* برداشت وجه */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
        <h2 className="text-base font-bold text-white">درخواست برداشت وجه</h2>
        <p className="mt-1 text-[11px] text-zinc-500">مبلغ موردنظر با ثبت شماره کارت/شبا واریز می‌شود — تسویه حداکثر ظرف ۷۲ ساعت کاری.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">مبلغ (تومان) *</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" inputMode="numeric" placeholder="مثال: 5000000" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">نام صاحب حساب *</label>
            <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="نام کامل" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">شماره شبا *</label>
            <input value={iban} onChange={(e) => setIban(e.target.value)} dir="ltr" placeholder="IR..." className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-rose-500/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">شماره کارت (اختیاری)</label>
            <input value={card} onChange={(e) => setCard(e.target.value)} dir="ltr" inputMode="numeric" placeholder="۱۶ رقم" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-rose-500/50" />
          </div>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {withdrawing ? "در حال ثبت..." : "ثبت درخواست برداشت"}
        </button>

        {data.withdrawals.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold text-zinc-400">سوابق برداشت</p>
            {data.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs">
                <span className="font-bold text-white">{toPersianNumbers(Number(w.amount).toLocaleString("fa-IR"))} تومان</span>
                <span className="text-zinc-500">{formatJalaliDate(new Date(w.createdAt), "short")}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${w.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : w.status === "REJECTED" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {w.status === "APPROVED" ? "تأیید شده" : w.status === "REJECTED" ? "رد شده" : "در انتظار"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
