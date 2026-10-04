// ============================================================================
// Internal Maintenance Route — وظایف دوره‌ای (Cron)
// ============================================================================
//
// کارهای انجام‌شده:
//   ۱) لغو درخواست‌های رزروی که بیعانه‌شان در مهلت ۴ ساعته پرداخت نشده است
//      تا زمان رزروشده برای هنرمند و سایر مشتریان آزاد شود.
//   ۲) ریست فوری داده‌های نمایشی با ?action=reset-demo
//      (پیش‌نمایش هر ۲۴ ساعت خودش ریست می‌شود؛ این برای «همین حالا» است)
//
// فراخوانی:
//   GET /api/internal/maintenance
//   Header: x-cron-secret: <CRON_SECRET>
//   (یا ?secret=<CRON_SECRET>)
//
// نکته: این عملیات Idempotent است و اجرای مکرر آن بی‌خطر است.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { expireUnpaidBookingRequests } from "@/lib/booking-rules";
import { resetDemoDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("x-cron-secret");
  const query = req.nextUrl.searchParams.get("secret");
  return header === secret || query === secret;
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET تنظیم نشده است؛ این مسیر غیرفعال است",
      },
      { status: 503 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // ریست دستی پیش‌نمایش: هر تغییری که بازدیدکننده‌ها داده‌اند پاک می‌شود
    if (req.nextUrl.searchParams.get("action") === "reset-demo") {
      resetDemoDb();
      return NextResponse.json(
        {
          success: true,
          action: "reset-demo",
          message: "داده‌های نمایشی به حالت اولیه برگشت",
          ranAt: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const cancelled = await expireUnpaidBookingRequests();
    return NextResponse.json(
      {
        success: true,
        cancelledUnpaidRequests: cancelled,
        ranAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Maintenance job error:", err);
    return NextResponse.json(
      { success: false, error: "خطا در اجرای وظایف دوره‌ای" },
      { status: 500 }
    );
  }
}
