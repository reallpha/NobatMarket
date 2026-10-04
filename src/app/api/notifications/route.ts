import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { containsContactLink } from "@/lib/utils";

const CHAT_RULES_ERROR =
  "ارسال لینک و اطلاعات تماس (اینستاگرام، تلگرام، شماره تلفن و...) ممنوع است. تمام ارتباطات باید داخل نوبت مارکت انجام شود. در صورت تکرار، حساب کاربری مسدود می‌شود.";

async function isFileUploadEnabled(): Promise<boolean> {
  const setting = await db.systemSetting.findUnique({
    where: { key: "CHAT_FILE_UPLOAD_ENABLED" },
  });
  return setting ? setting.value !== "false" : true;
}

async function areLinksAllowed(): Promise<boolean> {
  const setting = await db.systemSetting.findUnique({
    where: { key: "CHAT_LINKS_ALLOWED" },
  });
  return setting?.value === "true";
}

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ticketOnly = searchParams.get("tickets") === "true";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (ticketOnly) where.isTicket = true;

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        isTicket: true,
        link: true,
        senderId: true,
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
        fileUrl: true,
        fileName: true,
      },
    }),
    db.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return NextResponse.json({ success: true, notifications, unreadCount });
}

// POST - Send a notification (admin only) or reply to a ticket
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, title, message, type, replyToId } = body;

  // Reply to existing ticket
  if (replyToId) {
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "متن پاسخ الزامی است" }, { status: 400 });
    }

    const notification = await db.notification.findUnique({ where: { id: replyToId } });
    if (!notification) {
      return NextResponse.json({ error: "اعلان یافت نشد" }, { status: 404 });
    }

    // Only the owner or admin can reply
    if (notification.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // قوانین چت: ممنوعیت لینک/اطلاعات تماس برای غیر ادمین
    if (session.user.role !== "ADMIN" && !(await areLinksAllowed()) && containsContactLink(message)) {
      return NextResponse.json({ error: CHAT_RULES_ERROR }, { status: 400 });
    }

    // بررسی تنظیم آپلود فایل
    if ((body.fileUrl || body.fileName) && !(await isFileUploadEnabled())) {
      return NextResponse.json({ error: "ارسال فایل در پیام‌ها توسط ادمین غیرفعال شده است" }, { status: 400 });
    }

    const reply = await db.notificationReply.create({
      data: {
        notificationId: replyToId,
        senderId: session.user.id,
        message: message.trim(),
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, role: true } },
      },
    });

    // Mark as unread for the other party
    const recipientId = notification.senderId === session.user.id ? notification.userId : notification.senderId;
    if (recipientId) {
      await db.notification.update({
        where: { id: replyToId },
        data: { isRead: false },
      });
    }

    return NextResponse.json({ success: true, reply });
  }

  // Admin sends new notification to any user
  if (session.user.role === "ADMIN") {
    if (!userId || !title || !message) {
      return NextResponse.json({ error: "userId, title, and message are required" }, { status: 400 });
    }

    // بررسی تنظیم آپلود فایل
    if ((body.fileUrl || body.fileName) && !(await isFileUploadEnabled())) {
      return NextResponse.json({ error: "ارسال فایل در پیام‌ها غیرفعال شده است" }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        senderId: session.user.id,
        title: title.trim(),
        message: message.trim(),
        type: (type as never) || "MESSAGE",
        isTicket: true,
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
      },
    });

    return NextResponse.json({ success: true, notification });
  }

  // Artist/Client sends ticket to admin only
  // نکته: ریشه تیکت به خود کاربر تعلق می‌گیرد تا گفتگو از هر دو طرف دیده شود.
  if (session.user.role === "ARTIST" || session.user.role === "CLIENT") {
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "متن تیکت الزامی است" }, { status: 400 });
    }

    // قوانین چت: ممنوعیت لینک/اطلاعات تماس
    if (!(await areLinksAllowed()) && containsContactLink(message)) {
      return NextResponse.json({ error: CHAT_RULES_ERROR }, { status: 400 });
    }

    // بررسی تنظیم آپلود فایل
    if ((body.fileUrl || body.fileName) && !(await isFileUploadEnabled())) {
      return NextResponse.json({ error: "ارسال فایل در پیام‌ها توسط ادمین غیرفعال شده است" }, { status: 400 });
    }

    const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    if (!admin) {
      return NextResponse.json({ error: "ادمین یافت نشد" }, { status: 500 });
    }

    const notification = await db.notification.create({
      data: {
        userId: session.user.id,
        senderId: admin.id,
        title: "پشتیبانی نوبت مارکت",
        message: "درخواست پشتیبانی جدید — تیم نوبت مارکت در اسرع وقت پاسخ می‌دهد.",
        type: "MESSAGE",
        isTicket: true,
      },
    });

    const reply = await db.notificationReply.create({
      data: {
        notificationId: notification.id,
        senderId: session.user.id,
        message: message.trim(),
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, notification, reply });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// PATCH - Mark as read
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, markAll } = body;

  if (markAll) {
    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    await db.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "id or markAll required" }, { status: 400 });
}
