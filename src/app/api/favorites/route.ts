export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to convert BigInt to Number recursively
function sanitizeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeBigInt);
  if (typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
}

// GET - Get all liked items (portfolio + flash) for the current user
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const isAdmin = session.user.role === "ADMIN";
  const all = searchParams.get("all");

  // Fetch portfolio likes and flash likes in parallel
  const [portfolioLikes, flashLikes] = await Promise.all([
    // If admin and all=true, get all users' likes; otherwise just current user
    db.portfolioLike.findMany({
      where: all === "true" && isAdmin ? {} : { userId },
      include: {
        portfolioItem: {
          include: {
            artistProfile: {
              select: {
                slug: true,
                artistName: true,
                user: { select: { avatarUrl: true } },
              },
            },
          },
        },
        ...(all === "true" && isAdmin
          ? { user: { select: { id: true, displayName: true, phone: true, role: true } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    db.flashLike.findMany({
      where: all === "true" && isAdmin ? {} : { userId },
      include: {
        flashTattoo: {
          include: {
            artistProfile: {
              select: {
                slug: true,
                artistName: true,
                user: { select: { avatarUrl: true } },
              },
            },
          },
        },
        ...(all === "true" && isAdmin
          ? { user: { select: { id: true, displayName: true, phone: true, role: true } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Normalize into a unified format
  const portfolioItems = portfolioLikes.map((like) => ({
    id: like.id,
    type: "portfolio" as const,
    title: like.portfolioItem.title,
    images: like.portfolioItem.images,
    style: like.portfolioItem.style,
    price: like.portfolioItem.price ? Number(like.portfolioItem.price) : null,
    artist: {
      slug: like.portfolioItem.artistProfile.slug,
      name: like.portfolioItem.artistProfile.artistName,
      avatarUrl: like.portfolioItem.artistProfile.user.avatarUrl,
      artistSlug: like.portfolioItem.artistProfile.slug,
    },
    likedAt: like.createdAt,
    ...(like.user ? { user: like.user } : {}),
  }));

  const flashItems = flashLikes.map((like) => ({
    id: like.id,
    type: "flash" as const,
    title: like.flashTattoo.title,
    images: like.flashTattoo.imageUrl ? [like.flashTattoo.imageUrl] : [],
    style: like.flashTattoo.style,
    price: Number(like.flashTattoo.price),
    artist: {
      slug: like.flashTattoo.artistProfile.slug,
      name: like.flashTattoo.artistProfile.artistName,
      avatarUrl: like.flashTattoo.artistProfile.user.avatarUrl,
      artistSlug: like.flashTattoo.artistProfile.slug,
    },
    likedAt: like.createdAt,
    ...(like.user ? { user: like.user } : {}),
  }));

  // Merge and sort by date (newest first)
  const allItems = [...portfolioItems, ...flashItems].sort(
    (a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
  );

  return NextResponse.json({ items: sanitizeBigInt(allItems) });
}

// DELETE - Remove a liked item (owner or admin)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (type === "portfolio") {
    const like = await db.portfolioLike.findUnique({ where: { id } });
    if (!like) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (like.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.portfolioLike.delete({ where: { id } });
  } else if (type === "flash") {
    const like = await db.flashLike.findUnique({ where: { id } });
    if (!like) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (like.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.flashLike.delete({ where: { id } });
  } else {
    return NextResponse.json({ error: "type must be portfolio or flash" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
