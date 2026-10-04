import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { InboxView } from "@/components/features/inbox/InboxView";

export const metadata: Metadata = {
  title: "پیام‌ها و اعلان‌ها | پنل مشتری",
};

export default async function ClientInboxPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        isTicket: true,
        link: true,
        senderId: true,
        fileUrl: true,
        fileName: true,
        data: true,
        createdAt: true,
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
      },
    }),
    db.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    data: n.data ?? null,
    replies: n.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  }));

  return (
    <div className="min-h-full">
      <InboxView
        currentUserId={session.user.id}
        role="client"
        initialNotifications={serialized}
        initialUnreadCount={unreadCount}
        initialTab={searchParams?.tab === "notifications" ? "notifications" : "chat"}
      />
    </div>
  );
}
