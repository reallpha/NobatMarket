import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  INTERNAL_SECRET_HEADER,
  isAuthorizedInternalCall,
} from "@/lib/internal-secret";

// این مسیر فقط برای middleware است (اجرای Node runtime) تا بتواند تنظیمات
// سیستمی را بخواند. Edge runtime نمی‌تواند مستقیم به دیتابیس وصل شود.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * فهرست سفید کلیدهایی که middleware به آن‌ها نیاز دارد.
 *
 * ⚠️ این فهرست عمداً بسیار محدود است: مسیر قبلاً «همه تنظیمات» را برمی‌گرداند
 * و چون بدون احراز هویت در دسترس بود، رمز پنل پیامکی، کلید API و مرچنت‌کد
 * زرین‌پال را به هر بازدیدکننده‌ای لو می‌داد. اکنون فقط کلیدهای بی‌خطر
 * (که هیچ رمز و کلیدی در آن‌ها نیست) برگردانده می‌شوند.
 */
const MIDDLEWARE_SETTING_KEYS = [
  "MAINTENANCE_MODE",
  "DEBUG_MODE",
  "rateLimitEnabled",
] as const;

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(req: NextRequest) {
  // ─── دروازه امنیتی: فقط خود سرور مجاز است ───
  if (!isAuthorizedInternalCall(req.headers.get(INTERNAL_SECRET_HEADER))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db.systemSetting.findMany({
      where: { key: { in: [...MIDDLEWARE_SETTING_KEYS] } },
      select: { key: true, value: true },
    });
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({ settings }, { headers: NO_STORE });
  } catch (err) {
    console.error("Internal settings read error:", err);
    return NextResponse.json({ settings: {} }, { headers: NO_STORE });
  }
}
