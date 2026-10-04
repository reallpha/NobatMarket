import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TATTOO_STYLE_LABELS, resolveSampleImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LOCAL_CATEGORY_IMAGES: Record<string, string> = {
  BLACKWORK: "/image/categories/BLACKWORK.webp",
  REALISM: "/image/categories/REALISM.webp",
  DOTWORK: "/image/categories/DOTWORK.webp",
  WATERCOLOR: "/image/categories/WATERCOLOR.webp",
  GEOMETRIC: "/image/categories/GEOMETRIC.webp",
  MINIMAL: "/image/categories/MINIMAL.webp",
  BLACK_AND_GREY: "/image/categories/BLACK AND GREY.webp",
  COLOR: "/image/categories/COLOR.webp",
  LINE_ART: "/image/categories/LINE ART.webp",
  FINE_LINE: "/image/categories/FINE LINE.webp",
  NEO_TRADITIONAL: "/image/categories/NEO TRADITIONAL.webp",
  ABSTRACT: "/image/categories/ABSTRACT.webp",
  OLD_SCHOOL: "/image/categories/OLD SCHOOL.webp",
  JAPANESE: "/image/categories/JAPANESE.webp",
  TRIBAL: "/image/categories/TRIBAL.webp",
};

export async function GET() {
  try {
    // ── دسته‌بندی‌ها: شمارش آثار منتشرشده به تفکیک سبک ──
    const styleGroups = await db.portfolioItem.groupBy({
      by: ["style"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
      orderBy: { _count: { style: "desc" } },
    });

    // تصویر نماینده هر سبک = محبوب‌ترین اثر منتشرشدهٔ آن سبک
    const popularItems = await db.portfolioItem.findMany({
      where: {
        status: "PUBLISHED",
        images: { isEmpty: false },
      },
      orderBy: [{ likeCount: "desc" }, { saveCount: "desc" }],
      select: { style: true, images: true },
      take: 400,
    });

    const imageByStyle = new Map<string, string>();
    for (const p of popularItems) {
      if (!imageByStyle.has(p.style) && p.images.length > 0) {
        imageByStyle.set(p.style, p.images[0]);
      }
    }

    const categories = styleGroups
      .filter((g) => g._count._all > 0)
      .map((g) => ({
        style: g.style,
        label: TATTOO_STYLE_LABELS[g.style] || g.style,
        count: g._count._all,
        // ترجیح تصاویر محلی └── investigación
        image: LOCAL_CATEGORY_IMAGES[g.style] || imageByStyle.get(g.style) || null,
      }));

    // ── آخرین نمونه‌کارها (جدیدترین تتوهای انجام‌شده) ──
    const latestItems = await db.portfolioItem.findMany({
      where: {
        status: "PUBLISHED",
        images: { isEmpty: false },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        images: true,
        style: true,
        likeCount: true,
        saveCount: true,
        createdAt: true,
        artistProfile: {
          select: {
            slug: true,
            artistName: true,
            isVerified: true,
            user: {
              select: { avatarUrl: true },
            },
          },
        },
      },
    });

    const latestWorks = latestItems.map((item) => ({
      id: item.id,
      title: item.title,
      image: resolveSampleImage(item.artistProfile.slug, item.style, item.title) || item.images[0],
      style: item.style,
      styleLabel: TATTOO_STYLE_LABELS[item.style] || item.style,
      likeCount: item.likeCount,
      saveCount: item.saveCount,
      createdAt: item.createdAt,
      artist: {
        slug: item.artistProfile.slug,
        artistName: item.artistProfile.artistName,
        isVerified: item.artistProfile.isVerified,
        avatarUrl: item.artistProfile.user.avatarUrl,
      },
    }));

    return NextResponse.json({ categories, latestWorks });
  } catch (error) {
    console.error("[api/home/explore]", error);
    return NextResponse.json({ categories: [], latestWorks: [] }, { status: 200 });
  }
}
