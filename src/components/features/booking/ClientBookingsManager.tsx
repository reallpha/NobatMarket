"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate, toPersianNumbers } from "@/lib/utils";

type BookingStatus =
  | "REQUESTED"
  | "PENDING_ARTIST"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_ARTIST"
  | "NO_SHOW"
  | "RESCHEDULE_PENDING";

type SerializedBooking = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  title: string;
  description: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  agreedPrice: string | null;
  bodyPlacement: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  createdAt: string;
  artist: { id: string; displayName: string; avatarUrl: string | null; slug: string | null };
  service: { id: string; name: string; basePrice: number; durationMinutes: number } | null;
  serviceId: string | null;
  /** آیا بیعانه (۲۰٪) پرداخت شده است */
  depositPaid: boolean;
  /** مبلغ بیعانه به تومان (رشته) */
  depositAmount: string | null;
  /** مهلت پرداخت بیعانه */
  depositDeadline: string;
  depositWindowHours: number;
};

const STATUS_CONFIG: Record<BookingStatus, { label: string; chip: string; dot: string }> = {
  REQUESTED: { label: "در انتظار پرداخت بیعانه", chip: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  PENDING_ARTIST: { label: "در انتظار تأیید هنرمند", chip: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400" },
  CONFIRMED: { label: "تأیید شده", chip: "bg-green-500/10 text-green-400", dot: "bg-green-400" },
  IN_PROGRESS: { label: "در حال انجام", chip: "bg-purple-500/10 text-purple-400", dot: "bg-purple-400" },
  COMPLETED: { label: "تکمیل شده", chip: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  CANCELLED_BY_CLIENT: { label: "لغو شده (شما)", chip: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  CANCELLED_BY_ARTIST: { label: "لغو شده (هنرمند)", chip: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  NO_SHOW: { label: "عدم حضور", chip: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-400" },
  RESCHEDULE_PENDING: { label: "در انتظار تغییر زمان", chip: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400" },
};

/** برچسب وضعیت — برای درخواست‌های REQUESTED به پرداخت بیعانه وابسته است */
function statusMeta(b: SerializedBooking) {
  const base = STATUS_CONFIG[b.status] || STATUS_CONFIG.REQUESTED;
  if (b.status === "REQUESTED" && b.depositPaid) {
    return { label: "در انتظار تأیید ادمین", chip: "bg-sky-500/10 text-sky-400", dot: "bg-sky-400" };
  }
  if (b.status === "REQUESTED" && !b.depositPaid) {
    return { label: "در انتظار پرداخت بیعانه", chip: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" };
  }
  return base;
}

const PERSIAN_WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const CANCEL_REASONS = [
  "تغییر برنامه",
  "مشکل مالی",
  "پشیمان شدم",
  "پیدا کردن هنرمند بهتر",
  "سایر",
];

type FilterKey = "upcoming" | "active" | "past" | "all";

export function ClientBookingsManager({ bookings: initialBookings }: { bookings: SerializedBooking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SerializedBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  // دیالوگ انتخاب زمان جدید (پس از درخواست تغییر زمان توسط هنرمند)
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<SerializedBooking | null>(null);
  type DaySlots = {
    date: string;
    weekday: number;
    isToday: boolean;
    slots: { startTime: string; endTime: string }[];
  };
  const [rsDays, setRsDays] = useState<DaySlots[]>([]);
  const [rsDate, setRsDate] = useState("");
  const [rsSlot, setRsSlot] = useState("");
  const [rsLoading, setRsLoading] = useState(false);
  const [rsSaving, setRsSaving] = useState(false);
  const { toast } = useToast();

  const now = Date.now();

  const groups = useMemo(() => {
    const upcoming = bookings.filter(
      (b) =>
        ["REQUESTED", "PENDING_ARTIST", "CONFIRMED", "RESCHEDULE_PENDING"].includes(b.status) &&
        new Date(b.scheduledDate).getTime() >= now
    );
    const active = bookings.filter((b) => b.status === "IN_PROGRESS");
    const past = bookings.filter(
      (b) =>
        ["COMPLETED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST", "NO_SHOW"].includes(b.status) ||
        (new Date(b.scheduledDate).getTime() < now && b.status !== "IN_PROGRESS")
    );
    return { upcoming, active, past };
  }, [bookings, now]);

  const filtered =
    filter === "all"
      ? [...groups.upcoming, ...groups.active, ...groups.past]
      : groups[filter];

  const handleCancel = async () => {
    if (!selectedBooking) return;
    try {
      const { updateBookingStatus } = await import("@/services/booking.service");
      const result = await updateBookingStatus(
        selectedBooking.id,
        "CANCELLED_BY_CLIENT",
        cancelReason + (cancelNote ? ` - ${cancelNote}` : "")
      );

      if (result.success) {
        toast({ title: "رزرو لغو شد" });
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, status: "CANCELLED_BY_CLIENT" as BookingStatus, cancellationReason: cancelReason }
              : b
          )
        );
      } else {
        toast({ title: result.message || "خطا در لغو رزرو", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در لغو رزرو", variant: "destructive" });
    } finally {
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
      setCancelNote("");
    }
  };

  // چت فقط پس از تأیید نهایی (و مراحل بعد از آن) باز می‌شود
  const canChat = (b: SerializedBooking) =>
    ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status);

  // ─── انتخاب زمان جدید ───
  // به جای اجبار مشتری به گشت‌وگذار در تاریخ‌ها، همه زمان‌های خالی
  // هنرمند برای روزهای آینده یک‌جا گرفته و نمایش داده می‌شود.
  const openReschedule = (b: SerializedBooking) => {
    setRescheduleBooking(b);
    setRsDate("");
    setRsSlot("");
    setRsDays([]);
    setRescheduleOpen(true);
    void loadUpcomingSlots(b);
  };

  const loadUpcomingSlots = async (b: SerializedBooking) => {
    if (!b.artist.slug || !b.serviceId) {
      toast({ title: "اطلاعات سرویس این رزرو کامل نیست", variant: "destructive" });
      return;
    }
    setRsLoading(true);
    try {
      const { getUpcomingAvailableSlots } = await import("@/services/booking.service");
      const r = await getUpcomingAvailableSlots(b.artist.slug, b.serviceId, 30);
      if (r.success && r.data) {
        setRsDays(r.data);
        if (r.data.length > 0) {
          setRsDate(r.data[0].date);
          setRsSlot(r.data[0].slots[0]?.startTime || "");
        }
      } else {
        setRsDays([]);
        toast({ title: r.message || "خطا در دریافت زمان‌های آزاد", variant: "destructive" });
      }
    } catch {
      setRsDays([]);
      toast({ title: "خطا در دریافت زمان‌های آزاد", variant: "destructive" });
    } finally {
      setRsLoading(false);
    }
  };

  const rsSelectedDay = rsDays.find((d) => d.date === rsDate) || null;

  const submitReschedule = async () => {
    if (!rescheduleBooking || !rsDate || !rsSlot) {
      toast({ title: "لطفاً تاریخ و ساعت را انتخاب کنید", variant: "destructive" });
      return;
    }
    setRsSaving(true);
    try {
      const { rescheduleBooking: reschedule } = await import("@/services/booking.service");
      const r = await reschedule(rescheduleBooking.id, rsDate, rsSlot);
      if (r.success) {
        const slot = rsSelectedDay?.slots.find((s) => s.startTime === rsSlot);
        toast({ title: r.message || "زمان جدید ثبت شد" });
        setBookings((prev) =>
          prev.map((x) =>
            x.id === rescheduleBooking.id
              ? {
                  ...x,
                  status: "PENDING_ARTIST" as BookingStatus,
                  scheduledDate: new Date(`${rsDate}T00:00:00`).toISOString(),
                  startTime: rsSlot,
                  endTime: slot?.endTime || x.endTime,
                }
              : x
          )
        );
        setRescheduleOpen(false);
        setRescheduleBooking(null);
      } else {
        toast({ title: r.message || "خطا در ثبت زمان جدید", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ثبت زمان جدید", variant: "destructive" });
    } finally {
      setRsSaving(false);
    }
  };

  const deadlineText = (b: SerializedBooking) => {
    const ms = new Date(b.depositDeadline).getTime() - Date.now();
    if (ms <= 0) return "مهلت به پایان رسیده";
    const totalMinutes = Math.floor(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${toPersianNumbers(h)} ساعت و ${toPersianNumbers(m)} دقیقه`;
  };

  const priceText = (b: SerializedBooking) => {
    if (!b.agreedPrice) return null;
    return `${toPersianNumbers(Number(b.agreedPrice).toLocaleString("fa-IR"))} تومان`;
  };

  return (
    <>
      {/* ─── فیلترها ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "upcoming", label: "رزروهای آینده", count: groups.upcoming.length },
            { key: "active", label: "در حال انجام", count: groups.active.length },
            { key: "past", label: "گذشته", count: groups.past.length },
            { key: "all", label: "همه", count: bookings.length },
          ] as { key: FilterKey; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/30"
                : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                filter === tab.key ? "bg-rose-500/20 text-rose-300" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {toPersianNumbers(tab.count)}
            </span>
          </button>
        ))}
      </div>

      {/* ─── لیست ─── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/60">
            <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">رزروی پیدا نشد</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {filter === "upcoming" ? "هنوز رزرو آینده‌ای ندارید." : "در این دسته رزروی وجود ندارد."}
          </p>
          {filter === "upcoming" && (
            <Link
              href="/artists"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500"
            >
              جستجوی هنرمند
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const status = statusMeta(booking);
            // امکان لغو تا زمانی که کار شروع نشده (درخواست، انتظار هنرمند، تغییر زمان، تأیید شده)
            const canCancel = ["REQUESTED", "PENDING_ARTIST", "RESCHEDULE_PENDING", "CONFIRMED"].includes(
              booking.status
            );
            const needsDeposit = booking.status === "REQUESTED" && !booking.depositPaid;
            const canReschedule = booking.status === "RESCHEDULE_PENDING";
            return (
              <div
                key={booking.id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                {/* نوار رنگی وضعیت */}
                <div className={`h-1 w-full ${status.dot} opacity-60`} />

                {/* هشدار پرداخت بیعانه */}
                {needsDeposit && (
                  <div className="border-b border-amber-500/20 bg-amber-500/[0.07] px-5 py-3.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2.5">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        <div>
                          <p className="text-[13px] font-bold text-amber-300">
                            برای ارسال درخواست به هنرمند، بیعانه را پرداخت کنید
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-amber-200/70">
                            تا وقتی بیعانه پرداخت نشود، درخواست شما به هنرمند ارسال نمی‌شود.
                            {booking.depositAmount && (
                              <> مبلغ بیعانه: <b className="text-amber-200">{toPersianNumbers(Number(booking.depositAmount).toLocaleString("fa-IR"))} تومان</b> ·</>
                            )}{" "}
                            فقط {toPersianNumbers(booking.depositWindowHours)} ساعت فرصت دارید (باقی‌مانده: {deadlineText(booking)}).
                            در صورت پرداخت نشدن، رزرو لغو و زمان رزروشده برای هنرمند آزاد می‌شود.
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/client/payments"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black transition-colors hover:bg-amber-400"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        پرداخت بیعانه
                      </Link>
                    </div>
                  </div>
                )}

                {booking.status === "REQUESTED" && booking.depositPaid && (
                  <div className="border-b border-sky-500/20 bg-sky-500/[0.06] px-5 py-2.5 text-[11px] text-sky-300">
                    ✓ بیعانه پرداخت شد — درخواست شما در صف تأیید مدیریت است و پس از تأیید به هنرمند ارسال می‌شود.
                  </div>
                )}

                {canReschedule && (
                  <div className="border-b border-orange-500/20 bg-orange-500/[0.07] px-5 py-3">
                    <p className="text-[12px] font-bold text-orange-300">
                      هنرمند برای این رزرو زمان جدیدی درخواست کرده است
                    </p>
                    <p className="mt-1 text-[11px] text-orange-200/70">
                      زمان‌های خالی هنرمند برایتان نمایش داده می‌شود؛ یکی را انتخاب کنید تا رزرو دوباره برای تأیید به هنرمند ارسال شود.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  {/* آواتار هنرمند */}
                  <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                    {booking.artist.avatarUrl ? (
                      <img
                        src={booking.artist.avatarUrl}
                        alt={booking.artist.displayName}
                        className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-lg font-bold text-rose-300">
                        {booking.artist.displayName?.[0] || "؟"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {booking.artist.displayName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {booking.service?.name || "سرویس"}
                      </p>
                    </div>
                  </div>

                  {/* جزئیات رزرو */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{booking.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formatJalaliDate(new Date(booking.scheduledDate), "date")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {toPersianNumbers(booking.startTime)} تا {toPersianNumbers(booking.endTime)}
                      </span>
                      {booking.service?.durationMinutes ? (
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {toPersianNumbers(booking.service.durationMinutes)} دقیقه
                        </span>
                      ) : null}
                      {priceText(booking) && (
                        <span className="font-semibold text-amber-400">{priceText(booking)}</span>
                      )}
                    </div>
                    {booking.description && (
                      <p className="mt-2 line-clamp-1 text-xs text-zinc-600">{booking.description}</p>
                    )}
                  </div>

                  {/* وضعیت و اکشن‌ها */}
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${status.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {canReschedule && (
                        <Button
                          size="sm"
                          className="bg-orange-500 text-black hover:bg-orange-400"
                          onClick={() => openReschedule(booking)}
                        >
                          انتخاب زمان جدید
                        </Button>
                      )}
                      {canChat(booking) && (
                        <Link
                          href="/client/inbox?tab=chat"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-rose-500/40 hover:text-rose-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          گفتگو
                        </Link>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                        >
                          لغو
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── دیالوگ انتخاب زمان جدید ─── */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        {/*
          چیدمان ریسپانسیو:
          - عرض دیالوگ در موبایل ۹۲٪ عرض صفحه است تا هیچ‌وقت از لبه‌ها بیرون نزند
          - ارتفاع محدود به ۹۰٪ ویوپورت با max-h و بدنه‌ی اسکرول‌شونده
          - min-w-0 روی بدنه تا نوار افقی روزها دیالوگ را پهن نکند
        */}
        <DialogContent className="flex max-h-[90vh] w-[92vw] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg">
          {/* ps-12 = فاصله از سمت راست (شروع در RTL) تا عنوان زیر دکمه‌ی بستن نرود */}
          <DialogHeader className="shrink-0 border-b border-zinc-800 px-5 py-4 ps-12 sm:px-6 sm:ps-12">
            <DialogTitle className="text-base sm:text-lg">انتخاب زمان جدید</DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px] leading-relaxed">
              زمان‌های خالی {rescheduleBooking?.artist.displayName} برای روزهای آینده در ادامه آمده است؛
              کافی است روز و ساعت را انتخاب کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4 sm:px-6">
            {rsLoading ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-xl bg-zinc-800" />
                <div className="h-20 animate-pulse rounded-xl bg-zinc-800" />
              </div>
            ) : rsDays.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 text-center text-xs leading-relaxed text-zinc-500">
                در حال حاضر زمان آزادی برای این هنرمند وجود ندارد.
                <br />
                می‌توانید بعداً دوباره تلاش کنید یا با پشتیبانی نوبت مارکت تماس بگیرید.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-[13px] font-medium text-zinc-300">
                      روزهای دارای زمان آزاد
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {toPersianNumbers(rsDays.length)} روز
                    </span>
                  </div>

                  {/* نوار افقی روزها — فقط همین نوار اسکرول می‌شود، نه کل دیالوگ */}
                  <div className="relative min-w-0">
                    <div className="flex w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain pb-2">
                      {rsDays.map((d) => {
                        const active = d.date === rsDate;
                        const parts = formatJalaliDate(new Date(`${d.date}T12:00:00`), "date").split(" ");
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => {
                              setRsDate(d.date);
                              setRsSlot(d.slots[0]?.startTime || "");
                            }}
                            className={`flex w-[70px] shrink-0 snap-start flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 transition-all sm:w-[84px] ${
                              active
                                ? "border-rose-500/60 bg-rose-500/15"
                                : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-600"
                            }`}
                          >
                            <span className={`w-full truncate text-center text-[10px] ${active ? "text-rose-300" : "text-zinc-500"}`}>
                              {PERSIAN_WEEKDAYS[d.weekday]}
                              {d.isToday ? " (امروز)" : ""}
                            </span>
                            <span className={`text-[12.5px] font-bold ${active ? "text-rose-200" : "text-zinc-200"}`}>
                              {parts[0]} {parts[1]}
                            </span>
                            <span className="text-[10px] text-emerald-400">
                              {toPersianNumbers(d.slots.length)} زمان آزاد
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* نشانه‌ی وجود روزهای بیشتر به سمت چپ (RTL) */}
                    {rsDays.length > 4 && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-l from-zinc-900 via-zinc-900/80 to-transparent"
                      />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-[13px] font-medium text-zinc-300">
                    ساعت خالی {rsSelectedDay ? formatJalaliDate(new Date(`${rsSelectedDay.date}T12:00:00`), "date") : ""}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(rsSelectedDay?.slots || []).map((s) => (
                      <button
                        key={s.startTime}
                        type="button"
                        onClick={() => setRsSlot(s.startTime)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          rsSlot === s.startTime
                            ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
                            : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        {toPersianNumbers(s.startTime)} - {toPersianNumbers(s.endTime)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-zinc-800 bg-zinc-900/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              className="w-full border-zinc-700 text-zinc-300 sm:w-auto"
            >
              بازگشت
            </Button>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-500 sm:w-auto"
              onClick={submitReschedule}
              disabled={rsSaving || !rsSlot || !rsDate}
            >
              {rsSaving ? "در حال ثبت..." : "ثبت زمان جدید"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── دیالوگ لغو ─── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>لغو رزرو</DialogTitle>
            <DialogDescription>
              آیا از لغو رزرو با {selectedBooking?.artist.displayName} مطمئن هستید؟
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">دلیل لغو *</label>
              <div className="flex flex-wrap gap-2">
                {CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      cancelReason === reason
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">توضیحات (اختیاری)</label>
              <Textarea
                value={cancelNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelNote(e.target.value)}
                placeholder="توضیحات تکمیلی..."
                rows={2}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
            {selectedBooking?.agreedPrice && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
                لغو کمتر از ۲۴ ساعت قبل از زمان رزرو، شامل کسر ۵۰٪ ودیعه می‌شود.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="border-zinc-700 text-zinc-300">
              بازگشت
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500"
              onClick={handleCancel}
              disabled={!cancelReason}
            >
              تأیید لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
