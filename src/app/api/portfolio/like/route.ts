import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }

  const { portfolioItemId } = await request.json();
  if (!portfolioItemId) {
    return NextResponse.json({ error: "شناسه نمونه کار الزامی است" }, { status: 400 });
  }

  // Check if already liked
  const existing = await db.portfolioLike.findUnique({
    where: { userId_portfolioItemId: { userId: session.user.id, portfolioItemId } },
  });

  if (existing) {
    // Unlike
    await db.portfolioLike.delete({ where: { id: existing.id } });
    await db.portfolioItem.update({
      where: { id: portfolioItemId },
      data: { likeCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.portfolioLike.create({
      data: { userId: session.user.id, portfolioItemId },
    });
    await db.portfolioItem.update({
      where: { id: portfolioItemId },
      data: { likeCount: { increment: 1 } },
    });
    return NextResponse.json({ liked: true });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const portfolioItemId = searchParams.get("portfolioItemId");

  if (!portfolioItemId) {
    return NextResponse.json({ error: "شناسه نمونه کار الزامی است" }, { status: 400 });
  }

  let isLiked = false;
  if (session?.user?.id) {
    const like = await db.portfolioLike.findUnique({
      where: { userId_portfolioItemId: { userId: session.user.id, portfolioItemId } },
    });
    isLiked = !!like;
  }

  const item = await db.portfolioItem.findUnique({
    where: { id: portfolioItemId },
    select: { likeCount: true },
  });

  return NextResponse.json({ isLiked, likeCount: Number(item?.likeCount || 0) });
}
