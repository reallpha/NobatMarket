import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyMeliConnection, sendSimpleSms } from "@/lib/sms";

/**
 * تست اتصال پنل پیامکی ملی‌پیامک (فقط ادمین)
 *
 * به‌صورت پیش‌فرض فقط «نام کاربری/رمز عبور» را بررسی می‌کند و اعتبار پنل و
 * فهرست خطوط را برمی‌گرداند — بدون ارسال هیچ پیامکی (بدون هزینه).
 * اگر در بدنه‌ی درخواست `testPhone` بیاید، یک پیامک آزمایشی هم به آن شماره ارسال می‌شود.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const testPhone = typeof body?.testPhone === "string" ? body.testPhone.trim() : "";

    const report = await verifyMeliConnection();

    if (!report.ok) {
      return NextResponse.json({
        success: false,
        message: report.message,
        errorCode: report.errorCode,
        numbers: report.numbers,
      });
    }

    if (testPhone) {
      const result = await sendSimpleSms(
        testPhone,
        "پیام آزمایشی نوبت مارکت — اتصال پنل پیامکی با موفقیت برقرار شد."
      );
      return NextResponse.json({
        success: true,
        message: report.message,
        credit: report.credit,
        numbers: report.numbers,
        senderRecognized: report.senderRecognized,
        testSms: result,
      });
    }

    return NextResponse.json({
      success: true,
      message: report.message,
      credit: report.credit,
      numbers: report.numbers,
      senderRecognized: report.senderRecognized,
    });
  } catch (error) {
    console.error("SMS connection test error:", error);
    return NextResponse.json(
      { success: false, message: "خطای غیرمنتظره در تست اتصال پیامک" },
      { status: 500 }
    );
  }
}
