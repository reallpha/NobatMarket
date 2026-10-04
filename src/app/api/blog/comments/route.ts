import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - List comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postSlug = searchParams.get("postSlug");
    const all = searchParams.get("all");

    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    // Admin can fetch all comments without postSlug filter
    if (all === "true" && isAdmin) {
      const comments = await db.blogComment.findMany({
        where: { parentId: null },
        include: {
          user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
          replies: {
            include: {
              user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ comments });
    }

    if (!postSlug) {
      return NextResponse.json({ error: "postSlug required" }, { status: 400 });
    }

    const where: any = { postSlug, parentId: null };
    if (!isAdmin) {
      where.isApproved = true;
    }

    const comments = await db.blogComment.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        replies: {
          where: isAdmin ? {} : { isApproved: true },
          include: {
            user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Blog comments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a comment or reply
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postSlug, content, parentId } = body;

    if (!postSlug || !content?.trim()) {
      return NextResponse.json({ error: "postSlug and content required" }, { status: 400 });
    }

    // Check for blocked words (basic spam filter)
    const blockedWords = ["http://", "https://", "www.", "טלגרם", "اینستاگرام", "@", "شماره"];
    const hasBlockedWord = blockedWords.some(w => content.toLowerCase().includes(w));
    
    // Admin comments are auto-approved
    const isApproved = session.user.role === "ADMIN";

    const comment = await db.blogComment.create({
      data: {
        postSlug,
        userId: session.user.id,
        content: content.trim().slice(0, 2000),
        parentId: parentId || null,
        isApproved,
      },
      include: {
        user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
    });

    return NextResponse.json({ 
      comment, 
      message: isApproved ? "کامنت ثبت شد" : "کامنت شما پس از تأیید ادمین نمایش داده می‌شود",
      needsApproval: !isApproved,
    });
  } catch (error) {
    console.error("Blog comments POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Approve/delete comment (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { commentId, isApproved } = body;

    if (!commentId) {
      return NextResponse.json({ error: "commentId required" }, { status: 400 });
    }

    const comment = await db.blogComment.update({
      where: { id: commentId },
      data: { isApproved },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Blog comments PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete comment (admin or owner)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    if (!commentId) {
      return NextResponse.json({ error: "commentId required" }, { status: 400 });
    }

    const comment = await db.blogComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.blogComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog comments DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
