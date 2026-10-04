"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatJalaliDate, toPersianNumbers } from "@/lib/utils";

type ModerationItem = {
  id: string;
  type: "portfolio" | "flash";
  title: string;
  description: string | null;
  image: string | null;
  style: string;
  price: string | null;
  status: string;
  createdAt: string;
  artistName: string;
  artistSlug: string;
  artistAvatar: string | null;
};

const STYLE_LABELS: Record<string, string> = {
  REALISM: "رئالیسم",
  FINE_LINE: "فاین‌لاین",
  MINIMAL: "مینیمال",
  DOTWORK: "داتورک",
  BLACKWORK: "بلک‌ورک",
  WATERCOLOR: "واتروکالر",
  GEOMETRIC: "ژئومتریک",
  NEO_TRADITIONAL: "نئوتید",
  BLACK_AND_GREY: "سیاه و سفید",
  OLD_SCHOOL: "اولد اسکول",
  JAPANESE: "ژاپنی",
  TRIBAL: "ترایبال",
  LINE_ART: "لاین آرت",
  COLOR: "رنگی",
  OTHER: "سایر",
};

type StatusKey = "pending" | "approved" | "rejected";

function itemStatus(item: ModerationItem): StatusKey {
  if (item.status === "PUBLISHED" || item.status === "APPROVED") return "approved";
  if (item.status === "ARCHIVED" || item.status === "REJECTED") return "rejected";
  return "pending";
}

const STATUS_META: Record<StatusKey, { label: string; classes: string }> = {
  pending: { label: "در انتظار بررسی", classes: "bg-amber-500/15 text-amber-400" },
  approved: { label: "تأیید شده", classes: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "رد شده", classes: "bg-red-500/15 text-red-400" },
};

function StatusPill({ type }: { type: "portfolio" | "flash" }) {
  return type === "portfolio" ? (
    <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-400">نمونه‌کار</span>
  ) : (
    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-medium text-purple-400">تتوی فلش</span>
  );
}

export function ModerationPanel({
  initialItems,
  total,
}: {
  initialItems: ModerationItem[];
  total: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "portfolio" | "flash">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");
  const [rejectItem, setRejectItem] = useState<ModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, approved: 0, rejected: 0, portfolio: 0, flash: 0 };
    for (const it of items) {
      c[itemStatus(it)]++;
      if (it.type === "portfolio") c.portfolio++;
      else c.flash++;
    }
    return c;
  }, [items]);

  const filtered = items.filter(
    (i) =>
      (typeFilter === "all" || i.type === typeFilter) &&
      (statusFilter === "all" || itemStatus(i) === statusFilter)
  );

  const refresh = () => {
    setItems((prev) => prev);
    router.refresh();
  };

  const runAction = async (item: ModerationItem, action: "approve" | "reject" | "delete") => {
    setBusyId(item.id);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/moderation?type=${item.type}&id=${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success("اثر حذف شد");
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          refresh();
        } else {
          toast.error(data.error || "خطا در حذف");
        }
      } else {
        const res = await fetch("/api/admin/moderation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: item.type,
            id: item.id,
            action,
            reason: action === "reject" ? rejectReason : undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || (action === "approve" ? "تأیید شد" : "رد شد"));
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          refresh();
        } else {
          toast.error(data.error || "خطا در انجام عملیات");
        }
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setBusyId(null);
      setRejectBusy(false);
      setRejectItem(null);
      setRejectReason("");
    }
  };

  const openReject = (item: ModerationItem) => {
    setRejectItem(item);
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectItem) return;
    if (!rejectReason.trim()) {
      toast.error("لطفاً دلیل رد را وارد کنید");
      return;
    }
    setRejectBusy(true);
    await runAction(rejectItem, "reject");
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(231,68,68,0.08),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white">بازبینی آثار هنرمندان</h1>
              <p className="mt-0.5 text-sm text-zinc-400">
                همه نمونه‌کارها و تتوهای فلش — تأیید، رد با ذکر دلیل، یا حذف.
              </p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
            {([
              { key: "all" as const, label: `همه (${toPersianNumbers(counts.all)})` },
              { key: "portfolio" as const, label: `نمونه‌کار (${toPersianNumbers(counts.portfolio)})` },
              { key: "flash" as const, label: `تتوی فلش (${toPersianNumbers(counts.flash)})` },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                  typeFilter === t.key ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* فیلتر وضعیت */}
        <div className="relative mt-4 flex flex-wrap gap-2">
          {([
            { key: "all" as const, label: `همه وضعیت‌ها` },
            { key: "pending" as const, label: `در انتظار (${toPersianNumbers(counts.pending)})` },
            { key: "approved" as const, label: `تأیید شده (${toPersianNumbers(counts.approved)})` },
            { key: "rejected" as const, label: `رد شده (${toPersianNumbers(counts.rejected)})` },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === t.key
                  ? "border-rose-500 bg-rose-500/15 text-rose-300"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">اثری در این دسته نیست</h3>
          <p className="mt-1 text-sm text-zinc-500">با تغییر فیلتر، آثار دیگری را مشاهده کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const st = itemStatus(item);
            return (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700">
                {/* تصویر */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800/40">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                  <div className="absolute right-2 top-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill type={item.type} />
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_META[st].classes}`}>
                      {STATUS_META[st].label}
                    </span>
                  </div>
                </div>

                {/* اطلاعات */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        {STYLE_LABELS[item.style] || item.style}
                        {item.price ? ` • ${toPersianNumbers(Number(item.price).toLocaleString("fa-IR"))} تومان` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-zinc-800/60 pt-3">
                    <a href={`/artists/${item.artistSlug}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2">
                      {item.artistAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.artistAvatar} alt="" className="h-7 w-7 rounded-full border border-white/10 object-cover" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xs font-bold text-rose-300">{item.artistName[0]}</span>
                      )}
                      <span className="truncate text-xs font-medium text-zinc-300">{item.artistName}</span>
                    </a>
                    <span className="mr-auto text-[10px] text-zinc-600">{formatJalaliDate(new Date(item.createdAt), "short")}</span>
                  </div>

                  {/* اکشن‌ها */}
                  <div className="mt-3 flex items-center gap-2">
                    {st !== "approved" && (
                      <button
                        onClick={() => runAction(item, "approve")}
                        disabled={busyId === item.id}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        ✓ تأیید و انتشار
                      </button>
                    )}
                    {st === "approved" && (
                      <span className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-400">
                        منتشر شده
                      </span>
                    )}
                    {st !== "rejected" && (
                      <button
                        onClick={() => openReject(item)}
                        disabled={busyId === item.id}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        رد
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`آیا از حذف «${item.title}» اطمینان دارید؟`)) runAction(item, "delete");
                      }}
                      disabled={busyId === item.id}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                      title="حذف"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* دیالوگ رد با ذکر دلیل */}
      {rejectItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !rejectBusy && setRejectItem(null)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">رد اثر: {rejectItem.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              دلیل رد به هنرمند ({rejectItem.artistName}) در بخش اعلان‌ها ارسال می‌شود.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
              placeholder="دلیل رد را بنویسید (مثلاً: کیفیت تصویر پایین است، محتوای نامناسب، ...)"
              className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectItem(null)}
                disabled={rejectBusy}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={submitReject}
                disabled={rejectBusy || !rejectReason.trim()}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {rejectBusy ? "در حال ارسال..." : "رد و ارسال دلیل"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}