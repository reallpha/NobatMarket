import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Admin sees all notifications
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      isTicket: true,
      senderId: true,
      data: true,
      createdAt: true,
      user: {
        select: { id: true, displayName: true, email: true, role: true },
      },
      sender: {
        select: { id: true, displayName: true, avatarUrl: true, role: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          message: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
          sender: {
            select: { id: true, displayName: true, avatarUrl: true, role: true },
          },
        },
      },
      fileUrl: true,
      fileName: true,
    },
  });

  return NextResponse.json({ success: true, notifications });
}
