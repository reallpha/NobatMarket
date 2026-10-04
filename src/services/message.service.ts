"use server";

// ============================================================================
// سرویس پیام‌رسانی (چت) - Server Actions
// ============================================================================
//
// ⚠️ قاعده امنیتی: کاربران فقط می‌توانند در مکالماتی شرکت کنند که
//    به رزرو یا درخواست سفارشی مرتبط با آنها متصل هستند.
//
// ⚠️ @todo Stage 8: جایگزینی Polling با WebSocket (Socket.io/Pusher)
//    برای MVP از Polling با React Query استفاده می‌شود.
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/role-guard";
import { triggerNotification } from "@/lib/notifications";
import { containsContactLink } from "@/lib/utils";
import type { ApiResponse } from "@/types";

// قوانین چت نوبت مارکت: ارسال لینک و اطلاعات تماس خارجی ممنوع است
const CHAT_RULES_ERROR =
  "ارسال لینک و اطلاعات تماس (اینستاگرام، تلگرام، شماره تلفن و...) در چت ممنوع است. تمام هماهنگی‌ها باید داخل نوبت مارکت انجام شود. در صورت تکرار، حساب کاربری مسدود می‌شود.";

// ============================================================================
// توابع کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: دریافت لیست مکالمات
// ============================================================================

export async function getConversations(): Promise<
  ApiResponse<{
    conversations: {
      id: string;
      title: string | null;
      lastMessageAt: string | null;
      lastMessagePreview: string | null;
      unreadCount: number;
      otherUser: { id: string; displayName: string; avatarUrl: string | null };
      bookingId: string | null;
      requestId: string | null;
    }[];
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const participations = await db.conversationParticipant.findMany({
      where: { userId: auth.user.id, isArchived: false },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: "desc" } },
    });

    const conversations = participations
      .map((p) => {
        const other = p.conversation.participants.find(
          (pp) => pp.userId !== auth.user.id
        );
        if (!other) return null;

        return {
          id: p.conversation.id,
          title: p.conversation.title,
          lastMessageAt: p.conversation.lastMessageAt?.toISOString() ?? null,
          lastMessagePreview: p.conversation.lastMessagePreview,
          unreadCount: p.unreadCount,
          otherUser: other.user,
          bookingId: p.conversation.bookingId,
          requestId: p.conversation.requestId,
        };
      })
      .filter(Boolean) as any[];

    return success("مکالمات دریافت شد", { conversations });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت مکالمات");
  }
}

// ============================================================================
// Server Action: دریافت پیام‌های یک مکالمه (صفحه‌بندی با Cursor)
// ============================================================================

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit: number = 50
): Promise<
  ApiResponse<{
    messages: {
      id: string;
      content: string;
      attachments: string[];
      messageType: string;
      isDeleted: boolean;
      createdAt: string;
      sender: { id: string; displayName: string; avatarUrl: string | null };
    }[];
    nextCursor: string | null;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── بررسی دسترسی ───
    const participation = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.user.id,
        },
      },
    });

    if (!participation) {
      return error("دسترسی به این مکالمه ندارید");
    }

    // ─── دریافت پیام‌ها ───
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // یکی بیشتر برای تشخیص صفحه بعدی
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? resultMessages[resultMessages.length - 1]?.id || null : null;

    return success("پیام‌ها دریافت شد", {
      messages: resultMessages.map((m) => ({
        id: m.id,
        content: m.content,
        attachments: m.attachments,
        messageType: m.messageType,
        isDeleted: m.isDeleted,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
      })),
      nextCursor,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت پیام‌ها");
  }
}

// ============================================================================
// Server Action: ارسال پیام
// ============================================================================

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments?: string[]
): Promise<ApiResponse<{ messageId: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── بررسی دسترسی ───
    const participation = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.user.id,
        },
      },
    });

    if (!participation) {
      return error("دسترسی به این مکالمه ندارید");
    }

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return error("محتوای پیام نمی‌تواند خالی باشد");
    }

    // ─── قوانین چت: ممنوعیت لینک و اطلاعات تماس خارجی ───
    const linksSetting = await db.systemSetting.findUnique({
      where: { key: "CHAT_LINKS_ALLOWED" },
    });
    const linksAllowed = linksSetting?.value === "true";
    if (!linksAllowed && containsContactLink(content)) {
      return error(CHAT_RULES_ERROR);
    }

    // ─── بررسی تنظیم آپلود فایل ───
    if (attachments && attachments.length > 0) {
      const uploadSetting = await db.systemSetting.findUnique({
        where: { key: "CHAT_FILE_UPLOAD_ENABLED" },
      });
      if (uploadSetting && uploadSetting.value === "false") {
        return error("ارسال فایل در پیام‌ها توسط ادمین غیرفعال شده است");
      }
    }

    // ─── ایجاد پیام ───
    const message = await db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: auth.user.id,
          content: content.trim(),
          attachments: attachments || [],
          messageType: attachments && attachments.length > 0 ? "image" : "text",
          status: "SENT",
        },
        select: { id: true },
      });

      // ─── به‌روزرسانی مکالمه ───
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.trim().substring(0, 100),
        },
      });

      // ─── افزایش unreadCount برای شرکت‌کنندگان دیگر ───
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: { not: auth.user.id },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      return msg;
    });

    // ─── ارسال اعلان ───
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    });

    if (conversation) {
      const recipientIds = conversation.participants
        .filter((p) => p.userId !== auth.user.id)
        .map((p) => p.userId);

      for (const recipientId of recipientIds) {
        await triggerNotification("MESSAGE_RECEIVED", recipientId, {
          senderName: auth.user.displayName || "کاربر",
          conversationId,
        });
      }
    }

    return success("پیام ارسال شد", { messageId: message.id });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در ارسال پیام");
  }
}

// ============================================================================
// Server Action: ایجاد مکالمه جدید (از رزرو یا درخواست)
// ============================================================================

export async function createConversation(data: {
  bookingId?: string;
  requestId?: string;
  otherUserId: string;
}): Promise<ApiResponse<{ conversationId: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── بررسی وجود مکالمه قبلی ───
    if (data.bookingId) {
      const existing = await db.conversation.findUnique({
        where: { bookingId: data.bookingId },
        select: { id: true },
      });
      if (existing) {
        return success("مکالمه موجود است", { conversationId: existing.id });
      }
    }

    if (data.requestId) {
      const existing = await db.conversation.findUnique({
        where: { requestId: data.requestId },
        select: { id: true },
      });
      if (existing) {
        return success("مکالمه موجود است", { conversationId: existing.id });
      }
    }

    // ─── ایجاد مکالمه ───
    const conversation = await db.conversation.create({
      data: {
        bookingId: data.bookingId || null,
        requestId: data.requestId || null,
        title: data.bookingId ? "گفتگو درباره رزرو" : "گفتگو درباره درخواست",
        participants: {
          create: [
            { userId: auth.user.id },
            { userId: data.otherUserId },
          ],
        },
      },
      select: { id: true },
    });

    return success("مکالمه ایجاد شد", { conversationId: conversation.id });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در ایجاد مکالمه");
  }
}

// ============================================================================
// Server Action: علامت‌گذاری پیام‌ها به عنوان خوانده شده
// ============================================================================

export async function markAsRead(
  conversationId: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.user.id,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    return success("پیام‌ها خوانده شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}
