import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================================
// شمارش سبک پیام‌ها و اعلان‌های خوانده‌نشده (برای نشان منوی کناری)
// این مسیر فقط دو عدد برمی‌گرداند تا برای polling دوره‌ای سبک باشد.
// ============================================================================

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notifications, participations] = await Promise.all([
      db.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      db.conversationParticipant.findMany({
        where: { userId: session.user.id, isArchived: false },
        select: { unreadCount: true },
      }),
    ]);

    // همان منطقی که در InboxView برای شمارش پیام‌های چت استفاده می‌شود
    const chat = participations.reduce((sum, p) => sum + (p.unreadCount || 0), 0);

    return NextResponse.json({
      success: true,
      chat,
      notifications,
      total: chat + notifications,
    });
  } catch (err) {
    console.error("خطا در شمارش خوانده‌نشده‌ها:", err);
    return NextResponse.json({ error: "خطا در دریافت شمارش" }, { status: 500 });
  }
}
