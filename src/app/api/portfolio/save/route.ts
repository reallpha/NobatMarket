export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to convert BigInt values in objects to Number
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

// POST - Toggle save/unsave a portfolio item
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }

  const { portfolioItemId } = await request.json();
  if (!portfolioItemId) {
    return NextResponse.json({ error: "شناسه نمونه کار الزامی است" }, { status: 400 });
  }

  const existing = await db.savedPortfolio.findUnique({
    where: { userId_portfolioItemId: { userId: session.user.id, portfolioItemId } },
  });

  if (existing) {
    await db.savedPortfolio.delete({ where: { id: existing.id } });
    await db.portfolioItem.update({
      where: { id: portfolioItemId },
      data: { saveCount: { decrement: 1 } },
    });
    return NextResponse.json({ saved: false });
  } else {
    await db.savedPortfolio.create({
      data: { userId: session.user.id, portfolioItemId },
    });
    await db.portfolioItem.update({
      where: { id: portfolioItemId },
      data: { saveCount: { increment: 1 } },
    });
    return NextResponse.json({ saved: true });
  }
}

// GET - Check save status or get saved items
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portfolioItemId = searchParams.get("portfolioItemId");
  const all = searchParams.get("all");

  const session = await auth();

  // Check if a specific item is saved by the current user
  if (portfolioItemId) {
    let isSaved = false;
    let saveCount = 0;
    const item = await db.portfolioItem.findUnique({ where: { id: portfolioItemId }, select: { saveCount: true } });
    saveCount = Number(item?.saveCount || 0);
    if (session?.user?.id) {
      const existing = await db.savedPortfolio.findUnique({
        where: { userId_portfolioItemId: { userId: session.user.id, portfolioItemId } },
      });
      isSaved = !!existing;
    }
    return NextResponse.json({ isSaved, saveCount });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const isAdmin = session.user.role === "ADMIN";

  // Admin can see all saved items
  if (all === "true" && isAdmin) {
    const saved = await db.savedPortfolio.findMany({
      include: {
        portfolioItem: {
          include: {
            artistProfile: {
              select: { slug: true, artistName: true, user: { select: { avatarUrl: true } } },
            },
          },
        },
        user: { select: { id: true, displayName: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: sanitizeBigInt(saved) });
  }

  const saved = await db.savedPortfolio.findMany({
    where: { userId: session.user.id },
    include: {
      portfolioItem: {
        include: {
          artistProfile: {
            select: { slug: true, artistName: true, user: { select: { avatarUrl: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: sanitizeBigInt(saved.map((s) => s.portfolioItem)) });
}
