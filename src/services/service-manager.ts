"use server";

// ============================================================================
// سرویس مدیریت سرویس‌ها و قیمت‌گذاری هنرمند
// ============================================================================

import { db } from "@/lib/db";
import { requireRole } from "@/lib/role-guard";
import type { ApiResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface ServiceInput {
  name: string;
  description?: string;
  basePrice: number;
  maxPrice?: number;
  durationMinutes: number;
  supportedSizes: string[];
}

// ============================================================================
// کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}
function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// دریافت سرویس‌های هنرمند
// ============================================================================

export async function getMyServices(): Promise<
  ApiResponse<{
    items: {
      id: string;
      name: string;
      description: string | null;
      basePrice: bigint;
      maxPrice: bigint | null;
      durationMinutes: number;
      supportedSizes: string[];
      isActive: boolean;
      bookingCount: number;
      depositType: string;
      depositValue: bigint;
      createdAt: Date;
    }[];
    count: number;
    maxAllowed: number;
  }>
> {
  try {
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const items = await db.service.findMany({
      where: { artistProfileId: profile.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        maxPrice: true,
        durationMinutes: true,
        supportedSizes: true,
        isActive: true,
        bookingCount: true,
        depositType: true,
        depositValue: true,
        createdAt: true,
      },
    });

    // سقف رایگان: ۳ سرویس
    return success("سرویس‌ها دریافت شد", {
      items,
      count: items.length,
      maxAllowed: 3,
    });
  } catch (err) {
    console.error("خطا در دریافت سرویس‌ها:", err);
    return error("خطا در دریافت سرویس‌ها");
  }
}

// ============================================================================
// ایجاد سرویس جدید
// ============================================================================

export async function createService(
  input: ServiceInput
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    if (!profile) return error("پروفایل هنرمند یافت نشد");

    // بررسی سقف (حداکثر ۳ سرویس)
    const count = await db.service.count({
      where: { artistProfileId: profile.id },
    });
    if (count >= 3) {
      return error("حداکثر ۳ سرویس مجاز است. یک سرویس حذف کنید.");
    }

    // اعتبارسنجی
    if (!input.name || input.name.length < 2) {
      return error("نام سرویس باید حداقل ۲ کاراکتر باشد");
    }
    if (!input.basePrice || input.basePrice <= 0) {
      return error("قیمت پایه باید بزرگتر از صفر باشد");
    }
    if (!input.durationMinutes || input.durationMinutes < 30) {
      return error("حداقل مدت زمان ۳۰ دقیقه است");
    }
    if (!input.supportedSizes || input.supportedSizes.length === 0) {
      return error("حداقل یک اندازه انتخاب کنید");
    }

    const svc = await db.service.create({
      data: {
        artistProfileId: profile.id,
        name: input.name,
        description: input.description || null,
        basePrice: BigInt(input.basePrice),
        maxPrice: input.maxPrice ? BigInt(input.maxPrice) : null,
        durationMinutes: input.durationMinutes,
        supportedSizes: input.supportedSizes as any[],
      },
      select: { id: true },
    });

    return success("سرویس با موفقیت ایجاد شد", { id: svc.id });
  } catch (err) {
    console.error("خطا در ایجاد سرویس:", err);
    return error("خطا در ایجاد سرویس");
  }
}

// ============================================================================
// ویرایش سرویس
// ============================================================================

export async function updateService(
  id: string,
  input: ServiceInput
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const existing = await db.service.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true },
    });
    if (!existing) return error("سرویس یافت نشد یا دسترسی ندارید");

    if (!input.name || input.name.length < 2) {
      return error("نام سرویس باید حداقل ۲ کاراکتر باشد");
    }
    if (!input.basePrice || input.basePrice <= 0) {
      return error("قیمت پایه باید بزرگتر از صفر باشد");
    }
    if (!input.durationMinutes || input.durationMinutes < 30) {
      return error("حداقل مدت زمان ۳۰ دقیقه است");
    }
    if (!input.supportedSizes || input.supportedSizes.length === 0) {
      return error("حداقل یک اندازه انتخاب کنید");
    }

    await db.service.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
        basePrice: BigInt(input.basePrice),
        maxPrice: input.maxPrice ? BigInt(input.maxPrice) : null,
        durationMinutes: input.durationMinutes,
        supportedSizes: input.supportedSizes as any[],
      },
    });

    return success("سرویس با موفقیت به‌روزرسانی شد");
  } catch (err) {
    console.error("خطا در ویرایش سرویس:", err);
    return error("خطا در ویرایش سرویس");
  }
}

// ============================================================================
// حذف سرویس
// ============================================================================

export async function deleteService(id: string): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const existing = await db.service.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true, bookingCount: true },
    });
    if (!existing) return error("سرویس یافت نشد یا دسترسی ندارید");

    if (existing.bookingCount > 0) {
      return error("این سرویس دارای رزروهای فعال است و قابل حذف نیست");
    }

    await db.service.delete({ where: { id } });
    return success("سرویس با موفقیت حذف شد");
  } catch (err) {
    console.error("خطا در حذف سرویس:", err);
    return error("خطا در حذف سرویس");
  }
}

// ============================================================================
// تغییر وضعیت فعال/غیرفعال
// ============================================================================

export async function toggleServiceActive(
  id: string,
  isActive: boolean
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const existing = await db.service.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true },
    });
    if (!existing) return error("سرویس یافت نشد یا دسترسی ندارید");

    await db.service.update({ where: { id }, data: { isActive } });
    return success(isActive ? "سرویس فعال شد" : "سرویس غیرفعال شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در تغییر وضعیت");
  }
}
