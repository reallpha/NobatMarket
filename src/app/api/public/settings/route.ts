import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// تنظیمات عمومی قابل نمایش در سایت (فقط کلیدهای امن و عمومی)
const PUBLIC_DEFAULTS: Record<string, string> = {
  PLATFORM_NAME: "نوبت مارکت",
  PLATFORM_DESCRIPTION: "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران.",
  SUPPORT_PHONE: "021-12345678",
  SUPPORT_EMAIL: "support@nobat-market.com",
  OFFICE_ADDRESS: "تهران، خیابان ولیعصر",
  INSTAGRAM_URL: "https://instagram.com/nobatmarket",
  TELEGRAM_URL: "https://t.me/nobatmarket",
  TWITTER_URL: "https://twitter.com/nobatmarket",
  CONTACT_TITLE: "در تماس",
  CONTACT_SUBTITLE: "با ما در تماس باشید",
  CONTACT_DESC: "سوالی دارید؟ پیشنهادی دارید؟ مشکلی پیش اومده؟ تیم ما آماده کمک به شماست.",
  CONTACT_EMAIL: "support@nobat-market.com",
  CONTACT_PHONE: "021-12345678",
  CONTACT_ADDRESS: "تهران، خیابان ولیعصر",
  CONTACT_HOURS: "شنبه تا پنجشنبه · ۹ صبح تا ۶ عصر",
  CONTACT_FORM_TITLE: "پیام بفرستید",
  CONTACT_FORM_SUBTITLE: "فرم زیر رو پر کنید و ما در اسرع وقت پاسخ می‌دیم.",
  CONTACT_RESPONSE_TITLE: "پاسخ سریع",
  CONTACT_RESPONSE_TEXT: "تیم پشتیبانی ما در تمام ساعات کاری آماده پاسخگویی به سوالات شماست. معمولاً ظرف ۲ ساعت پاسخ می‌دیم.",
  CONTACT_FAQ: "",
  // ─── مقادیر عملیاتی غیرحساس ───
  // این‌ها هیچ رمز/کلیدی نیستند و برای نمایش درست به کاربر لازم‌اند:
  // درصد بیعانه (نمایش مبلغ پیش از پرداخت) و محدودیت‌های آپلود تصویر.
  DEPOSIT_PERCENT: "20",
  MAX_UPLOAD_SIZE_MB: "10",
  ALLOWED_IMAGE_TYPES: "jpg,jpeg,png,webp",
};

export async function GET() {
  try {
    const rows = await db.systemSetting.findMany({
      where: { key: { in: Object.keys(PUBLIC_DEFAULTS) } },
      select: { key: true, value: true },
    });
    const settings = { ...PUBLIC_DEFAULTS };
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json(
      { settings },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch {
    return NextResponse.json({ settings: PUBLIC_DEFAULTS });
  }
}
