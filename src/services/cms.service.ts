"use server";

// ============================================================================
// سرویس CMS - مدیریت صفحات استاتیک
// ============================================================================

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/role-guard";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: دریافت همه صفحات CMS (ادمین)
// ============================================================================

export async function getCmsPages(): Promise<
  ApiResponse<{
    pages: {
      id: string;
      slug: string;
      title: string;
      seoTitle: string | null;
      isActive: boolean;
      updatedAt: string;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const pages = await db.cmsPage.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        seoTitle: true,
        isActive: true,
        showHeader: true,
        showFooter: true,
        updatedAt: true,
      },
    });

    return success("صفحات دریافت شد", {
      pages: pages.map((p) => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت صفحات");
  }
}

// ============================================================================
// Server Action: دریافت صفحه CMS با slug (عمومی)
// ============================================================================

export async function getCmsPageBySlug(
  slug: string
): Promise<
  ApiResponse<{
    id: string;
    slug: string;
    title: string;
    content: string;
    seoTitle: string | null;
    seoDescription: string | null;
    customHtml: string | null;
    customCss: string | null;
    customJs: string | null;
  }>
> {
  try {
    const page = await db.cmsPage.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        seoTitle: true,
        seoDescription: true,
        customHtml: true,
        customCss: true,
        customJs: true,
        showHeader: true,
        showFooter: true,
      },
    });

    if (!page) return error("صفحه یافت نشد");

    return success("صفحه دریافت شد", page);
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: ایجاد/به‌روزرسانی صفحه CMS (ادمین)
// ============================================================================

export async function upsertCmsPage(data: {
  id?: string;
  slug: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  customHtml?: string;
  customCss?: string;
  customJs?: string;
  isActive?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    // ─── نرمال‌سازی slug (فارسی به لاتین تبدیل می‌شود تا در URL کار کند) ───
    const slug = slugify(data.slug);
    if (!slug) {
      return error("شناسه URL معتبر نیست");
    }

    let page;

    if (data.id) {
      // ─── به‌روزرسانی ───
      page = await db.cmsPage.update({
        where: { id: data.id },
        data: {
          slug,
          title: data.title,
          content: data.content,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          customHtml: data.customHtml || null,
          customCss: data.customCss || null,
          customJs: data.customJs || null,
          isActive: data.isActive ?? true,
          showHeader: data.showHeader ?? true,
          showFooter: data.showFooter ?? true,
        },
        select: { id: true },
      });
    } else {
      // ─── ایجاد ───
      const existing = await db.cmsPage.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        return error("صفحه‌ای با این شناسه URL وجود دارد");
      }

      page = await db.cmsPage.create({
        data: {
          slug,
          title: data.title,
          content: data.content,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          customHtml: data.customHtml || null,
          customCss: data.customCss || null,
          customJs: data.customJs || null,
          isActive: data.isActive ?? true,
          showHeader: data.showHeader ?? true,
          showFooter: data.showFooter ?? true,
        },
        select: { id: true },
      });
    }

    return success("صفحه ذخیره شد", { id: page.id });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا در ذخیره صفحه");
  }
}

// ============================================================================
// Server Action: حذف صفحه CMS (ادمین)
// ============================================================================

export async function deleteCmsPage(pageId: string): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    await db.cmsPage.delete({ where: { id: pageId } });

    return success("صفحه حذف شد");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}
