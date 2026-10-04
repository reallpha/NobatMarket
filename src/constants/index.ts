// ============================================================================
// ثابت‌های سراسری - پلتفرم نوبت مارکت
// ============================================================================

/**
 * نام و اطلاعات اپلیکیشن
 */
export const APP_NAME = "نوبت مارکت";
export const APP_NAME_EN = "NOBAT_MARKET";
export const APP_DESCRIPTION = "پلتفرم رزرو نوبت برای کسب‌وکارها";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * محدودیت‌های آپلود فایل
 */
export const UPLOAD_LIMITS = {
  /** حداکثر حجم تصویر (۱۰ مگابایت) */
  IMAGE_MAX_SIZE: 10 * 1024 * 1024,
  /** حداکثر حجم ویدئو (۵۰ مگابایت) */
  VIDEO_MAX_SIZE: 50 * 1024 * 1024,
  /** فرمت‌های مجاز تصویر (تقریباً همه فرمت‌های رایج) */
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/heic",
    "image/heif",
    "image/svg+xml",
  ],
  /** فرمت‌های مجاز ویدئو */
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/quicktime"],
  /** حداکثر تعداد تصاویر در هر آپلود */
  MAX_IMAGES_PER_UPLOAD: 10,
} as const;

/**
 * محدودیت‌های صفحه‌بندی
 */
export const PAGINATION = {
  /** تعداد پیش‌فرض آیتم در هر صفحه */
  DEFAULT_PAGE_SIZE: 20,
  /** حداکثر تعداد آیتم در هر صفحه */
  MAX_PAGE_SIZE: 100,
  /** تعداد پیش‌فرض آیتم در لیست‌ها */
  LIST_PAGE_SIZE: 12,
} as const;

/**
 * محدودیت‌های Rate Limiting
 */
export const RATE_LIMITS = {
  /** درخواست‌های API در دقیقه */
  API_PER_MINUTE: 60,
  /** پیام‌های چت در دقیقه */
  MESSAGES_PER_MINUTE: 30,
  /** درخواست‌های احراز هویت در ساعت */
  AUTH_PER_HOUR: 10,
  /** درخواست‌های رمز عبور در ساعت */
  PASSWORD_RESET_PER_HOUR: 3,
  /** حداکثر آپلود تصویر در روز (برای هر هنرمند) */
  UPLOAD_ARTIST_DAILY: 50,
} as const;

/**
 * کلیدهای Redis
 */
export const REDIS_KEYS = {
  /** کش جستجوی هنرمندان */
  ARTIST_SEARCH: "artist:search:",
  /** کش جزئیات هنرمند */
  ARTIST_DETAIL: "artist:detail:",
  /** کش پورتفولیو */
  PORTFOLIO: "portfolio:",
  /** کش در دسترسی */
  AVAILABILITY: "availability:",
  /** کش جلسات */
  SLOTS: "slots:",
  /** Rate Limit */
  RATE_LIMIT: "ratelimit:",
  /** نشست کاربر */
  SESSION: "session:",
  /** کد تأیید */
  VERIFY_CODE: "verify:",
  /** کش آمار داشبورد */
  DASHBOARD_STATS: "dashboard:stats:",
} as const;

/**
 * فاصله زمانی جلسات
 */
export const BOOKING_CONSTRAINTS = {
  /** حداقل زمان رزرو (ساعت) */
  MIN_ADVANCE_HOURS: 2,
  /** حداکثر زمان رزرو (روز) */
  MAX_ADVANCE_DAYS: 90,
  /** حداقل مدت جلسه (دقیقه) */
  MIN_DURATION_MINUTES: 30,
  /** حداکثر مدت جلسه (دقیقه) */
  MAX_DURATION_MINUTES: 480,
  /** فاصله بین جلسات (دقیقه) */
  BUFFER_MINUTES: 15,
} as const;

/**
 * مقادیر پیش‌فرض پرداخت
 */
export const PAYMENT_DEFAULTS = {
  /** درصد کارمزد پلتفرم — دقیقاً معادل بیعانه؛ بیعانه سهم پلتفرم است و باقی‌مانده سهم هنرمند */
  PLATFORM_FEE_PERCENT: 20,
  /** بیعانه به درصد مبلغ توافق‌شده */
  DEPOSIT_PERCENT: 20,
  /** سقف پروژه هم‌زمان فعال برای هر هنرمند و هر مشتری */
  MAX_ACTIVE_PROJECTS: 2,
  /** حداقل مبلغ قابل برداشت (تومان) */
  MIN_WITHDRAWAL_AMOUNT: 500000,
  /** حداکثر مبلغ برداشت روزانه (تومان) */
  MAX_DAILY_WITHDRAWAL: 50000000,
  /** مهلت پرداخت (دقیقه) */
  PAYMENT_TIMEOUT_MINUTES: 30,
  /** مهلت تسویه برداشت (ساعت کاری) */
  PAYOUT_SLA_HOURS: 72,
} as const;

/** وضعیت‌های «فعال» رزرو (پروژه باز محسوب می‌شوند) */
export const ACTIVE_BOOKING_STATUSES = [
  "REQUESTED",
  "PENDING_ARTIST",
  "CONFIRMED",
  "IN_PROGRESS",
  "RESCHEDULE_PENDING",
] as const;

/**
 * استان‌های ایران
 */
export const IRANIAN_PROVINCES = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
] as const;

/**
 * سبک‌های تتو
 */
export const TATTOO_STYLES = [
  "ریلیسم",
  "بلک‌ورک",
  "فاین لاین",
  "مینیمال",
  "ولد اسکول",
  "ژاپنی",
  "جئومتریک",
  "واترکالر"
] as const;

/**
 * سایزهای تتو
 */
export const TATTOO_SIZES = [
  "کوچک",
  "متوسط",
  "بزرگ",
  "تمام بدن"
] as const;

/**
 * نواحی بدن
 */
export const BODY_PARTS = [
  "بازو",
  "ساعد",
  "سینه",
  "پشت",
  "شانه",
  "پا",
  "ران",
  "زانو",
  "گردن",
  "صورت",
  "دست",
  "پا (ساق)",
  "شکم",
  "ران و باسن"
] as const;

/**
 * شهرهای اصلی
 */
export const MAJOR_CITIES = [
  "تهران",
  "اصفهان",
  "شیراز",
  "تبریز",
  "مشهد",
  "اهواز",
  "کرمان",
  "اراک",
  "همدان",
  "یزد",
  "قم",
  "رشت",
  "بندرعباس",
  "زنجان",
  "سنندج",
  "بیرجند",
  "بجنورد",
  "ساری",
  "گرگان",
  "خرم‌آباد",
] as const;
