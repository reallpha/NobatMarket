"use server";

// ============================================================================
// سرویس تنظیمات سیستم و گزارش عملیات - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireRole } from "@/lib/role-guard";
import { revalidateSettings } from "@/lib/server-settings";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// ثابت‌های پیش‌فرض
// ============================================================================

const DEFAULT_SETTINGS: Record<string, string> = {
  PLATFORM_NAME: "نوبت مارکت",
  SUPPORT_PHONE: "021-12345678",
  DEFAULT_COMMISSION_PERCENT: "15",
  ACTIVE_FONT: "SAHEL",
};

// ============================================================================
// Server Action: دریافت تنظیمات
// ============================================================================

export async function getSettings(): Promise<
  ApiResponse<Record<string, string>>
> {
  try {
    const settings = await db.systemSetting.findMany({
      select: { key: true, value: true },
    });

    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    return success("تنظیمات دریافت شد", result);
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: به‌روزرسانی تنظیمات (ادمین)
// ============================================================================

export async function updateSettings(
  data: Record<string, string>
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const updates = Object.entries(data).map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await Promise.all(updates);

    // ابطال کش تنظیمات تا تغییرات بلافاصله اعمال شود
    revalidateSettings();

    // ─── ثبت در گزارش عملیات ───
    await db.auditLog.create({
      data: {
        adminId: auth.user.id,
        action: "UPDATED_SETTINGS",
        details: { keys: Object.keys(data) },
      },
    });

    return success("تنظیمات ذخیره شد");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: ثبت گزارش عملیات
// ============================================================================

export async function createAuditLog(
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user) return;

    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action,
        details: details || undefined,
      },
    });
  } catch (err) {
    console.error("خطا در ثبت گزارش:", err);
  }
}

// ============================================================================
// Server Action: دریافت گزارش عملیات (ادمین)
// ============================================================================

export async function getAuditLogs(
  page: number = 1,
  limit: number = 50
): Promise<
  ApiResponse<{
    logs: {
      id: string;
      action: string;
      details: any;
      createdAt: string;
      admin: { displayName: string };
    }[];
    total: number;
  }>
> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            select: { displayName: true },
          },
        },
      }),
      db.auditLog.count(),
    ]);

    return success("گزارش‌ها دریافت شد", {
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
        admin: l.admin,
      })),
      total,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}
