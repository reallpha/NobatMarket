"use server";

// ============================================================================
// سرویس موتور رزرو - Server Actions
// ============================================================================
//
// ⚠️ نکته حیاتی: تمام عملیات رزرو از prisma.$transaction استفاده می‌کنند
// تا از Double-Booking جلوگیری شود. تراکنش‌ها تمامیت و جداسازی را تضمین می‌کنند.
// ============================================================================

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { requireRole, requireAuth } from "@/lib/role-guard";
import { BOOKING_CONSTRAINTS, PAYMENT_DEFAULTS, REDIS_KEYS, ACTIVE_BOOKING_STATUSES } from "@/constants";
import {
  countActiveArtistBookings,
  countActiveClientBookings,
  depositAmountWithPercent,
  getDepositPercent,
  slotHoldingBookingFilter,
} from "@/lib/booking-rules";
import { triggerNotification } from "@/lib/notifications";
import { nanoid } from "nanoid";
import type { ApiResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface CreateBookingInput {
  artistSlug: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  title: string;
  description?: string;
  bodyPlacement?: string;
  referenceImageUrl?: string;
  size?: string;
}

// ============================================================================
// توابع کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function generateBookingNumber(): string {
  const prefix = "TY";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// Server Action: ایجاد رزرو (با تراکنش Prisma)
// ============================================================================

/**
 * ایجاد رزرو جدید با استفاده از Prisma Interactive Transaction
 *
 * 🔒 جلوگیری از Double-Booking:
 * 1. تراکنش شروع می‌شود (Isolation Level: ReadCommitted)
 * 2. بررسی مجدد وجود تداخل زمانی درون تراکنش
 * 3. ایجاد رکورد رزرو
 * 4. افزایش شمارنده رزرو سرویس
 * 5. پاک کردن کش جلسات
 * 6. تراکنش commit می‌شود
 *
 * اگر هر مرحله‌ای شکست بخورد، تمام تراکنش rollback می‌شود.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<
  ApiResponse<{
    bookingId: string;
    bookingNumber: string;
    estimatedDeposit: number;
  }>
> {
  try {
    // بررسی احراز هویت کلاینت
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // دریافت هنرمند
    const artistProfile = await db.artistProfile.findUnique({
      where: { slug: input.artistSlug },
      select: {
        id: true,
        userId: true,
        isAcceptingBookings: true,
        platformFeePercent: true,
      },
    });

    if (!artistProfile) {
      return error("هنرمند مورد نظر یافت نشد");
    }

    if (!artistProfile.isAcceptingBookings) {
      return error("این هنرمند در حال حاضر رزرو نمی‌پذیرد");
    }

    // دریافت سرویس
    const service = await db.service.findFirst({
      where: {
        id: input.serviceId,
        artistProfileId: artistProfile.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        maxPrice: true,
        durationMinutes: true,
      },
    });

    if (!service) {
      return error("سرویس مورد نظر یافت نشد");
    }

    // ─── سقف ۲ پروژه فعال هم‌زمان ───
    const [clientActive, artistActive] = await Promise.all([
      countActiveClientBookings(auth.user.id),
      countActiveArtistBookings(artistProfile.userId),
    ]);
    if (clientActive >= PAYMENT_DEFAULTS.MAX_ACTIVE_PROJECTS) {
      return error("شما در حال حاضر ۲ پروژه فعال دارید. تا تکمیل یکی از آن‌ها امکان رزرو جدید نیست.");
    }
    if (artistActive >= PAYMENT_DEFAULTS.MAX_ACTIVE_PROJECTS) {
      return error("این هنرمند در حال حاضر ظرفیت پذیرش رزرو جدید ندارد.");
    }

    // محاسبه ساعت پایان
    const startMinutes = timeToMinutes(input.startTime);
    const endMinutes = startMinutes + service.durationMinutes;
    const endTime = minutesToTime(endMinutes);

    // بررسی محدودیت‌های زمانی
    const scheduledDate = new Date(input.date);
    const now = new Date();
    const minDate = new Date(now.getTime() + BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);

    if (scheduledDate < minDate) {
      return error(`حداقل ${BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS} ساعت قبل از زمان رزرو باید درخواست دهید`);
    }

    if (scheduledDate > maxDate) {
      return error(`حداکثر ${BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} روز قبل از زمان رزرو می‌توانید رزرو کنید`);
    }

    // 🔒 تراکنش Prisma برای جلوگیری از Double-Booking
    // درصد بیعانه پیش از شروع تراکنش خوانده می‌شود تا داخل تراکنش کوئری اضافه نزنیم
    const depositPercent = await getDepositPercent();
    const result = await db.$transaction(async (tx) => {
      // ─── مرحله ۱: بررسی مجدد تداخل زمانی درون تراکنش ───
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          artistId: artistProfile.userId,
          scheduledDate: scheduledDate,
          status: {
            in: [...ACTIVE_BOOKING_STATUSES] as any,
          },
          OR: [
            {
              // رزرو جدید شروع می‌شود قبل از پایان رزرو موجود
              startTime: { lt: endTime },
              // و رزرو جدید تمام می‌شود بعد از شروع رزرو موجود
              endTime: { gt: input.startTime },
            },
          ],
        },
        select: { id: true, bookingNumber: true },
      });

      if (conflictingBooking) {
        throw new Error(
          `این ساعت قبلاً رزرو شده است (شماره رزرو: ${conflictingBooking.bookingNumber})`
        );
      }

      // ─── مرحله ۲: بررسی حداکثر رزرو در روز ───
      const todayBookings = await tx.booking.count({
        where: {
          artistId: artistProfile.userId,
          scheduledDate: scheduledDate,
          status: {
            in: [...ACTIVE_BOOKING_STATUSES] as any,
          },
        },
      });

      if (todayBookings >= BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS) {
        throw new Error("تعداد رزروهای این روز به حد نصاب رسیده است");
      }

      // ─── مرحله ۳: محاسبه ودیعه (= کارمزد پلتفرم) ───
      const estimatedDeposit = Number(
        depositAmountWithPercent(service.basePrice, depositPercent)
      );

      // ─── مرحله ۴: ایجاد رکورد رزرو ───
      const bookingNumber = generateBookingNumber();

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          clientId: auth.user.id,
          artistId: artistProfile.userId,
          serviceId: service.id,
          scheduledDate: scheduledDate,
          startTime: input.startTime,
          endTime,
          title: input.title,
          description: input.description || null,
          bodyPlacement: input.bodyPlacement || null,
          referenceImageUrl: input.referenceImageUrl || null,
          size: input.size as any || null,
          estimatedDuration: service.durationMinutes,
          agreedPrice: service.basePrice,
          status: "REQUESTED",
        },
        select: {
          id: true,
          bookingNumber: true,
        },
      });

      // ─── مرحله ۴/۵: ایجاد فاکتور بیعانه (در انتظار پرداخت) ───
      await tx.payment.create({
        data: {
          paymentNumber: `PAY-${nanoid(8).toUpperCase()}`,
          bookingId: booking.id,
          amount: BigInt(estimatedDeposit),
          platformFee: BigInt(estimatedDeposit),
          studioFee: BigInt(0),
          artistNetAmount: BigInt(0),
          method: "ZARINPAL",
          status: "PENDING",
          purpose: "DEPOSIT",
          note: `بیعانه ${depositPercent}٪ (سهم پلتفرم)`,
        },
      });

      // ─── مرحله ۵: افزایش شمارنده رزرو سرویس ───
      await tx.service.update({
        where: { id: service.id },
        data: { bookingCount: { increment: 1 } },
      });

      // ─── مرحله ۶: افزایش شمارنده کل رزروهای کاربر ───
      await tx.user.update({
        where: { id: auth.user.id },
        data: { totalBookings: { increment: 1 } },
      });

      return {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        estimatedDeposit,
      };
    });

    // ─── پاک کردن کش جلسات ───
    const slotsPattern = `${REDIS_KEYS.SLOTS}${artistProfile.id}:${input.date}`;
    await redis.del(slotsPattern);

    // ─── ارسال اعلان ───
    await triggerNotification("BOOKING_CREATED", auth.user.id, {
      bookingNumber: result.bookingNumber,
    });
    await triggerNotification("BOOKING_CREATED", artistProfile.userId, {
      bookingNumber: result.bookingNumber,
    });

    return success("رزرو با موفقیت ایجاد شد", result);
  } catch (err: any) {
    console.error("خطا در ایجاد رزرو:", err);
    // اگر خطای تداخل باشد، پیام خاص برگردان
    if (err.message?.includes("رزرو شده")) {
      return error(err.message);
    }
    return error("خطا در ایجاد رزرو. لطفاً مجدداً تلاش کنید");
  }
}

// ============================================================================
// Server Action: دریافت رزروهای کاربر
// ============================================================================

export async function getMyBookings(): Promise<
  ApiResponse<{
    bookings: {
      id: string;
      bookingNumber: string;
      scheduledDate: Date;
      startTime: string;
      endTime: string;
      title: string;
      status: string;
      agreedPrice: bigint | null;
      artist: { displayName: string; avatarUrl: string | null };
      service: { name: string } | null;
    }[];
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const bookings = await db.booking.findMany({
      where: {
        OR: [
          { clientId: auth.user.id },
          { artistId: auth.user.id },
        ],
        status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST"] },
      },
      orderBy: { scheduledDate: "desc" },
      take: 20,
      select: {
        id: true,
        bookingNumber: true,
        scheduledDate: true,
        startTime: true,
        endTime: true,
        title: true,
        status: true,
        agreedPrice: true,
        artist: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
        service: {
          select: { name: true },
        },
      },
    });

    return success("رزروها دریافت شد", { bookings });
  } catch (err) {
    console.error("خطا در دریافت رزروها:", err);
    return error("خطا در دریافت رزروها");
  }
}

// ============================================================================
// Server Action: دریافت رزروهای هنرمند (برای داشبورد)
// ============================================================================

export async function getArtistBookings(
  status?: string
): Promise<
  ApiResponse<{
    bookings: {
      id: string;
      bookingNumber: string;
      scheduledDate: Date;
      startTime: string;
      endTime: string;
      title: string;
      status: string;
      description: string | null;
      bodyPlacement: string | null;
      referenceImageUrl: string | null;
      agreedPrice: bigint | null;
      client: { displayName: string; phone: string; avatarUrl: string | null };
      service: { name: string; durationMinutes: number } | null;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const bookings = await db.booking.findMany({
      where: {
        artistId: auth.user.id,
        // رزروهای REQUESTED هنوز توسط ادمین تأیید نشده‌اند و برای هنرمند پنهان‌اند
        ...(status
          ? { status: status as any, NOT: { status: "REQUESTED" } }
          : { status: { notIn: ["REQUESTED"] } }),
      },
      orderBy: { scheduledDate: "asc" },
      take: 50,
      select: {
        id: true,
        bookingNumber: true,
        scheduledDate: true,
        startTime: true,
        endTime: true,
        title: true,
        status: true,
        description: true,
        bodyPlacement: true,
        referenceImageUrl: true,
        agreedPrice: true,
        client: {
          select: {
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
      },
    });

    return success("رزروها دریافت شد", { bookings });
  } catch (err) {
    console.error("خطا در دریافت رزروها:", err);
    return error("خطا در دریافت رزروها");
  }
}

// ============================================================================
// Server Action: تغییر وضعیت رزرو
// ============================================================================

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string,
  reason?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        artistId: true,
        status: true,
        serviceId: true,
      },
    });

    if (!booking) return error("رزرو یافت نشد");

    // بررسی دسترسی
    const isClient = booking.clientId === auth.user.id;
    const isArtist = booking.artistId === auth.user.id;

    if (!isClient && !isArtist) {
      return error("دسترسی ندارید");
    }

    // بررسی تغییرات مجاز
    if (isClient && !["CANCELLED_BY_CLIENT"].includes(newStatus)) {
      return error("فقط هنرمند می‌تواند وضعیت را تغییر دهد");
    }

    // ─── جریان دو مرحله‌ای: هنرمند فقط رزروهای رسیده به صف او را می‌بیند ───
    if (isArtist && booking.status === "REQUESTED") {
      return error("این رزرو هنوز توسط پشتیبانی نوبت مارکت بررسی نشده است");
    }

    // ─── گیت بیعانه: تأیید هنرمند بدون پرداخت بیعانه ممکن نیست ───
    if (isArtist && newStatus === "CONFIRMED") {
      const { hasPaidDeposit, getDepositPercent } = await import(
        "@/lib/booking-rules"
      );
      if (!(await hasPaidDeposit(bookingId))) {
        const percent = await getDepositPercent();
        return error(
          `تا پرداخت بیعانه (${percent}٪) توسط مشتری، امکان تأیید رزرو نیست`
        );
      }
    }

    // ─── رد توسط هنرمند: دلیل الزامی است ───
    if (isArtist && newStatus === "CANCELLED_BY_ARTIST" && !reason?.trim()) {
      return error("برای رد رزرو، وارد کردن دلیل الزامی است");
    }

    // ─── پس از تأیید، هنرمند دیگر نمی‌تواند رزرو را رد/لغو کند ───
    if (
      isArtist &&
      newStatus === "CANCELLED_BY_ARTIST" &&
      ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)
    ) {
      return error(
        "پس از تأیید رزرو، امکان رد یا لغو توسط هنرمند وجود ندارد. برای هرگونه تغییر با پشتیبانی نوبت مارکت در تماس باشید."
      );
    }

    // ─── اجرای سیاست لغو ───
    if (newStatus === "CANCELLED_BY_CLIENT") {
      const bookingFull = await db.booking.findUnique({
        where: { id: bookingId },
        select: {
          scheduledDate: true,
          serviceId: true,
          startTime: true,
        },
      });

      if (bookingFull) {
        // دریافت حداقل ساعت لغو از سرویس
        let noticeHours = 24; // پیش‌فرض
        if (bookingFull.serviceId) {
          const service = await db.service.findUnique({
            where: { id: bookingFull.serviceId },
            select: { cancellationNoticeHours: true },
          });
          noticeHours = service?.cancellationNoticeHours || 24;
        }

        // محاسبه زمان مجاز لغو
        const scheduledDateTime = new Date(bookingFull.scheduledDate);
        const [hours, minutes] = bookingFull.startTime.split(":").map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        const deadline = new Date(scheduledDateTime.getTime() - noticeHours * 60 * 60 * 1000);
        const now = new Date();

        if (now > deadline) {
          return error(
            `لغو رزرو کمتر از ${noticeHours} ساعت قبل از زمان مقرر امکان‌پذیر نیست یا مشمول جریمه می‌شود.`
          );
        }
      }
    }

    const isCancellation =
      newStatus.startsWith("CANCELLED") || newStatus === "NO_SHOW";
    const note = reason?.trim() || "";

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus as any,
        // برای رد/لغو، دلیل در cancellationReason و برای بقیه حالت‌ها
        // پیام یادداشت هنرمند در artistNotes ذخیره می‌شود.
        ...(isCancellation ? { cancellationReason: note || null } : {}),
        ...(!isCancellation && note ? { artistNotes: note } : {}),
        ...(newStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    // ─── تسویه مالی و شمارنده تکمیل هنگام اتمام پروژه ───
    if (newStatus === "COMPLETED" && booking.status !== "COMPLETED") {
      const { settleCompletedBooking } = await import("@/lib/booking-rules");
      await settleCompletedBooking(bookingId);
      await db.artistProfile.updateMany({
        where: { userId: booking.artistId },
        data: { completedBookings: { increment: 1 } },
      });
    }

    // اگر کنسل شد، کش جلسات را پاک کن
    if (newStatus.startsWith("CANCELLED")) {
      const bookingFull = await db.booking.findUnique({
        where: { id: bookingId },
        select: { artistId: true, scheduledDate: true },
      });
      if (bookingFull) {
        const dateStr = bookingFull.scheduledDate.toISOString().split("T")[0];
        // پاک کردن کش (خطای Redis نباید جریان اصلی را متوقف کند)
        try {
          const keys = await redis.keys(`${REDIS_KEYS.SLOTS}*:${dateStr}`);
          if (keys.length > 0) await redis.del(...keys);
        } catch (cacheErr) {
          console.error("خطای Redis در پاک‌سازی کش (غیرمهم):", cacheErr);
        }
      }
    }

    // ─── ارسال اعلان بر اساس نوع تغییر ───
    if (newStatus === "CONFIRMED") {
      await triggerNotification("BOOKING_CONFIRMED", booking.clientId, { bookingId });
      // ─── باز کردن خودکار گفتگوی دوسویه مشتری ↔ هنرمند ───
      const { ensureBookingConversation } = await import("@/lib/booking-conversation");
      await ensureBookingConversation(bookingId);
      // پیام یادداشت هنرمند همراه تأیید
      if (reason?.trim()) {
        await db.notification
          .create({
            data: {
              userId: booking.clientId,
              title: "پیام هنرمند درباره رزرو تأییدشده ✅",
              message: `رزرو شما تأیید شد.${`\n\nپیام هنرمند: ${reason.trim()}`}\n\nاکنون می‌توانید از بخش پیام‌ها با هنرمند گفتگو کنید.`,
              type: "MESSAGE",
              link: "/client/inbox?tab=chat",
              data: { bookingId, status: newStatus },
            },
          })
          .catch(() => undefined);
      }
    } else if (newStatus === "COMPLETED") {
      await triggerNotification("BOOKING_COMPLETED", booking.clientId, { bookingId });
    } else if (newStatus === "CANCELLED_BY_ARTIST" && isArtist) {
      // رد رزرو توسط هنرمند: اعلان با دلیل به مشتری
      await db.notification
        .create({
          data: {
            userId: booking.clientId,
            title: "رزرو شما توسط هنرمند رد شد ❌",
            message: `رزرو شما رد شد.${reason?.trim() ? `\n\nدلیل هنرمند: ${reason.trim()}` : ""}\n\nمی‌توانید زمان دیگری رزرو کنید یا هنرمند دیگری را انتخاب کنید.`,
            type: "WARNING",
            link: "/client/bookings",
            data: { bookingId, status: newStatus },
          },
        })
        .catch(() => undefined);
    } else if (newStatus === "RESCHEDULE_PENDING") {
      // درخواست تغییر زمان توسط هنرمند: مشتری باید زمان جدید انتخاب کند
      await db.notification
        .create({
          data: {
            userId: booking.clientId,
            title: "درخواست تغییر زمان رزرو 🔄",
            message: `هنرمند برای رزرو شما زمان جدیدی درخواست کرده است.${reason?.trim() ? `\n\nپیام هنرمند: ${reason.trim()}` : ""}\n\nلطفاً از بخش رزروهای من، زمان جدید را انتخاب کنید.`,
            type: "WARNING",
            link: "/client/bookings",
            data: { bookingId, status: newStatus },
          },
        })
        .catch(() => undefined);
    } else if (newStatus.startsWith("CANCELLED")) {
      const recipientId = isClient ? booking.artistId : booking.clientId;
      await triggerNotification("BOOKING_CANCELLED", recipientId, { bookingId });
    }

    return success("وضعیت رزرو به‌روزرسانی شد");
  } catch (err) {
    console.error("خطا در به‌روزرسانی وضعیت:", err);
    return error("خطا در به‌روزرسانی وضعیت");
  }
}

// ============================================================================
// Server Action: انتخاب زمان جدید توسط مشتری (پس از درخواست تغییر زمان)
// ============================================================================
export async function rescheduleBooking(
  bookingId: string,
  date: string,
  startTime: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    if (!bookingId || !date || !startTime) {
      return error("اطلاعات زمان جدید ناقص است");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        clientId: true,
        artistId: true,
        status: true,
        serviceId: true,
      },
    });

    if (!booking) return error("رزرو یافت نشد");
    if (booking.clientId !== auth.user.id) return error("دسترسی ندارید");
    if (!["RESCHEDULE_PENDING", "CONFIRMED"].includes(booking.status)) {
      return error("در وضعیت فعلی امکان انتخاب زمان جدید وجود ندارد");
    }

    // مدت زمان سرویس برای محاسبه ساعت پایان
    let duration = 60;
    if (booking.serviceId) {
      const service = await db.service.findUnique({
        where: { id: booking.serviceId },
        select: { durationMinutes: true },
      });
      duration = service?.durationMinutes || 60;
    }

    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
    const scheduledDate = new Date(date + "T00:00:00");

    // بررسی تداخل با رزروهای فعال دیگر (درخواست‌های بیعانه‌پرداخت‌نشدهٔ منقضی‌شده مانع نیستند)
    const conflict = await db.booking.findFirst({
      where: {
        id: { not: bookingId },
        artistId: booking.artistId,
        scheduledDate,
        ...slotHoldingBookingFilter(),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    if (conflict) {
      return error("این ساعت قبلاً رزرو شده است. لطفاً زمان دیگری انتخاب کنید");
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        scheduledDate,
        startTime,
        endTime,
        // پس از انتخاب زمان جدید، رزرو دوباره به تأیید هنرمند می‌رود
        status: "PENDING_ARTIST",
      },
    });

    // پاک‌سازی کش جلسات (خطای Redis نباید جریان اصلی را متوقف کند)
    try {
      const keys = await redis.keys(`${REDIS_KEYS.SLOTS}*:${date}`);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      /* بی‌اهمیت */
    }

    // اعلان به هنرمند
    await db.notification
      .create({
        data: {
          userId: booking.artistId,
          title: "زمان جدید رزرو انتخاب شد 🔄",
          message: `مشتری برای رزرو ${booking.bookingNumber} زمان جدیدی انتخاب کرد. لطفاً تأیید یا رد کنید.`,
          type: "BOOKING",
          link: "/artist/dashboard/bookings",
          data: { bookingId, status: "PENDING_ARTIST" },
        },
      })
      .catch(() => undefined);

    return success("زمان جدید ثبت شد و برای تأیید نهایی به هنرمند ارسال شد");
  } catch (err) {
    console.error("خطا در تغییر زمان رزرو:", err);
    return error("خطا در ثبت زمان جدید");
  }
}

// ============================================================================
// کمکی (غیر صادرشده): محاسبه همه جلسات یک روز برای یک هنرمند
// ============================================================================
async function computeDaySlots(
  artistProfileId: string,
  artistUserId: string,
  durationMinutes: number,
  date: string
): Promise<{ startTime: string; endTime: string; available: boolean }[]> {
  const targetDate = new Date(date);
  const dayMap: Record<number, string> = {
    0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
    4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
  };
  const dayName = dayMap[targetDate.getDay()];

  const availability = await db.availability.findFirst({
    where: { artistProfileId, dayOfWeek: dayName as any, isActive: true },
  });
  if (!availability) return [];

  // مرخصی
  const timeOff = await db.timeOff.findFirst({
    where: {
      artistProfileId,
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
  });
  if (timeOff) return [];

  // فقط رزروهایی که واقعاً زمان را قفل کرده‌اند (درخواست‌های بدون بیعانه
  // بعد از گذشت مهلت ۴ ساعته، زمان را آزاد می‌کنند)
  const existingBookings = await db.booking.findMany({
    where: {
      artistId: artistUserId,
      scheduledDate: targetDate,
      ...slotHoldingBookingFilter(),
    },
    select: { startTime: true, endTime: true },
  });

  const workStart = timeToMinutes(availability.startTime);
  const workEnd = timeToMinutes(availability.endTime);
  const buffer = BOOKING_CONSTRAINTS.BUFFER_MINUTES;
  const slots: { startTime: string; endTime: string; available: boolean }[] = [];

  let current = workStart;
  while (current + durationMinutes <= workEnd) {
    const sTime = minutesToTime(current);
    const eTime = minutesToTime(current + durationMinutes);

    let available = true;
    for (const b of existingBookings) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (current < bEnd + buffer && current + durationMinutes > bStart - buffer) {
        available = false;
        break;
      }
    }

    slots.push({ startTime: sTime, endTime: eTime, available });
    current += durationMinutes + buffer;
  }

  return slots;
}

// ============================================================================
// Server Action: دریافت جلسات در دسترس برای رزرو
// ============================================================================

export async function getAvailableSlots(
  artistSlug: string,
  date: string,
  serviceId: string
): Promise<ApiResponse<{ startTime: string; endTime: string; available: boolean }[]>> {
  try {
    const artistProfile = await db.artistProfile.findUnique({
      where: { slug: artistSlug },
      select: { id: true, userId: true },
    });

    if (!artistProfile) return error("هنرمند یافت نشد");

    const service = await db.service.findFirst({
      where: { id: serviceId, artistProfileId: artistProfile.id, isActive: true },
      select: { durationMinutes: true },
    });

    if (!service) return error("سرویس یافت نشد");

    const slots = await computeDaySlots(
      artistProfile.id,
      artistProfile.userId,
      service.durationMinutes,
      date
    );

    if (slots.length === 0) return success("این روز زمان آزادی ندارد", []);

    return success("جلسات دریافت شد", slots);
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت جلسات");
  }
}

// ============================================================================
// Server Action: زمان‌های آزاد هنرمند در روزهای آینده
// ============================================================================
// فقط روزهایی که حداقل یک جلسه آزاد دارند برگردانده می‌شوند تا مشتری
// بدون گشتن در تاریخ‌ها، زمان خالی را انتخاب کند.

export async function getUpcomingAvailableSlots(
  artistSlug: string,
  serviceId: string,
  days = 21
): Promise<
  ApiResponse<
    {
      date: string;
      weekday: number;
      isToday: boolean;
      slots: { startTime: string; endTime: string }[];
    }[]
  >
> {
  try {
    const artistProfile = await db.artistProfile.findUnique({
      where: { slug: artistSlug },
      select: { id: true, userId: true, isAcceptingBookings: true },
    });

    if (!artistProfile) return error("هنرمند یافت نشد");

    const service = await db.service.findFirst({
      where: { id: serviceId, artistProfileId: artistProfile.id, isActive: true },
      select: { durationMinutes: true },
    });

    if (!service) return error("سرویس یافت نشد");

    const padding = (n: number) => n.toString().padStart(2, "0");
    const now = Date.now();
    const minAdvanceMs = BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS * 60 * 60 * 1000;
    const start = new Date();
    const baseUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());

    const result: {
      date: string;
      weekday: number;
      isToday: boolean;
      slots: { startTime: string; endTime: string }[];
    }[] = [];

    const window = Math.min(Math.max(days, 1), 60);

    // روز به روز جلو می‌رویم تا به تعداد کافی روز دارای زمان آزاد برسیم
    for (let i = 0; i < window && result.length < 14; i++) {
      const dayMs = baseUtc + i * 24 * 60 * 60 * 1000;
      const d = new Date(dayMs);
      const dateStr = `${d.getUTCFullYear()}-${padding(d.getUTCMonth() + 1)}-${padding(d.getUTCDate())}`;

      const allSlots = await computeDaySlots(
        artistProfile.id,
        artistProfile.userId,
        service.durationMinutes,
        dateStr
      );

      // فقط جلسات آزاد و با رعایت حداقل فاصله زمانی رزرو
      const free = allSlots
        .filter((s) => {
          if (!s.available) return false;
          const [h, m] = s.startTime.split(":").map(Number);
          const slotTs = dayMs + (h * 60 + m) * 60 * 1000;
          return slotTs - now >= minAdvanceMs;
        })
        .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));

      if (free.length > 0) {
        result.push({ date: dateStr, weekday: d.getUTCDay(), isToday: i === 0, slots: free });
      }
    }

    return success("زمان‌های آزاد دریافت شد", result);
  } catch (err) {
    console.error("خطا در دریافت زمان‌های آزاد:", err);
    return error("خطا در دریافت زمان‌های آزاد");
  }
}
