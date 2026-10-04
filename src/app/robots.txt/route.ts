// ============================================================================
// Robots.txt داینامیک — نوبت مارکت
// ----------------------------------------------------------------------------
// چرا route handler و نه app/robots.ts؟
// تنظیم «CUSTOM_ROBOTS_TXT» در پنل ادمین متن خام robots.txt است. خروجی
// MetadataRoute.Robots ساختاری است و متن خام را پشتیبانی نمی‌کند، پس برای
// اینکه آن تنظیم واقعاً اثر داشته باشد، فایل را مستقیم سرو می‌کنیم.
// اگر ادمین متنی وارد کرده باشد همان برگردانده می‌شود؛ در غیر این صورت
// قوانین پیش‌فرض ساخته می‌شود.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/server-settings";

export const dynamic = "force-dynamic";

const DISALLOW = [
  "/dashboard/",
  "/admin/",
  "/api/",
  "/bookings/",
  "/messages/",
  "/notifications/",
  "/saved/",
  "/onboarding/",
];

function defaultRobots(sitemapUrl: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    ...DISALLOW.map((p) => `Disallow: ${p}`),
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const custom = await getSetting("CUSTOM_ROBOTS_TXT", "");
    if (custom.trim()) {
      return new NextResponse(custom, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {
    // در صورت خطا، قوانین پیش‌فرض برگردانده می‌شود
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base =
    process.env.APP_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://nobat-market.com");

  return new NextResponse(defaultRobots(`${base}/sitemap.xml`), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
