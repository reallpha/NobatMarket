"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  bodyPlacement: string | null;
  size: string | null;
  colorType: string | null;
  designImageUrl: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  agreedPrice: string | null;
  cancellationReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  client: { id: string; displayName: string; phone: string };
  artist: { id: string; displayName: string; phone: string };
  service: { name: string; basePrice: number } | null;
  /** آیا بیعانه پرداخت شده است (فقط برای وضعیت REQUESTED معنا دارد) */
  depositPaid?: boolean;
};

/** برچسب وضعیت — درخواست‌های REQUESTED بر اساس پرداخت بیعانه تفکیک می‌شوند */
function statusMeta(b: SerializedBooking) {
  if (b.status === "REQUESTED" && !b.depositPaid) {
    return { label: "در انتظار پرداخت بیعانه", color: "text-amber-400", bgColor: "bg-amber-500/10" };
  }
  if (b.status === "REQUESTED" && b.depositPaid) {
    return { label: "در انتظار تأیید ادمین", color: "text-sky-400", bgColor: "bg-sky-500/10" };
  }
  return STATUS_CONFIG[b.status] || STATUS_CONFIG.REQUESTED;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  REQUESTED: { label: "در انتظار تأیید ادمین", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  PENDING_ARTIST: { label: "در انتظار تأیید هنرمند", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  CONFIRMED: { label: "تأیید شده", color: "text-green-400", bgColor: "bg-green-500/10" },
  IN_PROGRESS: { label: "در حال انجام", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  COMPLETED: { label: "تکمیل شده", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  CANCELLED_BY_CLIENT: { label: "لغو (مشتری)", color: "text-red-400", bgColor: "bg-red-500/10" },
  CANCELLED_BY_ARTIST: { label: "لغو (هنرمند)", color: "text-red-400", bgColor: "bg-red-500/10" },
  NO_SHOW: { label: "عدم حضور", color: "text-zinc-400", bgColor: "bg-zinc-500/10" },
  RESCHEDULE_PENDING: { label: "تغییر زمان", color: "text-orange-400", bgColor: "bg-orange-500/10" },
};

const ALL_STATUSES: BookingStatus[] = [
  "REQUESTED", "PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS", "COMPLETED",
  "CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST", "NO_SHOW", "RESCHEDULE_PENDING",
];

const REJECTION_STATUSES: BookingStatus[] = ["CANCELLED_BY_ARTIST", "CANCELLED_BY_CLIENT", "NO_SHOW"];

const SIZE_LABELS: Record<string, string> = {
  SMALL: "کوچک", MEDIUM: "متوسط", LARGE: "بزرگ", FULL_SLEEVE: "فول اسلیو",
};
const COLOR_LABELS: Record<string, string> = { COLOR: "رنگی", BW: "سیاه و سفید" };

// تغییر وضعیت‌های مجاز برای ادمین از هر وضعیت فعلی
const ADMIN_TRANSITIONS: BookingStatus[] = [
  "REQUESTED", "PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS", "COMPLETED",
  "CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST", "NO_SHOW", "RESCHEDULE_PENDING",
];

export function AdminBookingsTable({ bookings: initialBookings }: { bookings: SerializedBooking[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SerializedBooking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>("CONFIRMED");
  const [statusReason, setStatusReason] = useState("");
  const [changing, setChanging] = useState(false);

  const { toast } = useToast();

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.bookingNumber.toLowerCase().includes(q) ||
          b.client.displayName.toLowerCase().includes(q) ||
          b.artist.displayName.toLowerCase().includes(q) ||
          b.client.phone.includes(q)
        );
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: bookings.length };
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  const pendingAdminCount = (counts: Record<string, number>) => counts.REQUESTED || 0;

  const openStatusDialog = (booking: SerializedBooking) => {
    setSelectedBooking(booking);
    // پیش‌نهاد وضعیت بعدی بر اساس وضعیت فعلی
    if (booking.status === "REQUESTED") setNewStatus("PENDING_ARTIST");
    else if (booking.status === "PENDING_ARTIST") setNewStatus("CONFIRMED");
    else setNewStatus("CONFIRMED");
    setStatusReason("");
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedBooking) return;
    const isRejection = REJECTION_STATUSES.includes(newStatus);
    if (isRejection && !statusReason.trim()) {
      toast({ title: "برای رد/لغو رزرو، وارد کردن دلیل الزامی است", variant: "destructive" });
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          status: newStatus,
          reason: statusReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      console.log('[status change]', { status, data });
      if (data.success) {
        toast({
          title: isRejection ? "رزرو لغو شد و دلیل برای مشتری ارسال شد" : "وضعیت رزرو تغییر کرد و اعلان ارسال شد",
        });
        setStatusDialogOpen(false);
        setDetailDialogOpen(false);
        // Immediately update local state to reflect the change, router.refresh will sync from server
        setBookings(prev => prev.map(b => b.id === selectedBooking?.id ? { ...b, status: newStatus, cancellationReason: isRejection ? statusReason.trim() || null : null } : b));
      } else {
        toast({ title: data.error || "خطا در تغییر وضعیت", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط با سرور", variant: "destructive" });
    }
    setChanging(false);
  };

  return (
    <>
      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "REQUESTED", label: "در انتظار تأیید ادمین" },
          { key: "PENDING_ARTIST", label: "در انتظار هنرمند" },
          { key: "CONFIRMED", label: "تأیید شده" },
          { key: "COMPLETED", label: "تکمیل شده" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "ALL" : s.key)}
            className={`rounded-xl border p-4 text-right transition-all ${
              statusFilter === s.key
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
            }`}
          >
            <p className="text-2xl font-bold text-white">{toPersianNumbers(statusCounts[s.key] || 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={"جستجو (شماره رزرو، نام، تلفن)..."}
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        >
          <option value="ALL">{"همه"} ({toPersianNumbers(statusCounts.ALL)})</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label} ({toPersianNumbers(statusCounts[s] || 0)})
            </option>
          ))}
        </select>
        {pendingAdminCount(statusCounts) > 0 && (
          <button
            onClick={() => setStatusFilter("REQUESTED")}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {toPersianNumbers(pendingAdminCount(statusCounts))} رزرو در انتظار تأیید شما
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"شماره"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"مشتری"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"هنرمند"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"سرویس"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"تاریخ"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"ساعت"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"مبلغ"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"وضعیت"}</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">{"عملیات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                      {"رزروی یافت نشد."}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const status = statusMeta(booking);
                    return (
                      <tr
                        key={booking.id}
                        className="cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">{booking.bookingNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{booking.client.displayName}</p>
                          <p className="text-xs text-zinc-500">{booking.client.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{booking.artist.displayName}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{booking.service?.name || "\u2014"}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {formatJalaliDate(new Date(booking.scheduledDate), "short")}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{booking.startTime}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {booking.agreedPrice ? `${Number(booking.agreedPrice).toLocaleString("fa-IR")} ت` : "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${status.bgColor} ${status.color} text-xs`}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`border-zinc-700 bg-zinc-800 text-xs hover:bg-zinc-700 hover:text-white ${
                              booking.status === "REQUESTED" ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "text-zinc-400"
                            }`}
                            onClick={() => openStatusDialog(booking)}
                          >
                            {booking.status === "REQUESTED" ? "بررسی و تأیید" : "تغییر وضعیت"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">جزئیات رزرو {selectedBooking?.bookingNumber}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">مشتری</p>
                  <p className="mt-1 font-medium text-white">{selectedBooking.client.displayName}</p>
                  <p className="text-xs text-zinc-500" dir="ltr">{selectedBooking.client.phone}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">هنرمند</p>
                  <p className="mt-1 font-medium text-white">{selectedBooking.artist.displayName}</p>
                  <p className="text-xs text-zinc-500" dir="ltr">{selectedBooking.artist.phone}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">زمان</p>
                  <p className="mt-1 font-medium text-white">
                    {formatJalaliDate(new Date(selectedBooking.scheduledDate))}
                  </p>
                  <p className="text-xs text-zinc-400">{selectedBooking.startTime} تا {selectedBooking.endTime}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">سرویس و مبلغ</p>
                  <p className="mt-1 font-medium text-white">{selectedBooking.service?.name || "\u2014"}</p>
                  <p className="text-xs text-amber-400">
                    {selectedBooking.agreedPrice ? `${Number(selectedBooking.agreedPrice).toLocaleString("fa-IR")} تومان` : "\u2014"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 text-sm">
                <p className="text-xs text-zinc-500">مشخصات تتو</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.size && (
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      اندازه: {SIZE_LABELS[selectedBooking.size] || selectedBooking.size}
                    </span>
                  )}
                  {selectedBooking.colorType && (
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      نوع: {COLOR_LABELS[selectedBooking.colorType] || selectedBooking.colorType}
                    </span>
                  )}
                  {selectedBooking.bodyPlacement && (
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      محل: {selectedBooking.bodyPlacement}
                    </span>
                  )}
                </div>
                {selectedBooking.title && (
                  <p className="text-zinc-300"><span className="text-xs text-zinc-500">عنوان: </span>{selectedBooking.title}</p>
                )}
                {selectedBooking.description && (
                  <p className="leading-relaxed text-zinc-400"><span className="text-xs text-zinc-500">توضیحات مشتری: </span>{selectedBooking.description}</p>
                )}
                {selectedBooking.designImageUrl && (
                  <div>
                    <p className="mb-1 text-xs text-zinc-500">تصویر طرح:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedBooking.designImageUrl} alt="طرح رزرو" className="max-h-48 rounded-lg border border-zinc-800 object-contain" />
                  </div>
                )}
              </div>

              {(selectedBooking.cancellationReason || selectedBooking.adminNotes) && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 text-sm">
                  {selectedBooking.cancellationReason && (
                    <p className="text-red-400"><span className="text-xs text-zinc-500">دلیل لغو: </span>{selectedBooking.cancellationReason}</p>
                  )}
                  {selectedBooking.adminNotes && (
                    <p className="text-zinc-400"><span className="text-xs text-zinc-500">یادداشت ادمین: </span>{selectedBooking.adminNotes}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <Badge className={`${statusMeta(selectedBooking).bgColor} ${statusMeta(selectedBooking).color} text-xs`}>
                  {statusMeta(selectedBooking).label}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => openStatusDialog(selectedBooking)}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  تغییر وضعیت
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">تغییر وضعیت رزرو</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedBooking?.bookingNumber} — وضعیت فعلی:{" "}
              {selectedBooking ? statusMeta(selectedBooking).label : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">وضعیت جدید</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
              >
                {ADMIN_TRANSITIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              {selectedBooking?.status === "REQUESTED" && newStatus === "PENDING_ARTIST" && (
                <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs leading-relaxed text-amber-300/90">
                  با تأیید، رزرو برای هنرمند ارسال می‌شود تا او نیز تأیید نهایی را انجام دهد. پس از تأیید هنرمند، گفتگوی مشتری و هنرمند باز می‌شود.
                </p>
              )}
              {newStatus === "CONFIRMED" && selectedBooking?.status !== "CONFIRMED" && (
                <p className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs leading-relaxed text-emerald-300/90">
                  با تأیید نهایی، رزرو قطعی می‌شود و گفتگوی مستقیم بین مشتری و هنرمند باز خواهد شد.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                {REJECTION_STATUSES.includes(newStatus) ? "دلیل رد/لغو (برای مشتری و هنرمند ارسال می‌شود) *" : "یادداشت (اختیاری)"}
              </label>
              <Textarea
                value={statusReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStatusReason(e.target.value)}
                placeholder={
                  REJECTION_STATUSES.includes(newStatus)
                    ? "مثال: زمان انتخابی در دسترس نیست، لطفاً زمان دیگری انتخاب کنید..."
                    : "یادداشت داخلی..."
                }
                rows={3}
                className="border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              {"انصراف"}
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={changing || (REJECTION_STATUSES.includes(newStatus) && !statusReason.trim())}
              className={REJECTION_STATUSES.includes(newStatus) ? "bg-red-600 hover:bg-red-700" : "bg-rose-600 hover:bg-rose-700"}
            >
              {changing ? "در حال انجام..." : REJECTION_STATUSES.includes(newStatus) ? "لغو و ارسال اعلان" : "ثبت و ارسال اعلان"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
