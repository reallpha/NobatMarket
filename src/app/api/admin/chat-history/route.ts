import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/chat-history
// بدون ?conversationId: لیست همه مکالمات (مشتری ↔ هنرمند) برای مانیتورینگ
// با ?conversationId: پیام‌های یک مکالمه خاص
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  try {
    // ─── دریافت اطلاعات رزروها برای مکالمات ───
    const bookingIds = conversationId
      ? []
      : (await db.conversation.findMany({ select: { bookingId: true } }))
          .map((c) => c.bookingId)
          .filter((id): id is string => Boolean(id));
    const bookings = bookingIds.length > 0
      ? await db.booking.findMany({
          where: { id: { in: bookingIds } },
          select: { id: true, bookingNumber: true, status: true },
        })
      : [];
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    if (conversationId) {
      const messages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 500,
        include: {
          sender: {
            select: { id: true, displayName: true, avatarUrl: true, role: true },
          },
        },
      });

      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
      });

      const booking = conversation?.bookingId ? bookingMap.get(conversation.bookingId) : null;

      return NextResponse.json({
        success: true,
        conversation: conversation
          ? {
              id: conversation.id,
              title: conversation.title,
              bookingId: conversation.bookingId,
              bookingNumber: booking?.bookingNumber || null,
              bookingStatus: booking?.status || null,
              isActive: conversation.isActive,
            }
          : null,
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          attachments: m.attachments,
          messageType: m.messageType,
          isDeleted: m.isDeleted,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        })),
      });
    }

    const conversations = await db.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 200,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true, role: true },
            },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      success: true,
      conversations: conversations.map((c) => {
        const booking = c.bookingId ? bookingMap.get(c.bookingId) : null;
        return {
          id: c.id,
          title: c.title,
          isActive: c.isActive,
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
          lastMessagePreview: c.lastMessagePreview,
          unreadCount: c.unreadCount,
          messageCount: c._count.messages,
          createdAt: c.createdAt.toISOString(),
          bookingId: c.bookingId,
          bookingNumber: booking?.bookingNumber || null,
          bookingStatus: booking?.status || null,
          participants: c.participants.map((p) => ({
            id: p.user.id,
            displayName: p.user.displayName,
            avatarUrl: p.user.avatarUrl,
            role: p.user.role,
          })),
        };
      }),
    });
  } catch (err) {
    console.error("Chat history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}