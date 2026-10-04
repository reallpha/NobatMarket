import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Toggle like/unlike a flash tattoo
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }

  const { flashTattooId } = await request.json();
  if (!flashTattooId) {
    return NextResponse.json({ error: "شناسه طرح تتو الزامی است" }, { status: 400 });
  }

  const existing = await db.flashLike.findUnique({
    where: { userId_flashTattooId: { userId: session.user.id, flashTattooId } },
  });

  if (existing) {
    await db.flashLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await db.flashLike.create({
      data: { userId: session.user.id, flashTattooId },
    });
    return NextResponse.json({ liked: true });
  }
}

// GET - Check if user liked a flash tattoo and get like count
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flashTattooId = searchParams.get("flashTattooId");

  if (!flashTattooId) {
    return NextResponse.json({ error: "شناسه طرح تتو الزامی است" }, { status: 400 });
  }

  const session = await auth();
  let isLiked = false;

  if (session?.user?.id) {
    const like = await db.flashLike.findUnique({
      where: { userId_flashTattooId: { userId: session.user.id, flashTattooId } },
    });
    isLiked = !!like;
  }

  const likeCount = await db.flashLike.count({ where: { flashTattooId } });

  return NextResponse.json({ isLiked, likeCount });
}
