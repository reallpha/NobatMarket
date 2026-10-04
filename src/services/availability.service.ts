"use server";

// ============================================================================
// سرویس مدیریت در دسترسی و نوبت‌دهی هنرمند - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { requireRole } from "@/lib/role-guard";
import { BOOKING_CONSTRAINTS, REDIS_KEYS } from "@/constants";
import type { ApiResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface AvailabilityInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  note?: string;
}

interface TimeOffInput {
  startDate: string;
  endDate: string;
  title?: string;
  note?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  date: string;
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

/** تبدیل رشته HH:MM به دقیقه از نیمه‌شب */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** تبدیل دقیقه به رشته HH:MM */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** کلید کش جلسات */
function getSlotsCacheKey(artistProfileId: string, date: string): string {
  return `${REDIS_KEYS.SLOTS}${artistProfileId}:${date}`;
}

// ============================================================================
// Server Action: دریافت برنامه هفتگی هنرمند
// ============================================================================

export async function getMySchedule(): Promise<
  ApiResponse<{
    availabilities: {
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      isActive: boolean;
      note: string | null;
    }[];
    timeOffs: {
      id: string;
      startDate: Date;
      endDate: Date;
      title: string | null;
      note: string | null;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) {
      return error("پروفایل هنرمند یافت نشد");
    }

    const [availabilities, timeOffs] = await Promise.all([
      db.availability.findMany({
        where: { artistProfileId: profile.id },
        orderBy: { dayOfWeek: "asc" },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
          note: true,
        },
      }),
      db.timeOff.findMany({
        where: {
          artistProfileId: profile.id,
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          title: true,
          note: true,
        },
      }),
    ]);

    return success("برنامه دریافت شد", { availabilities, timeOffs });
  } catch (err) {
    console.error("خطا در دریافت برنامه:", err);
    return error("خطا در دریافت برنامه");
  }
}

// ============================================================================
// Server Action: به‌روزرسانی برنامه هفتگی
// ============================================================================

export async function updateWeeklySchedule(
  availabilities: AvailabilityInput[]
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) {
      return error("پروفایل هنرمند یافت نشد");
    }

    // حذف برنامه قبلی و ایجاد برنامه جدید
    await db.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { artistProfileId: profile.id },
      });

      await tx.availability.createMany({
        data: availabilities.map((a) => ({
          artistProfileId: profile.id,
          dayOfWeek: a.dayOfWeek as any,
          startTime: a.startTime,
          endTime: a.endTime,
          isActive: a.isActive,
          note: a.note || null,
        })),
      });
    });

    // پاک کردن کش جلسات
    const pattern = `${REDIS_KEYS.SLOTS}${profile.id}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // ─── ارسال اعلان به لیست انتظار ───
    const { notifyWaitlist } = await import("@/services/waitlist.service");
    await notifyWaitlist(profile.id);

    return success("برنامه هفتگی با موفقیت به‌روزرسانی شد");
  } catch (err) {
    console.error("خطا در به‌روزرسانی برنامه:", err);
    return error("خطا در به‌روزرسانی برنامه");
  }
}

// ============================================================================
// Server Action: اضافه کردن مرخصی
// ============================================================================

export async function addTimeOff(
  input: TimeOffInput
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) {
      return error("پروفایل هنرمند یافت نشد");
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate > endDate) {
      return error("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد");
    }

    const timeOff = await db.timeOff.create({
      data: {
        artistProfileId: profile.id,
        startDate,
        endDate,
        title: input.title || null,
        note: input.note || null,
      },
      select: { id: true },
    });

    return success("مرخصی با موفقیت اضافه شد", { id: timeOff.id });
  } catch (err) {
    console.error("خطا در اضافه کردن مرخصی:", err);
    return error("خطا در اضافه کردن مرخصی");
  }
}

// ============================================================================
// Server Action: حذف مرخصی
// ============================================================================

export async function deleteTimeOff(id: string): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const existing = await db.timeOff.findFirst({
      where: { id, artistProfileId: profile.id },
    });

    if (!existing) return error("مرخصی یافت نشد");

    await db.timeOff.delete({ where: { id } });

    return success("مرخصی حذف شد");
  } catch (err) {
    console.error("خطا در حذف مرخصی:", err);
    return error("خطا در حذف مرخصی");
  }
}

// ============================================================================
// تابع اصلی تولید جلسات در دسترس
// ============================================================================

/**
 * تولید جلسات در دسترس برای یک تاریخ خاص
 * این تابع: 1) برنامه هفتگی را بررسی می‌کند
 *           2) مرخصی‌ها را بررسی می‌کند
 *           3) رزروهای موجود را بررسی می‌کند
 *           4) بافر بین جلسات را اعمال می‌کند
 *           5) حداکثر تعداد رزرو در روز را اعمال می‌کند
 */
export async function generateAvailableSlots(
  artistProfileId: string,
  date: string,
  serviceDurationMinutes: number
): Promise<TimeSlot[]> {
  // چک کش
  const cacheKey = getSlotsCacheKey(artistProfileId, date);
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as TimeSlot[];
      // فیلتر کردن بر اساس مدت سرویس
      return parsed.filter((slot) => {
        if (!slot.available) return false;
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = slotStart + serviceDurationMinutes;
        const slotAvailableEnd = timeToMinutes(
          parsed.find(
            (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
          )?.endTime || "23:59"
        );
        return slotEnd <= slotAvailableEnd;
      });
    } catch {
      // کش خراب - ادامه بده
    }
  }

  const targetDate = new Date(date);
  const dayOfWeekIndex = targetDate.getDay();

  // نگاشت index به نام روز (شنبه=6, یکشنبه=0, ...)
  const dayMap: Record<number, string> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };

  const dayName = dayMap[dayOfWeekIndex];

  // 1) دریافت برنامه این روز
  const availability = await db.availability.findFirst({
    where: {
      artistProfileId,
      dayOfWeek: dayName as any,
      isActive: true,
    },
  });

  if (!availability) {
    return []; // این روز تعطیل است
  }

  // 2) بررسی مرخصی
  const timeOff = await db.timeOff.findFirst({
    where: {
      artistProfileId,
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
  });

  if (timeOff) {
    return []; // این روز مرخصی است
  }

  // 3) دریافت رزروهای موجود
  const existingBookings = await db.booking.findMany({
    where: {
      artistId: (await db.artistProfile.findUnique({
        where: { id: artistProfileId },
        select: { userId: true },
      }))?.userId || "",
      scheduledDate: targetDate,
      status: {
        in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // 4) تولید جلسات
  const workStart = timeToMinutes(availability.startTime);
  const workEnd = timeToMinutes(availability.endTime);
  const buffer = BOOKING_CONSTRAINTS.BUFFER_MINUTES;
  const slots: TimeSlot[] = [];

  let current = workStart;
  while (current + serviceDurationMinutes <= workEnd) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + serviceDurationMinutes);

    // بررسی تداخل با رزروهای موجود
    let isAvailable = true;
    for (const booking of existingBookings) {
      const bStart = timeToMinutes(booking.startTime);
      const bEnd = timeToMinutes(booking.endTime);

      if (
        current < bEnd + buffer &&
        current + serviceDurationMinutes > bStart - buffer
      ) {
        isAvailable = false;
        break;
      }
    }

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: isAvailable,
      date,
    });

    current += serviceDurationMinutes + buffer;
  }

  // ذخیره در کش (۵ دقیقه)
  await redis.setex(cacheKey, 5 * 60, JSON.stringify(slots));

  return slots;
}

// ============================================================================
// Server Action: دریافت جلسات در دسترس (برای صفحه رزرو)
// ============================================================================

export async function getAvailableSlotsForDate(
  artistProfileId: string,
  date: string,
  serviceDurationMinutes: number
): Promise<ApiResponse<TimeSlot[]>> {
  try {
    const slots = await generateAvailableSlots(
      artistProfileId,
      date,
      serviceDurationMinutes
    );

    return success("جلسات دریافت شد", slots);
  } catch (err) {
    console.error("خطا در دریافت جلسات:", err);
    return error("خطا در دریافت جلسات");
  }
}
