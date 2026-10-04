"use server";

// ============================================================================
// سرویس مجله / وبلاگ - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/role-guard";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: دریافت مقالات منتشر شده (عمومی)
// ============================================================================

export async function getPublishedPosts(
  page: number = 1,
  limit: number = 12,
  category?: string
): Promise<
  ApiResponse<{
    posts: {
      id: string;
      slug: string;
      title: string;
      excerpt: string;
      coverImage: string | null;
      category: string;
      views: number;
      createdAt: string;
      readingTime: number;
      author: { displayName: string };
    }[];
    total: number;
  }>
> {
  try {
    const where: any = { isPublished: true };
    if (category) where.category = category;

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          category: true,
          views: true,
          createdAt: true,
          content: true,
          author: {
            select: { displayName: true },
          },
        },
      }),
      db.blogPost.count({ where }),
    ]);

    return success("مقالات دریافت شد", {
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        category: p.category,
        views: p.views,
        createdAt: p.createdAt.toISOString(),
        readingTime: Math.max(1, Math.ceil(p.content.split(/\s+/).length / 200)),
        author: p.author,
      })),
      total,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت مقالات");
  }
}

// ============================================================================
// Server Action: دریافت یک مقاله با slug (عمومی)
// ============================================================================

export async function getPostBySlug(
  slug: string
): Promise<
  ApiResponse<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    category: string;
    views: number;
    createdAt: string;
    readingTime: number;
    author: { displayName: string };
  }>
> {
  try {
    const post = await db.blogPost.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        category: true,
        views: true,
        createdAt: true,
        author: {
          select: { displayName: true },
        },
      },
    });

    if (!post) return error("مقاله یافت نشد");

    // ─── افزایش تعداد بازدید ───
    await db.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return success("مقاله دریافت شد", {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      category: post.category,
      views: post.views + 1,
      createdAt: post.createdAt.toISOString(),
      readingTime: Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)),
      author: post.author,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: دریافت همه مقالات (ادمین)
// ============================================================================

export async function getAllPosts(): Promise<
  ApiResponse<{
    posts: {
      id: string;
      slug: string;
      title: string;
      category: string;
      isPublished: boolean;
      views: number;
      createdAt: string;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        isPublished: true,
        views: true,
        createdAt: true,
      },
    });

    return success("مقالات دریافت شد", {
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: ایجاد/ویرایش مقاله (ادمین)
// ============================================================================

export async function upsertPost(data: {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isNotice?: boolean;
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    // نرمال‌سازی slug (فارسی به لاتین تبدیل می‌شود تا URL به درستی کار کند)
    const slug = slugify(data.slug) || `article-${Date.now()}`;

    // جلوگیری از تکراری بودن slug
    const existing = await db.blogPost.findFirst({
      where: { slug, ...(data.id ? { id: { not: data.id } } : {}) },
      select: { id: true },
    });
    if (existing) {
      return error("مقاله‌ای با این شناسه URL وجود دارد");
    }

    let post;

    if (data.id) {
      post = await db.blogPost.update({
        where: { id: data.id },
        data: {
          slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage || null,
          category: data.category as any,
          isPublished: data.isPublished ?? false,
          isFeatured: data.isFeatured ?? false,
          isNotice: data.isNotice ?? false,
        },
        select: { id: true },
      });
    } else {
      post = await db.blogPost.create({
        data: {
          slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage || null,
          authorId: auth.user.id,
          category: data.category as any,
          isPublished: data.isPublished ?? false,
          isFeatured: data.isFeatured ?? false,
          isNotice: data.isNotice ?? false,
        },
        select: { id: true },
      });
    }

    return success("مقاله ذخیره شد", { id: post.id });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: حذف مقاله (ادمین)
// ============================================================================

export async function deletePost(postId: string): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    await db.blogPost.delete({ where: { id: postId } });

    return success("مقاله حذف شد");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}
