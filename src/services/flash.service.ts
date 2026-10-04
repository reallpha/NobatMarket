"use server";

// ============================================================================
// سرویس مدیریت تتوهای فلش - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireRole } from "@/lib/role-guard";
import { deleteUploadedFiles } from "@/lib/upload";
import type { ApiResponse } from "@/types";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface CreateFlashInput {
  title: string;
  description?: string;
  imageUrl: string;
  alternativeImageUrl?: string;
  style: string;
  suggestedSize: string;
  price: number;
  isExclusive?: boolean;
  tags?: string[];
  colors?: string[];
}

interface FlashFilters {
  style?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  page?: number;
  pageSize?: number;
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

// ============================================================================
// Server Action: دریافت تتوهای فلش هنرمند
// ============================================================================

export async function getMyFlashTattoos(): Promise<
  ApiResponse<{
    items: {
      id: string;
      title: string;
      description: string | null;
      imageUrl: string;
      alternativeImageUrl: string | null;
      style: string;
      suggestedSize: string;
      price: bigint;
      isAvailable: boolean;
      status: string;
      isExclusive: boolean;
      soldCount: number;
      viewCount: number;
      tags: string[];
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

    const items = await db.flashTattoo.findMany({
      where: { artistProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        alternativeImageUrl: true,
        style: true,
        suggestedSize: true,
        price: true,
        isAvailable: true,
        status: true,
        isExclusive: true,
        soldCount: true,
        viewCount: true,
        tags: true,
        createdAt: true,
      },
    });

    return success("تتوهای فلش دریافت شد", { items });
  } catch (err) {
    console.error("خطا در دریافت تتوهای فلش:", err);
    return error("خطا در دریافت تتوهای فلش");
  }
}

// ============================================================================
// Server Action: ایجاد تتوی فلش
// ============================================================================

export async function createFlashTattoo(
  input: CreateFlashInput
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

    // ─── بررسی سهمیه ───
    const { checkQuota } = await import("@/services/quota.service");
    const quota = await checkQuota(profile.id, "flash");
    if (quota.success && quota.data && !quota.data.allowed) {
      return error(
        `شما به سقف مجاز تتوی فلش (${quota.data.max} طرح) در پلن ${quota.data.plan === "FREE" ? "رایگان" : "حرفه‌ای"} رسیده‌اید. ` +
        `برای ارتقا، با پشتیبانی تماس بگیرید.`
      );
    }

    if (!input.title || input.title.length < 2) {
      return error("عنوان باید حداقل ۲ کاراکتر باشد");
    }
    if (!input.imageUrl) {
      return error("تصویر الزامی است");
    }
    if (!input.style) {
      return error("سبک تتو الزامی است");
    }
    if (!input.suggestedSize) {
      return error("اندازه پیشنهادی الزامی است");
    }
    if (!input.price || input.price <= 0) {
      return error("قیمت باید بزرگتر از صفر باشد");
    }

    const flash = await db.flashTattoo.create({
      data: {
        artistProfileId: profile.id,
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl,
        alternativeImageUrl: input.alternativeImageUrl || null,
        style: input.style as any,
        suggestedSize: input.suggestedSize as any,
        price: BigInt(input.price),
        isAvailable: true,
        // طرح جدید ابتدا در انتظار تأیید ادمین است
        status: "PENDING",
        isExclusive: input.isExclusive || false,
        tags: input.tags || [],
        colors: input.colors || [],
      },
      select: { id: true },
    });

    return success(
      "تتوی فلش ثبت شد و پس از تأیید مدیریت در بخش تتوهای فلش نمایش داده می‌شود",
      { id: flash.id }
    );
  } catch (err) {
    console.error("خطا در ایجاد تتوی فلش:", err);
    return error("خطا در ایجاد تتوی فلش");
  }
}

// ============================================================================
// Server Action: به‌روزرسانی وضعیت تتوی فلش
// ============================================================================

export async function updateFlashStatus(
  id: string,
  isAvailable: boolean
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

    const existing = await db.flashTattoo.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true },
    });

    if (!existing) {
      return error("تتوی مورد نظر یافت نشد یا دسترسی ندارید");
    }

    await db.flashTattoo.update({
      where: { id },
      data: { isAvailable },
    });

    return success(
      isAvailable
        ? "تتو به وضعیت موجود تغییر کرد"
        : "تتو به وضعیت فروخته شده تغییر کرد"
    );
  } catch (err) {
    console.error("خطا در به‌روزرسانی وضعیت:", err);
    return error("خطا در به‌روزرسانی وضعیت");
  }
}

// ============================================================================
// Server Action: حذف تتوی فلش
// ============================================================================

export async function deleteFlashTattoo(
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

    const existing = await db.flashTattoo.findFirst({
      where: { id, artistProfileId: profile.id },
      select: { id: true, imageUrl: true, alternativeImageUrl: true },
    });

    if (!existing) {
      return error("تتوی مورد نظر یافت نشد یا دسترسی ندارید");
    }

    // حذف تصاویر
    const urlsToDelete = [existing.imageUrl];
    if (existing.alternativeImageUrl) {
      urlsToDelete.push(existing.alternativeImageUrl);
    }
    await deleteUploadedFiles(urlsToDelete);

    // حذف رکورد
    await db.flashTattoo.delete({ where: { id } });

    return success("تتوی فلش با موفقیت حذف شد");
  } catch (err) {
    console.error("خطا در حذف تتوی فلش:", err);
    return error("خطا در حذف تتوی فلش");
  }
}

// ============================================================================
// Server Action: دریافت تتوهای فلش عمومی (صفحه /flash)
// ============================================================================

export async function getAvailableFlashes(
  filters: FlashFilters
): Promise<PaginatedResponse<any>> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize || 20));
  const skip = (page - 1) * pageSize;

  // ساخت شرایط فیلتر
  const where: any = {
    isAvailable: true,
    // فقط طرح‌های تأییدشده توسط ادمین نمایش داده می‌شوند
    status: "APPROVED",
  };

  if (filters.style) {
    where.style = filters.style;
  }

  if (filters.minPrice !== undefined) {
    where.price = {
      ...(where.price || {}),
      gte: BigInt(Math.round(filters.minPrice)),
    };
  }

  if (filters.maxPrice !== undefined) {
    where.price = {
      ...(where.price || {}),
      lte: BigInt(Math.round(filters.maxPrice)),
    };
  }

  if (filters.city) {
    where.artistProfile = {
      OR: [
        { city: { contains: filters.city, mode: "insensitive" } },
        { user: { city: { contains: filters.city, mode: "insensitive" } } },
      ],
    };
  }

  // اجرای کوئری
  const [items, totalItems] = await Promise.all([
    db.flashTattoo.findMany({
      where,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        style: true,
        suggestedSize: true,
        price: true,
        isExclusive: true,
        soldCount: true,
        viewCount: true,
        tags: true,
        createdAt: true,
        artistProfile: {
          select: {
            artistName: true,
            slug: true,
            city: true,
            isVerified: true,
            user: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }),
    db.flashTattoo.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Convert BigInt fields to Number for JSON serialization
  const safeItems = items.map((item) => ({
    ...item,
    price: Number(item.price),
  }));

  return {
    items: safeItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
