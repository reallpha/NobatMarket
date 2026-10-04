import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateSettings } from "@/lib/server-settings";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsRaw = await db.systemSetting.findMany({
      select: { key: true, value: true },
    });

    const settings: Record<string, string> = {
      // عمومی
      PLATFORM_NAME: "نوبت مارکت",
      PLATFORM_DESCRIPTION: "",
      SUPPORT_PHONE: "",
      SUPPORT_EMAIL: "",
      OFFICE_ADDRESS: "",
      ACTIVE_FONT: "SAHEL",
      // سئو
      SEO_DEFAULT_TITLE: "نوبت مارکت | پلتفرم رزرو نوبت ایران",
      SEO_DEFAULT_DESCRIPTION: "",
      SEO_KEYWORDS: "",
      GOOGLE_ANALYTICS_ID: "",
      GTM_ID: "",
      GOOGLE_SITE_VERIFICATION: "",
      CUSTOM_ROBOTS_TXT: "",
      // رزرو
      BOOKINGS_ENABLED: "true",
      AUTO_CONFIRM: "false",
      MAX_PENDING_BOOKINGS: "5",
      CANCELLATION_HOURS: "24",
      DEPOSIT_PERCENT: "30",
      MIN_BOOKING_PRICE: "500000",
      MAX_BOOKING_PRICE: "50000000",
      REQUIRE_DEPOSIT: "true",
      ALLOW_RESCHEDULE: "true",
      // پرداخت
      DEFAULT_COMMISSION_PERCENT: "15",
      PAYMENT_MODE: "mock",
      ZARINPAL_MERCHANT_ID: "",
      ZARINPAL_SANDBOX: "true",
      ZARINPAL_CALLBACK_URL: "",
      MIN_WITHDRAWAL: "500000",
      AUTO_PAYOUT: "false",
      // شبکه‌ها
      INSTAGRAM_URL: "",
      TELEGRAM_URL: "",
      TWITTER_URL: "",
      APARAT_URL: "",
      WHATSAPP_URL: "",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
      // تتوی فلش
      FLASH_ENABLED: "true",
      MAX_FLASH_PER_ARTIST: "20",
      FLASH_SALE_DAYS: "30",
      FLASH_COMMISSION: "15",
      // اعلان‌ها
      NOTIFICATIONS_ENABLED: "true",
      SMS_ENABLED: "false",
      PUSH_NOTIFICATIONS: "false",
      NOTIFY_ADMIN_ON_BOOKING: "true",
      CHAT_FILE_UPLOAD_ENABLED: "true",
      CHAT_LINKS_ALLOWED: "false",
      KAVEHNEGAR_API_KEY: "",
      SMS_SENDER: "",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      // پنل پیامکی ملی پیامک
      MELI_USERNAME: "",
      MELI_PASSWORD: "",
      MELI_API_KEY: "",
      MELI_SENDER_NUMBER: "",
      // صفحه اصلی
      HOME_FEATURED_COUNT: "10",
      HOME_FEATURED_ARTISTS: "[]",
      // محتوا
      BLOG_ENABLED: "true",
      FLASH_PAGE_ENABLED: "true",
      STUDIOS_ENABLED: "true",
      INSPIRATION_ENABLED: "true",
      PORTFOLIO_PUBLIC: "true",
      BLOG_POSTS_PER_PAGE: "9",
      MAX_UPLOAD_SIZE_MB: "10",
      ALLOWED_IMAGE_TYPES: "jpg,jpeg,png,webp",
      MAGAZINE_FEATURED_POSTS: "[]",
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
      // سیستم
      MAINTENANCE_MODE: "false",
      DEBUG_MODE: "false",
      REGISTRATION_ENABLED: "true",
      MAX_SESSIONS: "5",
      SESSION_EXPIRY_DAYS: "30",
      RATING_CALC_INTERVAL: "7",
    };
    settingsRaw.forEach((s) => {
      settings[s.key] = s.value;
    });

    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updates = Object.entries(data).map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(updates);

    // ابطال کش تنظیمات تا تغییرات بلافاصله (بدون انتظار ۵ ثانیه) اعمال شود
    revalidateSettings();

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "UPDATED_SETTINGS",
          details: { keys: Object.keys(data) },
        },
      });
    } catch {
      // Audit log optional — don't fail if table doesn't exist
    }

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد" });
  } catch (err: any) {
    console.error("Settings save error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
