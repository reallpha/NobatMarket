// ============================================================================
// سرویس گالری الهام‌بخشی - نوبت مارکت
// ============================================================================

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { resolveSampleImage } from "@/lib/utils";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface InspirationFilters {
  style?: string;
  page?: number;
  pageSize?: number;
}

export type InspirationItem = {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  style: string;
  size: string | null;
  likeCount: number;
  saveCount: number;
  tags: string[];
  createdAt: Date;
  artistProfile: {
    artistName: string;
    slug: string;
    isVerified: boolean;
    user: {
      displayName: string;
      avatarUrl: string | null;
    };
  };
};

// ============================================================================
// تابع اصلی دریافت آیتم‌های الهام‌بخشی
// ============================================================================

/**
 * دریافت بهترین آیتم‌های پورتفولیو از تمام هنرمندان
 *
 * بهینه‌سازی‌ها:
 * - فقط آیتم‌های PUBLISHED
 * - فقط تصویر اول برای نمایش
 * - select-only queries
 * - مرتب‌سازی بر اساس لایک و ذخیره
 */
export async function getInspirationItems(
  filters: InspirationFilters
): Promise<PaginatedResponse<InspirationItem>> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize || 24));
  const skip = (page - 1) * pageSize;

  // ساخت شرایط فیلتر
  const where: Prisma.PortfolioItemWhereInput = {
    status: "PUBLISHED",
  };

  if (filters.style) {
    where.style = filters.style as any;
  }

  // اجرای کوئری
  const [items, totalItems] = await Promise.all([
    db.portfolioItem.findMany({
      where,
      orderBy: [
        { likeCount: "desc" },
        { saveCount: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        style: true,
        size: true,
        likeCount: true,
        saveCount: true,
        tags: true,
        createdAt: true,
        artistProfile: {
          select: {
            artistName: true,
            slug: true,
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
    db.portfolioItem.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const mappedItems: InspirationItem[] = items.map((item) => ({
    ...item,
    images: item.images.map((img, i) =>
      i === 0
        ? resolveSampleImage(
            item.artistProfile.slug,
            item.style,
            item.title
          ) || item.images[0]
        : img
    ),
  }));

  return {
    items: mappedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================================================
// دریافت سبک‌های موجود
// ============================================================================

/**
 * دریافت لیست سبک‌هایی که حداقل یک آیتم پورتفولیو دارند
 */
export async function getAvailableStyles(): Promise<
  { style: string; count: number }[]
> {
  const results = await db.portfolioItem.groupBy({
    by: ["style"],
    where: { status: "PUBLISHED" },
    _count: { style: true },
    orderBy: { _count: { style: "desc" } },
  });

  return results.map((r) => ({
    style: r.style,
    count: r._count.style,
  }));
}
