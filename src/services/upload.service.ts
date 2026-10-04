"use server";

// ============================================================================
// سرویس آپلود تصویر - Server Actions
// ============================================================================

import { requireRole } from "@/lib/role-guard";
import { uploadImage, uploadImages, deleteUploadedFiles } from "@/lib/upload";
import { redis } from "@/lib/redis";
import { RATE_LIMITS, UPLOAD_LIMITS } from "@/constants";
import type { ApiResponse } from "@/types";
import type { UploadResult } from "@/lib/upload";

// ============================================================================
// ثابت‌ها
// ============================================================================

/** حداکثر تعداد آپلود در روز (برای هر هنرمند) */
const MAX_UPLOADS_PER_DAY = 50;

/** کلید rate limiting آپلود */
function getUploadRateLimitKey(artistId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `ratelimit:upload:${artistId}:${today}`;
}

// ============================================================================
// Server Action: آپلود تک تصویر
// ============================================================================

export async function uploadSingleImage(
  formData: FormData
): Promise<ApiResponse<UploadResult>> {
  try {
    // بررسی نقش
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    // بررسی rate limit
    const rateLimitKey = getUploadRateLimitKey(auth.user.id);
    const currentCount = await redis.get(rateLimitKey);

    if (currentCount && parseInt(currentCount) >= MAX_UPLOADS_PER_DAY) {
      return {
        success: false,
        message: `سقف روزانه آپلود (${MAX_UPLOADS_PER_DAY} تصویر) تمام شده است. فردا دوباره تلاش کنید`,
      };
    }

    // دریافت فایل
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, message: "فایلی انتخاب نشده است" };
    }

    // آپلود و پردازش
    const folder = auth.user.role === "ADMIN" ? "admin" : "portfolio";
    const result = await uploadImage(file, folder);

    if (result.success) {
      // افزایش شمارنده rate limit
      const newCount = await redis.incr(rateLimitKey);
      if (newCount === 1) {
        // تنظیم TTL برای ۲۴ ساعت
        await redis.expire(rateLimitKey, 24 * 60 * 60);
      }
    }

    return result;
  } catch (error) {
    console.error("خطا در آپلود تصویر:", error);
    return { success: false, message: "خطا در آپلود تصویر" };
  }
}

// ============================================================================
// Server Action: آپلود چند تصویر
// ============================================================================

export async function uploadMultipleImages(
  formData: FormData
): Promise<ApiResponse<UploadResult[]>> {
  try {
    // بررسی نقش
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    // بررسی rate limit
    const rateLimitKey = getUploadRateLimitKey(auth.user.id);
    const currentCount = await redis.get(rateLimitKey);

    if (currentCount && parseInt(currentCount) >= MAX_UPLOADS_PER_DAY) {
      return {
        success: false,
        message: `سقف روزانه آپلود (${MAX_UPLOADS_PER_DAY} تصویر) تمام شده است`,
      };
    }

    // دریافت فایل‌ها
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return { success: false, message: "فایلی انتخاب نشده است" };
    }

    // بررسی محدودیت تعداد باقی‌مانده
    const remainingQuota = MAX_UPLOADS_PER_DAY - (currentCount ? parseInt(currentCount) : 0);
    if (files.length > remainingQuota) {
      return {
        success: false,
        message: `فقط ${remainingQuota} فایل دیگر امکان آپلود دارید`,
      };
    }

    // آپلود
    const folder = auth.user.role === "ADMIN" ? "admin" : "portfolio";
    const result = await uploadImages(files, folder);

    if (result.success && result.data) {
      // افزایش شمارنده
      const newCount = await redis.incrby(rateLimitKey, result.data.length);
      if (newCount === result.data.length) {
        await redis.expire(rateLimitKey, 24 * 60 * 60);
      }
    }

    return result;
  } catch (error) {
    console.error("خطا در آپلود تصاویر:", error);
    return { success: false, message: "خطا در آپلود تصاویر" };
  }
}

// ============================================================================
// Server Action: حذف تصویر
// ============================================================================

export async function deleteImage(
  urls: string[]
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    await deleteUploadedFiles(urls);

    return { success: true, message: "تصویر با موفقیت حذف شد" };
  } catch (error) {
    console.error("خطا در حذف تصویر:", error);
    return { success: false, message: "خطا در حذف تصویر" };
  }
}

// ============================================================================
// Server Action: دریافت تعداد آپلود باقی‌مانده
// ============================================================================

export async function getUploadQuota(): Promise<
  ApiResponse<{ used: number; remaining: number; max: number }>
> {
  try {
    const auth = await requireRole("ARTIST", "ADMIN");
    if (auth.error) return auth.error;

    const rateLimitKey = getUploadRateLimitKey(auth.user.id);
    const currentCount = await redis.get(rateLimitKey);
    const used = currentCount ? parseInt(currentCount) : 0;

    return {
      success: true,
      data: {
        used,
        remaining: MAX_UPLOADS_PER_DAY - used,
        max: MAX_UPLOADS_PER_DAY,
      },
    };
  } catch (error) {
    console.error("خطا در دریافت سهمیه آپلود:", error);
    return { success: false, message: "خطا در دریافت سهمیه آپلود" };
  }
}
