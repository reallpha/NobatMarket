import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// این مسیر هر بار باید از دیتابیس خوانده شود (تنظیمات انتخاب هنرمندان و تعداد)
export const dynamic = "force-dynamic";


// ============================================================================
// هنرمندان برتر هفته (بخش صفحه اصلی)
// - اگر ادمین هنرمندان منتخب را در تنظیمات تعیین کرده باشد، همان‌ها به ترتیب نمایش داده می‌شوند
// - در غیر این صورت به‌صورت خودکار بهترین هنرمندان (تأییدشده + فعال) انتخاب می‌شوند
// - تعداد آیتم‌ها از HOME_FEATURED_COUNT خوانده می‌شود (پیش‌فرض ۱۰)
// ============================================================================

const SELECT = {
  id: true,
  artistName: true,
  slug: true,
  city: true,
  isVerified: true,
  specializations: true,
  completedBookings: true,
  followerCount: true,
  minPrice: true,
  user: {
    select: {
      displayName: true,
      avatarUrl: true,
      averageRating: true,
      reviewCount: true,
    },
  },
  portfolioItems: {
    take: 1,
    select: { images: true },
    orderBy: { createdAt: "desc" },
  },
} as const;

type FeaturedRow = {
  artistName: string;
  slug: string;
  city: string | null;
  isVerified: boolean;
  specializations: string[];
  completedBookings: number;
  followerCount: number;
  minPrice: bigint | null;
  user: {
    displayName: string;
    avatarUrl: string | null;
    averageRating: number | null;
    reviewCount: number;
  };
  portfolioItems: { images: string[] }[];
};

function mapArtist(a: FeaturedRow) {
  return {
    name: a.artistName,
    slug: a.slug,
    city: a.city || "نامشخص",
    styles: (a.specializations || []).slice(0, 2),
    rating: a.user.averageRating || 4.5,
    reviews: a.user.reviewCount || 0,
    price: a.minPrice ? `${(Number(a.minPrice) / 1000000).toFixed(1)}م` : "تماس بگیرید",
    avatar: a.user.avatarUrl || null,
    cover: a.portfolioItems[0]?.images?.[0] || null,
    verified: a.isVerified,
    bookings: a.completedBookings,
    followers: a.followerCount,
  };
}

export async function GET() {
  try {
    // ── خواندن تنظیمات صفحه اصلی ──
    const settings = await db.systemSetting.findMany({
      where: { key: { in: ["HOME_FEATURED_ARTISTS", "HOME_FEATURED_COUNT"] } },
    });
    const settingMap = new Map(settings.map((s) => [s.key, s.value]));

    let count = parseInt(settingMap.get("HOME_FEATURED_COUNT") || "10", 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.min(30, Math.max(1, count));

    let curatedSlugs: string[] = [];
    try {
      const parsed = JSON.parse(settingMap.get("HOME_FEATURED_ARTISTS") || "[]");
      curatedSlugs = Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === "string" && s.length > 0)
        : [];
    } catch {
      curatedSlugs = [];
    }

    // ── حالت انتخابی (ادمین هنرمندانی را تعیین کرده است) ──
    if (curatedSlugs.length > 0) {
      const limited = curatedSlugs.slice(0, count);
      const rows = (await db.artistProfile.findMany({
        where: {
          slug: { in: limited },
          user: { role: "ARTIST", status: "ACTIVE" },
        },
        select: SELECT,
      })) as unknown as FeaturedRow[];

      const rowMap = new Map(rows.map((r) => [r.slug, r]));
      const ordered = limited
        .map((slug) => rowMap.get(slug))
        .filter((r): r is FeaturedRow => Boolean(r))
        .map(mapArtist);

      return NextResponse.json(ordered);
    }

    // ── حالت خودکار: بهترین هنرمندان تأییدشده ──
    const artists = (await db.artistProfile.findMany({
      where: {
        isVerified: true,
        user: { role: "ARTIST", status: "ACTIVE" },
      },
      orderBy: { completedBookings: "desc" },
      take: count,
      select: SELECT,
    })) as unknown as FeaturedRow[];

    return NextResponse.json(artists.map(mapArtist));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
