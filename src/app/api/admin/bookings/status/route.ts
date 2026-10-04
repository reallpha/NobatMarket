import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = [
  "REQUESTED",
  "PENDING_ARTIST",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_ARTIST",
  "NO_SHOW",
  "RESCHEDULE_PENDING",
];

// POST - تغییر وضعیت رزرو توسط ادمین (با اعلان به مشتری و هنرمند)
export async function POST(
  request: NextRequest,
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookingId, status, reason } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ success: false, error: "bookingId و وضعیت الزامی هستند" }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "وضعیت معتبر نیست" }, { status: 400 });
    }

    // وضعیت‌های لغو/رد که دلیل الزامی دارند
    const rejectionStatuses = ["CANCELLED_BY_ARTIST", "CANCELLED_BY_CLIENT", "NO_SHOW"];
    if (rejectionStatuses.includes(status) && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "برای رد/لغو رزرو، وارد کردن دلیل الزامی است" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, bookingNumber: true, clientId: true, artistId: true, status: true, agreedPrice: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "رزرو یافت نشد" }, { status: 404 });
    }

    // ─── گیت بیعانه ───
    // تا وقتی مشتری بیعانه را پرداخت نکرده، رزرو به هنرمند نمی‌رود و ادمین
    // نمی‌تواند آن را تایید کند. در این حالت وضعیت «در انتظار پرداخت بیعانه» است
    // و پس از پرداخت به «در انتظار تأییده ادمین» تبدیل می‌شود.
    const forwardStatuses = ["PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS"];
    const canForward = booking.status === "REQUESTED" && forwardStatuses.includes(status);
    if (canForward) {
      const { hasPaidDeposit } = await import("@/lib/booking-rules");
      const depositPaid = await hasPaidDeposit(bookingId);
      if (!depositPaid) {
        return NextResponse.json(
          {
            success: false,
            error: "مشتری هنوز بیعانه را پرداخت نکرده است؛ تا پرداخت بیعانه، امکان تأیید رزرو وجود ندارد.",
          },
          { status: 400 }
        );
      }
    }

    const isRejection = rejectionStatuses.includes(status);

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancellationReason: isRejection ? (reason?.trim() || null) : null,
        adminNotes: !isRejection && reason?.trim() ? reason.trim() : undefined,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    // ─── تسویه مالی و شمارنده تکمیل هنگام اتمام پروژه ───
    if (status === "COMPLETED" && booking.status !== "COMPLETED") {
      const { settleCompletedBooking } = await import("@/lib/booking-rules");
      await settleCompletedBooking(bookingId);
      await db.artistProfile.updateMany({
        where: { userId: booking.artistId },
        data: { completedBookings: { increment: 1 } },
      });
    }

    // ─── اعلان‌ها ───
    const reasonSuffix = reason?.trim() ? `\n\nدلیل: ${reason.trim()}` : "";

    if (isRejection) {
      // رد/لغو: اعلان به مشتری و هنرمند
      await db.notification.create({
        data: {
          userId: booking.clientId,
          title: "رزرو شما رد شد ❌",
          message: `رزرو ${booking.bookingNumber} توسط پشتیبانی نوبت مارکت لغو شد.${reasonSuffix}`,
          type: "WARNING",
          link: "/client/bookings",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber, status },
        },
      });
      await db.notification.create({
        data: {
          userId: booking.artistId,
          title: "یک رزرو لغو شد",
          message: `رزرو ${booking.bookingNumber} توسط پشتیبانی نوبت مارکت لغو شد.${reasonSuffix}`,
          type: "WARNING",
          link: "/artist/dashboard/bookings",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber, status },
        },
      });
    } else {
      // تغییر وضعیت عادی: اعلان به هر دو طرف
      const statusLabels: Record<string, string> = {
        REQUESTED: "درخواست شده",
        PENDING_ARTIST: "در انتظار تأیید هنرمند",
        CONFIRMED: "تأیید شده",
        IN_PROGRESS: "در حال انجام",
        COMPLETED: "تکمیل شده",
        RESCHEDULE_PENDING: "در انتظار تغییر زمان",
      };

      await db.notification.create({
        data: {
          userId: booking.clientId,
          title: `وضعیت رزرو تغییر کرد: ${statusLabels[status] || status}`,
          message: `وضعیت رزرو ${booking.bookingNumber} به «${statusLabels[status] || status}» تغییر کرد.${reasonSuffix}`,
          type: "BOOKING",
          link: "/client/bookings",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber, status },
        },
      });
      await db.notification.create({
        data: {
          userId: booking.artistId,
          title: `وضعیت رزرو تغییر کرد: ${statusLabels[status] || status}`,
          message: `وضعیت رزرو ${booking.bookingNumber} به «${statusLabels[status] || status}» تغییر کرد.${reasonSuffix}`,
          type: "BOOKING",
          link: "/artist/dashboard/bookings",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber, status },
        },
      });

      // ─── باز کردن گفتگو هنگام تأیید نهایی ───
      if (status === "CONFIRMED") {
        const { ensureBookingConversation } = await import("@/lib/booking-conversation");
        await ensureBookingConversation(bookingId);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Admin booking status error:", err);
    return NextResponse.json({ success: false, error: "خطا در تغییر وضعیت رزرو" }, { status: 500 });
  }
}
