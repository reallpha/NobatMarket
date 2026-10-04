import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Toggle like/dislike
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, type } = body; // type: "LIKE" or "DISLIKE"

    if (!commentId || !type) {
      return NextResponse.json({ error: "commentId and type required" }, { status: 400 });
    }

    if (type !== "LIKE" && type !== "DISLIKE") {
      return NextResponse.json({ error: "type must be LIKE or DISLIKE" }, { status: 400 });
    }

    // Check existing reaction
    const existing = await db.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: session.user.id } },
    });

    if (existing) {
      if (existing.type === type) {
        // Remove reaction (toggle off)
        await db.commentReaction.delete({ where: { id: existing.id } });
        const field = type === "LIKE" ? "likeCount" : "dislikeCount";
        await db.blogComment.update({ where: { id: commentId }, data: { [field]: { decrement: 1 } } });
        return NextResponse.json({ action: "removed", type });
      } else {
        // Switch reaction type
        await db.commentReaction.update({ where: { id: existing.id }, data: { type } });
        const oldField = existing.type === "LIKE" ? "likeCount" : "dislikeCount";
        const newField = type === "LIKE" ? "likeCount" : "dislikeCount";
        await db.blogComment.update({
          where: { id: commentId },
          data: { [oldField]: { decrement: 1 }, [newField]: { increment: 1 } },
        });
        return NextResponse.json({ action: "switched", type });
      }
    } else {
      // Create new reaction
      await db.commentReaction.create({
        data: { commentId, userId: session.user.id, type },
      });
      const field = type === "LIKE" ? "likeCount" : "dislikeCount";
      await db.blogComment.update({ where: { id: commentId }, data: { [field]: { increment: 1 } } });
      return NextResponse.json({ action: "added", type });
    }
  } catch (error) {
    console.error("Comment reaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
