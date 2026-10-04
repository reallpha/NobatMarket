import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TATTOO_STYLE_LABELS, resolveSampleImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ============================================================================
// محبوب‌ترین هنرمندان — فقط دیتای واقعی پلتفرم
// معیار: تأییدشده + فعال، نمونه‌کار منتشرشده، سابقه رزرو، امتیاز، محبوبیت
// ============================================================================

export async function GET() {
  try {
    const artists = await db.artistProfile.findMany({
      where: {
        isVerified: true,
        isAcceptingBookings: true,
        user: { role: "ARTIST", status: "ACTIVE" },
        portfolioItems: { some: { status: "PUBLISHED" } },
      },
      orderBy: [
        { completedBookings: "desc" },
        { satisfactionScore: "desc" },
        { followerCount: "desc" },
      ],
      take: 6,
      select: {
        slug: true,
        artistName: true,
        city: true,
        isVerified: true,
        specializations: true,
        completedBookings: true,
        followerCount: true,
        satisfactionScore: true,
        minPrice: true,
        isAcceptingBookings: true,
        user: {
          select: { displayName: true, avatarUrl: true, averageRating: true, reviewCount: true, city: true },
        },
        portfolioItems: {
          where: { status: "PUBLISHED" },
          orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: { images: true, style: true, title: true },
        },
        _count: { select: { portfolioItems: { where: { status: "PUBLISHED" } } } },
      },
    });

    const mapped = artists.map((a) => ({
      slug: a.slug,
      name: a.artistName,
      city: a.city || a.user.city || "نامشخص",
      verified: a.isVerified,
      styles: (a.specializations || []).slice(0, 3).map((s) => TATTOO_STYLE_LABELS[s] || s),
      rating: a.user.averageRating || 0,
      reviews: a.user.reviewCount || 0,
      satisfaction: a.satisfactionScore || 0,
      bookings: a.completedBookings,
      followers: a.followerCount,
      works: a._count.portfolioItems,
      priceFrom: a.minPrice ? Number(a.minPrice) : null,
      accepting: a.isAcceptingBookings,
      avatar: a.user.avatarUrl,
      works_images: a.portfolioItems.map((p) =>
        p.images.length > 0
          ? resolveSampleImage(a.slug, p.style, p.title) || p.images[0]
          : null
      ).filter(Boolean) as string[],
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
