"use server";

// ============================================================================
// سرویس مدیریت پورتفولیو - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/role-guard";
import { deleteUploadedFiles } from "@/lib/upload";
import type { ApiResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface CreatePortfolioItemInput {
  title: string;
  description?: string;
  images: string[];
  style: string;
  size?: string;
  bodyPlacement?: string;
  durationMinutes?: number;
  price?: number;
  tags: string[];
  isCustom?: boolean;
}

interface UpdatePortfolioItemInput {
  title?: string;
  description?: string;
  images?: string[];
  style?: string;
  size?: string;
  bodyPlacement?: string;
  durationMinutes?: number;
  price?: number;
  tags?: string[];
  isCustom?: boolean;
  status?: string;
  sortOrder?: number;
}

// ============================================================================
// توابع کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(
  message: string,
  errors?: Record<string, string[]>
): ApiResponse<never> {
  return { success: false, message, errors } as ApiResponse<never>;
}

// ============================================================================
// Server Action: دریافت پورتفولیوی هنرمند
// ============================================================================

export async function getMyPortfolio(): Promise<
  ApiResponse<{
    items: {
      id: string;
      title: string;
      description: string | null;
      images: string[];
      style: string;
      size: string | null;
      durationMinutes: number | null;
      price: bigint | null;
      tags: string[];
      likeCount: number;
      saveCount: number;
      status: string;
      sortOrder: number;
      createdAt: Date;
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

    const items = await db.portfolioItem.findMany({
      where: { artistProfileId: profile.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        style: true,
        size: true,
        durationMinutes: true,
        price: true,
        tags: true,
        likeCount: true,
        saveCount: true,
        status: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return success("پورتفولیو دریافت شد", { items });
  } catch (err) {
    console.error("خطا در دریافت پورتفولیو:", err);
    return error("خطا در دریافت پورتفولیو");
  }
}

// ============================================================================
// Server Action: ایجاد آیتم پورتفولیو
// ============================================================================

export async function createPortfolioItem(
  input: CreatePortfolioItemInput
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) {
      return error("پروفایل هنرمند یافت نشد. ابتدا پروفایل خود را بسازید");
    }

    // ─── بررسی سهمیه ───
    const { checkQuota } = await import("@/services/quota.service");
    const quota = await checkQuota(profile.id, "portfolio");
    if (quota.success && quota.data && !quota.data.allowed) {
      return error(
        `شما به سقف مجاز نمونه‌کارها (${quota.data.max} عدد) در پلن ${quota.data.plan === "FREE" ? "رایگان" : "حرفه‌ای"} رسیده‌اید. ` +
        `برای ارتقا، با پشتیبانی تماس بگیرید.`
      );
    }

    // اعتبارسنجی دستی
    if (!input.title || input.title.length < 2) {
      return error("عنوان باید حداقل ۲ کاراکتر باشد");
    }
    if (!input.images || input.images.length === 0) {
      return error("حداقل یک تصویر اضافه کنید");
    }
    if (!input.style) {
      return error("سبک تتو الزامی است");
    }

    // محاسبه ترتیب نمایش
    const lastItem = await db.portfolioItem.findFirst({
      where: { artistProfileId: profile.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastItem?.sortOrder || 0) + 1;

    const item = await db.portfolioItem.create({
      data: {
        artistProfileId: profile.id,
        title: input.title,
        description: input.description || null,
        images: input.images,
        style: input.style as any,
        size: input.size as any || null,
        durationMinutes: input.durationMinutes || null,
        price: input.price ? BigInt(input.price) : null,
        tags: input.tags || [],
        isCustom: input.isCustom || false,
        // نمونه‌کار جدید ابتدا در انتظار بررسی ادمین است
        status: "DRAFT",
        sortOrder: nextSortOrder,
        publishedAt: null,
      },
      select: { id: true },
    });

    return success(
      "نمونه‌کار ثبت شد و پس از تأیید مدیریت در پروفایل شما نمایش داده می‌شود",
      { id: item.id }
    );
  } catch (err) {
    console.error("خطا در ایجاد آیتم پورتفولیو:", err);
    return error("خطا در ایجاد آیتم پورتفولیو");
  }
}

// ============================================================================
// Server Action: به‌روزرسانی آیتم پورتفولیو
// ============================================================================

export async function updatePortfolioItem(
  id: string,
  input: UpdatePortfolioItemInput
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    // بررسی مالکیت
    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) {
      return error("پروفایل هنرمند یافت نشد");
    }

    const existing = await db.portfolioItem.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true },
    });

    if (!existing) {
      return error("آیتم مورد نظر یافت نشد یا دسترسی ندارید");
    }

    // آماده‌سازی داده‌ها
    const updateData: Record<string, any> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.style !== undefined) updateData.style = input.style;
    if (input.size !== undefined) updateData.size = input.size;
    if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
    if (input.price !== undefined) updateData.price = input.price ? BigInt(input.price) : null;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.isCustom !== undefined) updateData.isCustom = input.isCustom;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

    // هنرمند نمی‌تواند اثر را مستقیماً منتشر کند؛ انتشار فقط توسط ادمین انجام می‌شود
    if (updateData.status === "PUBLISHED") {
      updateData.status = "DRAFT";
      updateData.publishedAt = null;
    }

    await db.portfolioItem.update({
      where: { id },
      data: updateData,
    });

    return success("آیتم پورتفولیو با موفقیت به‌روزرسانی شد");
  } catch (err) {
    console.error("خطا در به‌روزرسانی آیتم پورتفولیو:", err);
    return error("خطا در به‌روزرسانی آیتم پورتفولیو");
  }
}

// ============================================================================
// Server Action: حذف آیتم پورتفولیو
// ============================================================================

export async function deletePortfolioItem(
  id: string
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

    const existing = await db.portfolioItem.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true, images: true },
    });

    if (!existing) {
      return error("آیتم مورد نظر یافت نشد یا دسترسی ندارید");
    }

    // حذف فایل‌های تصویر از storage
    await deleteUploadedFiles(existing.images);

    // حذف رکورد
    await db.portfolioItem.delete({
      where: { id },
    });

    return success("آیتم پورتفولیو با موفقیت حذف شد");
  } catch (err) {
    console.error("خطا در حذف آیتم پورتفولیو:", err);
    return error("خطا در حذف آیتم پورتفولیو");
  }
}

// ============================================================================
// Server Action: مرتب‌سازی مجدد آیتم‌ها
// ============================================================================

export async function reorderPortfolioItems(
  orderedIds: string[]
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

    // به‌روزرسانی ترتیب نمایش
    const updatePromises = orderedIds.map((id, index) =>
      db.portfolioItem.updateMany({
        where: { id, artistProfileId: profile.id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updatePromises);

    return success("ترتیب نمایش با موفقیت به‌روزرسانی شد");
  } catch (err) {
    console.error("خطا در مرتب‌سازی پورتفولیو:", err);
    return error("خطا در مرتب‌سازی پورتفولیو");
  }
}

// ============================================================================
// Server Action: لایک/آنلایک آیتم پورتفولیو
// ============================================================================

export async function toggleLike(
  portfolioItemId: string
): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // بررسی وجود آیتم
    const item = await db.portfolioItem.findUnique({
      where: { id: portfolioItemId },
      select: { id: true, likeCount: true },
    });

    if (!item) {
      return error("آیتم مورد نظر یافت نشد");
    }

    // بررسی لایک قبلی
    const existingLike = await db.savedPortfolio.findFirst({
      where: {
        userId: auth.user.id,
        portfolioItemId,
      },
    });

    if (existingLike) {
      // حذف لایک
      await db.savedPortfolio.delete({
        where: { id: existingLike.id },
      });

      await db.portfolioItem.update({
        where: { id: portfolioItemId },
        data: { likeCount: { decrement: 1 } },
      });

      return success("لایک حذف شد", {
        liked: false,
        likeCount: item.likeCount - 1,
      });
    } else {
      // افزودن لایک
      await db.savedPortfolio.create({
        data: {
          userId: auth.user.id,
          portfolioItemId,
        },
      });

      await db.portfolioItem.update({
        where: { id: portfolioItemId },
        data: { likeCount: { increment: 1 } },
      });

      return success("لایک شد", {
        liked: true,
        likeCount: item.likeCount + 1,
      });
    }
  } catch (err) {
    console.error("خطا در تغییر لایک:", err);
    return error("خطا در تغییر لایک");
  }
}
