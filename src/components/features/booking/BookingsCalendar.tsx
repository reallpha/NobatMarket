"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatJalaliDate } from "@/lib/utils";

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
  status: BookingStatus;
  title: string;
  description: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  agreedPrice: string | null;
  estimatedDuration: number | null;
  bodyPlacement: string | null;
  location: string | null;
  cancellationReason: string | null;
  artistNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    displayName: string;
    phone: string;
    avatarUrl: string | null;
  };
  service: {
    id: string;
    name: string;
    basePrice: number;
    durationMinutes: number;
  } | null;
};

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  REQUESTED: { label: "درخواست شده", color: "text-amber-700", bgColor: "bg-amber-50" },
  PENDING_ARTIST: { label: "در انتظار تأیید شما", color: "text-orange-700", bgColor: "bg-orange-50" },
  CONFIRMED: { label: "تایید شده", color: "text-green-700", bgColor: "bg-green-50" },
  IN_PROGRESS: { label: "در حال انجام", color: "text-purple-700", bgColor: "bg-purple-50" },
  COMPLETED: { label: "تکمیل شده", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  CANCELLED_BY_CLIENT: { label: "لغو شده (مشتری)", color: "text-red-600", bgColor: "bg-red-50" },
  CANCELLED_BY_ARTIST: { label: "لغو شده (هنرمند)", color: "text-red-600", bgColor: "bg-red-50" },
  RESCHEDULE_PENDING: { label: "تغییر زمان", color: "text-orange-600", bgColor: "bg-orange-50" },
  NO_SHOW: { label: "عدم حضور", color: "text-zinc-500", bgColor: "bg-zinc-800" },
};

type ViewMode = "list" | "calendar";

export function BookingsCalendar({ bookings: initialBookings }: { bookings: SerializedBooking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [view, setView] = useState<ViewMode>("list");
  const [selectedBooking, setSelectedBooking] = useState<SerializedBooking | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  // دیالوگ اقدام هنرمند روی درخواست رزرو (تأیید / رد / درخواست تغییر زمان)
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "CONFIRMED" | "CANCELLED_BY_ARTIST" | "RESCHEDULE_PENDING"
  >("CONFIRMED");
  const [actionNote, setActionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const { toast } = useToast();

  const upcomingBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          new Date(b.scheduledDate) >= new Date() &&
          b.status !== "CANCELLED_BY_CLIENT" &&
          b.status !== "CANCELLED_BY_ARTIST" &&
          b.status !== "COMPLETED" &&
          b.status !== "NO_SHOW"
      ),
    [bookings]
  );

  const pastBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          new Date(b.scheduledDate) < new Date() ||
          b.status === "CANCELLED_BY_CLIENT" ||
        b.status === "CANCELLED_BY_ARTIST" ||
          b.status === "COMPLETED" ||
          b.status === "NO_SHOW"
      ),
    [bookings]
  );

  const handleStatusUpdate = async (_bookingId: string, _newStatus: BookingStatus) => {
    try {
      const { updateBookingStatus } = await import("@/services/booking.service");
      const result = await updateBookingStatus(_bookingId, _newStatus);
      if (result.success) {
        toast({ title: "وضعیت رزرو به‌روزرسانی شد" });
        setBookings((prev) =>
          prev.map((b) => (b.id === _bookingId ? { ...b, status: _newStatus } : b))
        );
      } else {
        toast({ title: result.message || "خطا در به‌روزرسانی", variant: "destructive" });
      }
      setDetailDialogOpen(false);
    } catch {
      toast({ title: "خطا در به‌روزرسانی", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    try {
      const { updateBookingStatus } = await import("@/services/booking.service");
      const result = await updateBookingStatus(
        selectedBooking.id,
        "CANCELLED_BY_ARTIST",
        cancelReason || "لغو توسط هنرمند"
      );
      if (result.success) {
        toast({ title: "رزرو لغو شد" });
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, status: "CANCELLED_BY_ARTIST" as BookingStatus }
              : b
          )
        );
      } else {
        toast({ title: result.message || "خطا در لغو رزرو", variant: "destructive" });
      }
      setCancelDialogOpen(false);
      setDetailDialogOpen(false);
      setCancelReason("");
    } catch {
      toast({ title: "خطا در لغو رزرو", variant: "destructive" });
    }
  };

  const openDetail = (booking: SerializedBooking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const openActionDialog = (
    booking: SerializedBooking,
    type: "CONFIRMED" | "CANCELLED_BY_ARTIST" | "RESCHEDULE_PENDING"
  ) => {
    setSelectedBooking(booking);
    setActionType(type);
    setActionNote("");
    setActionDialogOpen(true);
  };

  const ACTION_META: Record<
    "CONFIRMED" | "CANCELLED_BY_ARTIST" | "RESCHEDULE_PENDING",
    { title: string; description: string; placeholder: string; noteRequired: boolean; confirmLabel: string }
  > = {
    CONFIRMED: {
      title: "تأیید رزرو",
      description: "با تأیید، گفتگوی مستقیم با مشتری باز می‌شود و می‌توانید پیام یادداشت بفرستید.",
      placeholder: "یادداشت یا پیام برای مشتری (اختیاری)...",
      noteRequired: false,
      confirmLabel: "تأیید رزرو",
    },
    CANCELLED_BY_ARTIST: {
      title: "رد رزرو",
      description: "دلیل رد برای مشتری ارسال می‌شود و زمان رزرو آزاد خواهد شد.",
      placeholder: "مثال: این زمان دیگر در دسترس نیست...",
      noteRequired: true,
      confirmLabel: "رد رزرو",
    },
    RESCHEDULE_PENDING: {
      title: "درخواست تغییر زمان",
      description: "به مشتری اعلام می‌شود که باید زمان جدیدی انتخاب کند؛ پس از انتخاب، رزرو دوباره به تأیید شما می‌آید.",
      placeholder: "مثال: لطفاً زمان دیگری برای این هفته انتخاب کنید...",
      noteRequired: false,
      confirmLabel: "ارسال درخواست تغییر زمان",
    },
  };

  const submitAction = async () => {
    if (!selectedBooking) return;
    const meta = ACTION_META[actionType];
    if (meta.noteRequired && !actionNote.trim()) {
      toast({ title: "وارد کردن دلیل الزامی است", variant: "destructive" });
      return;
    }
    setSubmittingAction(true);
    try {
      const { updateBookingStatus } = await import("@/services/booking.service");
      const result = await updateBookingStatus(
        selectedBooking.id,
        actionType,
        actionNote.trim() || undefined
      );
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: actionType } : b))
        );
        toast({
          title:
            actionType === "CONFIRMED"
              ? "رزرو تأیید شد"
              : actionType === "CANCELLED_BY_ARTIST"
              ? "رزرو رد شد"
              : "درخواست تغییر زمان ارسال شد",
        });
        setActionDialogOpen(false);
        setDetailDialogOpen(false);
        setActionNote("");
      } else {
        toast({ title: result.message || "خطا در تغییر وضعیت", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در تغییر وضعیت", variant: "destructive" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatPrice = (amount: string | null) => {
    if (!amount) return "—";
    const num = Number(amount);
    return num.toLocaleString("fa-IR") + " تومان";
  };

  return (
    <>
      {/* View Toggle & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-zinc-900 text-white" : "border-zinc-300"}
          >
            لیست
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            className={view === "calendar" ? "bg-zinc-900 text-white" : "border-zinc-300"}
          >
            تقویم
          </Button>
        </div>
        <div className="flex gap-4 text-sm text-zinc-500">
          <span>آینده: <strong className="text-white">{upcomingBookings.length}</strong></span>
          <span>گذشته: <strong className="text-white">{pastBookings.length}</strong></span>
        </div>
      </div>

      {view === "list" ? (
        <>
          {/* Upcoming */}
          <Card className="border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">رزروهای آتی</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">رزرو آتی ندارید.</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {upcomingBookings.map((booking) => {
                    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.REQUESTED;
                    return (
                      <button
                        key={booking.id}
                        onClick={() => openDetail(booking)}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-zinc-800/50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-600">
                            {booking.client.displayName?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-white">{booking.client.displayName}</p>
                            <p className="text-sm text-zinc-500">
                              {booking.service?.name || "—"} • {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className={`${status.bgColor} ${status.color} mb-1 text-xs`}>
                            {status.label}
                          </Badge>
                          <p className="text-xs text-zinc-400">
                            {formatJalaliDate(new Date(booking.scheduledDate), "date")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past */}
          <Card className="border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-500">رزروهای گذشته</CardTitle>
            </CardHeader>
            <CardContent>
              {pastBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">رزرو گذشته‌ای ندارید.</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {pastBookings.map((booking) => {
                    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.REQUESTED;
                    return (
                      <button
                        key={booking.id}
                        onClick={() => openDetail(booking)}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-zinc-800/50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-600">
                            {booking.client.displayName?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-white">{booking.client.displayName}</p>
                            <p className="text-sm text-zinc-500">{booking.service?.name || "—"}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className={`${status.bgColor} ${status.color} text-xs`}>
                            {status.label}
                          </Badge>
                          <p className="mt-1 text-xs text-zinc-400">
                            {formatJalaliDate(new Date(booking.scheduledDate), "short")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Calendar View */
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">نمای تقویم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-8 text-center text-sm text-zinc-400">
              نمای تقویم به‌زودی با تقویم تعاملی اضافه خواهد شد.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>جزئیات رزرو</DialogTitle>
            <DialogDescription>
              {selectedBooking?.client.displayName} — {selectedBooking?.service?.name || selectedBooking?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400">تاریخ</span>
                  <p className="font-medium text-white">
                    {formatJalaliDate(new Date(selectedBooking.scheduledDate), "date")}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">ساعت</span>
                  <p className="font-medium text-white">
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">مدت زمان</span>
                  <p className="font-medium text-white">
                    {selectedBooking.estimatedDuration || selectedBooking.service?.durationMinutes || 0} دقیقه
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">قیمت توافقی</span>
                  <p className="font-medium text-white">{formatPrice(selectedBooking.agreedPrice)}</p>
                </div>
              </div>

              {selectedBooking.description && (
                <div>
                  <span className="text-sm text-zinc-400">توضیحات</span>
                  <p className="mt-1 text-sm text-zinc-700">{selectedBooking.description}</p>
                </div>
              )}

              {/* Status Actions */}
              {selectedBooking.status === "PENDING_ARTIST" && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-zinc-400">
                    یکی از سه حالت را انتخاب کنید. در هر حالت می‌توانید پیام یادداشت برای مشتری بفرستید.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => openActionDialog(selectedBooking, "CONFIRMED")}
                    >
                      تأیید رزرو
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => openActionDialog(selectedBooking, "CANCELLED_BY_ARTIST")}
                    >
                      رد رزرو
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => openActionDialog(selectedBooking, "RESCHEDULE_PENDING")}
                    >
                      درخواست تغییر زمان
                    </Button>
                  </div>
                </div>
              )}

              {selectedBooking.status === "CONFIRMED" && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleStatusUpdate(selectedBooking.id, "IN_PROGRESS")}>
                    شروع کار
                  </Button>
                  <p className="text-xs text-zinc-500">
                    پس از تأیید، امکان رد رزرو وجود ندارد. برای لغو با پشتیبانی نوبت مارکت تماس بگیرید.
                  </p>
                </div>
              )}

              {selectedBooking.status === "IN_PROGRESS" && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleStatusUpdate(selectedBooking.id, "COMPLETED")}>
                  تکمیل کار
                </Button>
              )}

              {selectedBooking.status === "RESCHEDULE_PENDING" && (
                <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
                  درخواست تغییر زمان ارسال شده است؛ در انتظار انتخاب زمان جدید توسط مشتری.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog (تأیید / رد / تغییر زمان) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ACTION_META[actionType].title}</DialogTitle>
            <DialogDescription>{ACTION_META[actionType].description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              پیام / یادداشت برای مشتری {ACTION_META[actionType].noteRequired ? "*" : "(اختیاری)"}
            </label>
            <Textarea
              value={actionNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNote(e.target.value)}
              placeholder={ACTION_META[actionType].placeholder}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={submittingAction}>
              بازگشت
            </Button>
            <Button
              onClick={submitAction}
              disabled={submittingAction}
              className={actionType === "CANCELLED_BY_ARTIST" ? "bg-red-600 text-white hover:bg-red-500" : "bg-green-600 text-white hover:bg-green-700"}
            >
              {submittingAction ? "در حال ارسال..." : ACTION_META[actionType].confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cancelReason === "" && selectedBooking?.status === "PENDING_ARTIST" ? "رد رزرو" : "لغو رزرو"}</DialogTitle>
            <DialogDescription>
              {selectedBooking?.status === "PENDING_ARTIST"
                ? "دلیل رد رزرو برای مشتری ارسال می‌شود. لطفاً دلیل را وارد کنید."
                : "آیا از لغو این رزرو مطمئن هستید؟ دلیل لغو برای مشتری ارسال می‌شود."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={cancelReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
              placeholder={selectedBooking?.status === "PENDING_ARTIST" ? "مثال: این زمان دیگر در دسترس نیست..." : "دلیل لغو رزرو..."}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              بازگشت
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              تایید لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
