// ============================================================================
// Sitemap پویا - نوبت مارکت
// ============================================================================

import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { APP_URL } from "@/constants";

// Dynamic sitemap - queries database at runtime, not build time
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ─── صفحات ثابت ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${APP_URL}/artists`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/flash`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/inspiration`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/magazine`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/aftercare`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // ─── صفحات پروفایل هنرمندان ───
  const artists = await db.artistProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const artistPages: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${APP_URL}/artists/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ─── صفحات تتوی فلش ───
  const flashes = await db.flashTattoo.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const flashPages: MetadataRoute.Sitemap = flashes.map((f) => ({
    url: `${APP_URL}/flash/${f.id}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ─── صفحات CMS ───
  const cmsPages = await db.cmsPage.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const cmsPagesList: MetadataRoute.Sitemap = cmsPages.map((p) => ({
    url: `${APP_URL}/page/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // ─── مقالات مجله ───
  const blogPosts = await db.blogPost.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      createdAt: true,
    },
  });

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${APP_URL}/magazine/${p.slug}`,
    lastModified: p.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...artistPages, ...flashPages, ...cmsPagesList, ...blogPages];
}
