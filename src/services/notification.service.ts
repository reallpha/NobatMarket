"use server";

// ============================================================================
// سرویس اعلان‌ها - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/role-guard";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: دریافت اعلان‌های کاربر
// ============================================================================

export async function getNotifications(
  page: number = 1,
  limit: number = 20
): Promise<
  ApiResponse<{
    notifications: {
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      link: string | null;
      createdAt: string;
    }[];
    unreadCount: number;
    total: number;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const [notifications, unreadCount, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          link: true,
          createdAt: true,
        },
      }),
      db.notification.count({
        where: { userId: auth.user.id, isRead: false },
      }),
      db.notification.count({
        where: { userId: auth.user.id },
      }),
    ]);

    return success("اعلان‌ها دریافت شد", {
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      total,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت اعلان‌ها");
  }
}

// ============================================================================
// Server Action: دریافت تعداد اعلان‌های خوانده نشده
// ============================================================================

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const count = await db.notification.count({
      where: { userId: auth.user.id, isRead: false },
    });

    return success("تعداد اعلان‌ها", { count });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: علامت‌گذاری به عنوان خوانده شده
// ============================================================================

export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db.notification.updateMany({
      where: { id: notificationId, userId: auth.user.id },
      data: { isRead: true },
    });

    return success("اعلان خوانده شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: علامت‌گذاری همه به عنوان خوانده شده
// ============================================================================

export async function markAllAsRead(): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data: { isRead: true },
    });

    return success("همه اعلان‌ها خوانده شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Helper: ایجاد اعلان برای رویدادهای سیستم
// ============================================================================

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  data?: Record<string, string>;
  isTicket?: boolean;
  senderId?: string;
}) {
  try {
    return await db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: (params.type as never) || "INFO",
        link: params.link || null,
        data: params.data || undefined,
        isTicket: params.isTicket || false,
        senderId: params.senderId || null,
      },
    });
  } catch (err) {
    console.error("خطا در ایجاد اعلان:", err);
    return null;
  }
}
