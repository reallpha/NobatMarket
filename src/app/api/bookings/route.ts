import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

function generateBookingNumber(): string {
  const prefix = "TY";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "لطفاً ابتدا وارد شوید" }, { status: 401 });
    }

    // ─── بررسی فعال بودن سیستم رزرو (از تنظیمات سیستم) ───
    const bookingsSetting = await db.systemSetting.findUnique({
      where: { key: "BOOKINGS_ENABLED" },
    });
    if (bookingsSetting && bookingsSetting.value === "false") {
      return NextResponse.json({ success: false, message: "سیستم رزرو در حال حاضر غیرفعال است" }, { status: 403 });
    }

    // ─── تأیید خودکار رزروها (تنظیمات سیستم) ───
    // رزرو همیشه ابتدا REQUESTED است؛ با تأیید ادمین → PENDING_ARTIST می‌شود.
    // اگر تأیید خودکار فعال باشد، رزرو مستقیماً به صف تأیید هنرمند می‌رود.
    const autoConfirmSetting = await db.systemSetting.findUnique({
      where: { key: "AUTO_CONFIRM" },
    });
    const autoConfirm = autoConfirmSetting ? autoConfirmSetting.value === "true" : false;

    const body = await request.json();
    const { artistSlug, serviceId, date, startTime, title, description, bodyPlacement, size, colorType, designImageUrl } = body;

    if (!artistSlug || !serviceId || !date || !startTime) {
      return NextResponse.json({ success: false, message: "اطلاعات ناقص است" }, { status: 400 });
    }

    // Find artist
    const artist = await db.artistProfile.findUnique({
      where: { slug: artistSlug },
      select: { id: true, userId: true, isAcceptingBookings: true },
    });

    if (!artist || !artist.isAcceptingBookings) {
      return NextResponse.json({ success: false, message: "هنرمند در حال حاضر رزرو نمی‌پذیرد" }, { status: 400 });
    }

    // Find service
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { id: true, durationMinutes: true, basePrice: true },
    });

    if (!service) {
      return NextResponse.json({ success: false, message: "سرویس یافت نشد" }, { status: 404 });
    }

    // Calculate end time
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + service.durationMinutes;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // ─── سقف ۲ پروژه فعال هم‌زمان (مشتری و هنرمند) ───
    const { countActiveClientBookings, countActiveArtistBookings, slotHoldingBookingFilter } = await import("@/lib/booking-rules");
    const { PAYMENT_DEFAULTS } = await import("@/constants");
    const [clientActive, artistActive] = await Promise.all([
      countActiveClientBookings(session.user.id),
      countActiveArtistBookings(artist.userId),
    ]);
    if (clientActive >= PAYMENT_DEFAULTS.MAX_ACTIVE_PROJECTS) {
      return NextResponse.json({ success: false, message: "شما در حال حاضر ۲ پروژه فعال دارید. تا تکمیل یکی از آن‌ها امکان رزرو جدید نیست." }, { status: 400 });
    }
    if (artistActive >= PAYMENT_DEFAULTS.MAX_ACTIVE_PROJECTS) {
      return NextResponse.json({ success: false, message: "این هنرمند در حال حاضر ظرفیت پذیرش رزرو جدید ندارد." }, { status: 400 });
    }

    // Check for conflicts — درخواست‌های بیعانه‌پرداخت‌نشدهٔ منقضی‌شده زمان را اشغال نمی‌کنند
    const scheduledDate = new Date(date + "T00:00:00");
    const conflict = await db.booking.findFirst({
      where: {
        artistId: artist.userId,
        scheduledDate,
        ...slotHoldingBookingFilter(),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      return NextResponse.json({ success: false, message: "این ساعت قبلاً رزرو شده است" }, { status: 409 });
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        clientId: session.user.id,
        artistId: artist.userId,
        serviceId: service.id,
        scheduledDate,
        startTime,
        endTime,
        title: title || `رزرو ${serviceId}`,
        description: description || null,
        bodyPlacement: bodyPlacement || null,
        size: size || null,
        colorType: (colorType === "COLOR" || colorType === "BW") ? colorType : null,
        designImageUrl: designImageUrl || null,
        agreedPrice: service.basePrice,
        status: autoConfirm ? "PENDING_ARTIST" : "REQUESTED",
      },
    });

    // ─── ایجاد خودکار فاکتور بیعانه (= کارمزد پلتفرم) ───
    // رزرو بدون پرداخت بیعانه به تأیید ادمین نمی‌رسد.
    // درصد بیعانه از تنظیمات ادمین (DEPOSIT_PERCENT) خوانده می‌شود.
    const { getDepositPercent, depositAmountWithPercent } = await import(
      "@/lib/booking-rules"
    );
    const depositPercent = await getDepositPercent();
    const deposit = depositAmountWithPercent(service.basePrice, depositPercent);
    const depositPayment = await db.payment.create({
      data: {
        paymentNumber: `PAY-${nanoid(8).toUpperCase()}`,
        bookingId: booking.id,
        amount: deposit,
        platformFee: deposit,
        studioFee: BigInt(0),
        artistNetAmount: BigInt(0),
        method: "ZARINPAL",
        status: "PENDING",
        purpose: "DEPOSIT",
        note: `بیعانه ${depositPercent}٪ (سهم پلتفرم)`,
      },
      select: { id: true },
    }).catch(() => null);

    // ─── اعلان‌ها ───
    // به مشتری: رزرو ثبت شد و در انتظار بررسی است
    await db.notification
      .create({
        data: {
          userId: session.user.id,
          title: "رزرو شما ثبت شد ✅",
          message: `رزرو ${booking.bookingNumber} ثبت شد. برای ارسال به تأیید مدیریت، ابتدا بیعانه (${deposit.toLocaleString("fa-IR")} تومان) را از بخش پرداخت‌ها پرداخت کنید.`,
          type: "BOOKING",
          link: "/client/payments",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
        },
      })
      .catch(() => undefined);

    // به هنرمند: فقط وقتی رزرو به صف تأیید هنرمند رسیده (تأیید خودکار ادمین)
    if (autoConfirm) {
      await db.notification
        .create({
          data: {
            userId: artist.userId,
            title: "درخواست رزرو جدید 📨",
            message: `درخواست رزرو ${booking.bookingNumber} ثبت شده است. برای تأیید یا رد به بخش رزروها بروید.`,
            type: "BOOKING",
            link: "/artist/dashboard/bookings",
            data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
          },
        })
        .catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      message: "رزرو با موفقیت ثبت شد",
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        depositAmount: deposit.toString(),
        depositPaymentId: depositPayment?.id || null,
      },
    });
  } catch (e) {
    console.error("Booking creation error:", e);
    return NextResponse.json({ success: false, message: "خطا در ثبت رزرو" }, { status: 500 });
  }
}
