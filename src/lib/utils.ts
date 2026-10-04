// ============================================================================
// توابع کمکی (Utilities) - نوبت مارکت
// ============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jalaali from "jalaali-js";
import { format, parseISO, isValid } from "date-fns";

// ============================================================================
// توابع CSS
// ============================================================================

/**
 * ادغام کلاس‌های Tailwind با مدیریت تعارض
 * مثال: cn("p-4", isActive && "bg-red-500", "p-8") → "p-8 bg-red-500"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// تبدیل تاریخ
// ============================================================================

/**
 * تبدیل تاریخ میلادی به جلالی (شمسی)
 * @returns رشته فرمت شده جلالی مثال: "۱۴۰۳/۰۷/۱۵"
 */
export function toPersianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "تاریخ نامعتبر";

  const jalali = jalaali.toJalaali(d);
  const year = toPersianNumbers(jalali.jy.toString());
  const month = toPersianNumbers(jalali.jm.toString().padStart(2, "0"));
  const day = toPersianNumbers(jalali.jd.toString().padStart(2, "0"));

  return `${year}/${month}/${day}`;
}

/**
 * تبدیل تاریخ جلالی به میلادی
 */
export function fromPersianDate(
  year: number,
  month: number,
  day: number
): Date | null {
  try {
    const gregorian = jalaali.toGregorian(year, month, day);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
  } catch {
    return null;
  }
}

/**
 * تبدیل اعداد لاتین به فارسی
 */
export function toPersianNumbers(str: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str
    .toString()
    .replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * تبدیل اعداد فارسی به لاتین
 */
export function toLatinNumbers(str: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], "g"), i.toString());
  }
  return result;
}

/**
 * نمایش تاریخ به صورت نسبی
 * مثال: "۳ ساعت پیش"، "دیروز"، "۲ روز پیش"
 */
export function toRelativePersianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "نامشخص";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "همین الان";
  if (diffMinutes < 60)
    return `${toPersianNumbers(diffMinutes.toString())} دقیقه پیش`;
  if (diffHours < 24)
    return `${toPersianNumbers(diffHours.toString())} ساعت پیش`;
  if (diffDays === 1) return "دیروز";
  if (diffDays < 7)
    return `${toPersianNumbers(diffDays.toString())} روز پیش`;
  if (diffWeeks < 4)
    return `${toPersianNumbers(diffWeeks.toString())} هفته پیش`;
  return `${toPersianNumbers(diffMonths.toString())} ماه پیش`;
}

// ============================================================================
// فرمت‌سازی پول
// ============================================================================

/**
 * فرمت قیمت به تومان
 * مثال: "۲,۵۰۰,۰۰۰ تومان"
 */
export function formatPrice(
  amount: bigint | number,
  showCurrency: boolean = true
): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  const formatted = num.toLocaleString("fa-IR");
  return showCurrency ? `${formatted} تومان` : formatted;
}

/**
 * فرمت قیمت کوتاه
 * مثال: "۲.۵M" یا "۱۵۰K"
 */
export function formatPriceShort(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;

  if (num >= 1_000_000) {
    const value = (num / 1_000_000).toFixed(1);
    return `${toPersianNumbers(value)}M`;
  }
  if (num >= 1_000) {
    const value = (num / 1_000).toFixed(0);
    return `${toPersianNumbers(value)}K`;
  }
  return toPersianNumbers(num.toLocaleString("fa-IR"));
}

// ============================================================================
// فرمت‌سازی زمان
// ============================================================================

/**
 * فرمت ساعت به صورت فارسی
 * مثال: "۱۴:۳۰"
 */
export function formatPersianTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "نامعتبر";

  const hours = toPersianNumbers(d.getHours().toString().padStart(2, "0"));
  const minutes = toPersianNumbers(d.getMinutes().toString().padStart(2, "0"));
  return `${hours}:${minutes}`;
}

/**
 * فرمت تاریخ و زمان کامل
 * مثال: "۱۵ مهر ۱۴۰۳، ۱۴:۳۰"
 */
export function formatFullPersianDateTime(date: Date | string): string {
  const persianMonths = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "تاریخ نامعتبر";

  const jalali = jalaali.toJalaali(d);
  const monthName = persianMonths[jalali.jm - 1] || "";
  const day = toPersianNumbers(jalali.jd.toString());
  const year = toPersianNumbers(jalali.jy.toString());
  const time = formatPersianTime(d);

  return `${day} ${monthName} ${year}، ${time}`;
}

// ============================================================================
// فرمت‌سازی تاریخ جلالی پیشرفته
// ============================================================================

/**
 * فرمت تاریخ جلالی با قالب دلخواه
 * @param date - تاریخ ورودی
 * @param format - قالب خروجی: "full" | "short" | "date" | "datetime"
 * @returns رشته فرمت شده جلالی
 *
 * مثال‌ها:
 *  - formatJalaliDate(new Date(), "full")     → "جمعه ۱۵ مهر ۱۴۰۳"
 *  - formatJalaliDate(new Date(), "short")    → "۱۴۰۳/۰۷/۱۵"
 *  - formatJalaliDate(new Date(), "datetime") → "۱۵ مهر ۱۴۰۳، ۱۴:۳۰"
 */
export function formatJalaliDate(
  date: Date | string,
  format: "full" | "short" | "date" | "datetime" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "تاریخ نامعتبر";

  const persianMonths = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const persianWeekDays = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];

  const jalali = jalaali.toJalaali(d);
  const year = toPersianNumbers(jalali.jy.toString());
  const day = toPersianNumbers(jalali.jd.toString());
  const monthName = persianMonths[jalali.jm - 1] || "";
  const weekDay = persianWeekDays[d.getDay()];
  const time = formatPersianTime(d);

  switch (format) {
    case "full":
      return `${weekDay} ${day} ${monthName} ${year}`;
    case "date":
      return `${day} ${monthName} ${year}`;
    case "datetime":
      return `${day} ${monthName} ${year}، ${time}`;
    case "short":
    default:
      return toPersianDate(d);
  }
}

// ============================================================================
// توابع اعتبارسنجی
// ============================================================================

/**
 * اعتبارسنجی شماره موبایل ایرانی
 */
export function isValidIranianPhone(phone: string): boolean {
  // فرمت: 09123456789 یا +989123456789 یا 989123456789
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(?:(\+98|98|0)9\d{9})$/.test(cleaned);
}

/**
 * نرمال‌سازی شماره موبایل به فرمت استاندارد
 * خروجی: 09123456789
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()+]/g, "");

  if (cleaned.startsWith("98")) {
    cleaned = "0" + cleaned.substring(2);
  }

  return cleaned;
}

/**
 * اعتبارسنجی شماره کارت بانکی ایرانی (۱۶ رقم)
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/[\s\-]/g, "");
  if (!/^\d{16}$/.test(cleaned)) return false;

  // الگوریتم Luhn
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    const digit = parseInt(cleaned[i]);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }
  return sum % 10 === 0;
}

/**
 * اعتبارسنجی شماره شبا ایرانی
 */
export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/[\s\-]/g, "").toUpperCase();
  return /^IR\d{24}$/.test(cleaned);
}

// ============================================================================
// توابع رشته‌ای
// ============================================================================

/**
 * تبدیل کاراکترهای فارسی/عربی به معادل لاتین برای ساخت slug امن URL
 * (Next.js روی مسیرهای داینامیک با کاراکترهای غیر-لاتین مشکل دارد)
 */
const FA_TO_EN: Record<string, string> = {
  "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s",
  "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
  "ر": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
  "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f",
  "ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n",
  "و": "v", "ه": "h", "ی": "y", "ئ": "e", "ء": "", "ة": "h",
  "ك": "k", "ى": "y", "أ": "a", "إ": "a", "ؤ": "v", "ۀ": "h",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/**
 * ساخت slug امن و لاتین از متن فارسی/انگلیسی
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (ch) => FA_TO_EN[ch] || "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 80);
}

/**
 * محدود کردن متن به طول مشخص
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * حذف تگ‌های HTML از متن
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ============================================================================
// توابع عددی
// ============================================================================

/**
 * تبدیل BigInt به Number با حفظ ایمنی
 */
export function bigIntToNumber(value: bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/**
 * نرمال‌سازی رتبه‌بندی (۰ تا ۵)
 */
export function normalizeRating(rating: number): number {
  return Math.min(5, Math.max(0, Math.round(rating * 10) / 10));
}

/**
 * بازه زمانی روز/ماه جاری بر اساس منطقه زمانی تهران (UTC+3:30)
 * خروجی به‌صورت لحظه‌های UTC برای مقایسه با تاریخ‌های ذخیره‌شده در دیتابیس
 */
export function tehranRange(
  period: "day" | "month" = "day",
  now: Date = new Date()
): { start: Date; end: Date } {
  // دریافت سال/ماه/روز فعلی در تهران
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = parts.split("-").map(Number);

  // نیمه‌شب تهران به‌صورت لحظه UTC: (00:00 تهران = 20:30 روز قبل UTC)
  const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
  const startOfDay = new Date(Date.UTC(year, month - 1, day) - TEHRAN_OFFSET_MS);

  if (period === "day") {
    return { start: startOfDay, end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) };
  }

  // ابتدای ماه جاری تهران
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1) - TEHRAN_OFFSET_MS);
  // ابتدای ماه بعد تهران
  const nextMonth = month === 12 ? new Date(Date.UTC(year + 1, 0, 1) - TEHRAN_OFFSET_MS) : new Date(Date.UTC(year, month, 1) - TEHRAN_OFFSET_MS);
  return { start: startOfMonth, end: nextMonth };
}

// ============================================================================
// توابع لیست‌ها
// ============================================================================

/**
 * لیست سبک‌های تتو به فارسی
 */
export const TATTOO_STYLE_LABELS: Record<string, string> = {
  BLACKWORK: "بلک‌ورک (سیاه‌کاری)",
  REALISM: "رئالیسم (واقع‌گرایانه)",
  GEOMETRIC: "ژئومتریک (هندسی)",
  MINIMAL: "مینیمال (ساده و ظریف)",
  FINE_LINE: "فاین‌لاین (خطوط ظریف)",
  ABSTRACT: "آبستره (انتزاعی)",
  OLD_SCHOOL: "اولد اسکول (سنتی غربی)",
  NEO_TRADITIONAL: "نئو تریدیشنال",
  BLACK_AND_GREY: "سیاه و سفید",
  COLOR: "رنگی",
  LINE_ART: "لاین آرت (خطی)",
  DOTWORK: "دات‌ورک (نقطه‌ای)",
  JAPANESE: "ژاپنی (ایرزوکا)",
  TRIBAL: "ترای",
  WATERCOLOR: "واتروکالر (آبرنگی)",
  LETTERING: "لترینگ (خوشنویسی)",
  BIOMECHANICAL: "بیو مکانیکال",
  CHICANO: "چیکانو",
  OTHER: "سایر",
};

/**
 * لیست اندازه‌های تتو به فارسی
 */
export const TATTOO_SIZE_LABELS: Record<string, string> = {
  SMALL: "کوچک (زیر ۵ سانتی‌متر)",
  MEDIUM: "متوسط (۵ تا ۱۵ سانتی‌متر)",
  LARGE: "بزرگ (۱۵ تا ۳۰ سانتی‌متر)",
  EXTRA_LARGE: "خیلی بزرگ (بالای ۳۰ سانتی‌متر)",
  HALF_SLEEVE: "نیم‌آستین",
  FULL_SLEEVE: "آستین کامل",
};

/**
 * لیست وضعیت‌های رزرو به فارسی
 */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "درخواست شده",
  PENDING_ARTIST: "در انتظار تأیید هنرمند",
  CONFIRMED: "تأیید شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "تکمیل شده",
  CANCELLED_BY_CLIENT: "لغو شده توسط مشتری",
  CANCELLED_BY_ARTIST: "لغو شده توسط هنرمند",
  NO_SHOW: "عدم حضور",
  RESCHEDULE_PENDING: "در انتظار تغییر زمان",
};

/**
 * لیست روزهای هفته به فارسی
 */
/** برچسب فارسی وضعیت پرداخت */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  REFUNDED: "بازپرداخت شده",
  PARTIALLY_REFUNDED: "بازپرداخت جزئی",
  FAILED: "ناموفق",
  CANCELLED: "لغو شده",
};

/** برچسب فارسی نوع پرداخت (سهم پلتفرم یا سهم هنرمند) */
export const PAYMENT_PURPOSE_LABELS: Record<string, string> = {
  DEPOSIT: "بیعانه — سهم پلتفرم",
  REMAINDER: "باقی‌مانده — سهم هنرمند",
};

/** رنگ‌های وضعیت پرداخت (کلاس‌های تیلویند) */
export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REFUNDED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  PARTIALLY_REFUNDED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-300",
  CANCELLED: "border-zinc-600/40 bg-zinc-700/20 text-zinc-400",
};

export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  SATURDAY: "شنبه",
  SUNDAY: "یکشنبه",
  MONDAY: "دوشنبه",
  TUESDAY: "سه‌شنبه",
  WEDNESDAY: "چهارشنبه",
  THURSDAY: "پنجشنبه",
  FRIDAY: "جمعه",
};

// تصاویر نمونه‌کارهای محلی
export const LOCAL_SAMPLE_IMAGES: Record<string, string> = {
  "hassan-black|BLACKWORK|گل سرخ": "/image/sample/بلک‌ورک  گل سرخ (حسن بلک).webp",
  "lila-fine|DOTWORK|ماه کامل": "/image/sample/دات‌ورک  ماه کامل (لیلا لاین).webp",
  "lila-fine|DOTWORK|قلب آناتومیک": "/image/sample/دات‌ورک  قلب آناتومیک (لیلا لاین).webp",
  "nima-color|WATERCOLOR|عقاب پرنده": "/image/sample/واتروکالر  عقاب پرنده (نیما رنگارنگ).webp",
  "amir-darklines|FINE_LINE|پروانه زیبا": "/image/sample/فاین‌لاین  پروانه زیبا (امیر دارک‌لاینز).webp",
  "maryam-arts|MINIMAL|قلب آتشین": "/image/sample/مینیمال  قلب آتشین (مریم آرتس).webp",
  "reza-inkmaster|GEOMETRIC|اژدها کوچک": "/image/sample/ژئومتریک  اژدها کوچک (رضا اینک‌مستر).webp",
  "sara-ink|REALISM|ستاره دریایی": "/image/sample/رئالیسم  ستاره دریایی (سارا اینک).webp",
  "ali-needles|BLACKWORK|گل سرخ": "/image/sample/بلک‌ورک  طرح انتزاعیتزئینی (علی نیدلز).webp",
  "nima-color|LINE_ART|سوزن و جوهر": "/image/sample/لاین آرت  طرح پیوسته گیاهی (نیما رنگارنگ).webp",
  "amir-darklines|COLOR": "/image/sample/رنگی  منشور هندسی رنگی (امیر دارک‌لاینز).webp",
  "maryam-arts|BLACK_AND_GREY|حلقه هندسی": "/image/sample/سیاه و خاکستری  حلقه هندسی (مریم آرتس).webp",
};

export function resolveSampleImage(
  artistSlug: string,
  style: string,
  title: string
): string | null {
  for (const [key, imagePath] of Object.entries(LOCAL_SAMPLE_IMAGES)) {
    const parts = key.split("|");
    if (parts[0] === artistSlug && parts[1] === style) {
      const titlePart = parts.slice(2).join("|");
      if (!titlePart || title.includes(titlePart) || titlePart.includes(title)) {
        return imagePath;
      }
    }
  }
  for (const [key, imagePath] of Object.entries(LOCAL_SAMPLE_IMAGES)) {
    const parts = key.split("|");
    if (parts[0] === artistSlug && parts[1] === style && parts.length === 2) {
      return imagePath;
    }
  }
  return null;
}

/**
 * بررسی وجود لینک/اطلاعات تماس خارجی در متن پیام‌های چت و تیکت
 * طبق قوانین نوبت مارکت، کاربران نباید خارج از پلتفرم ارتباط بگیرند.
 */
export function containsContactLink(text: string): boolean {
  const normalized = (text || "").toLowerCase();
  // لینک‌های صریح و دامنه‌های رایج
  const urlPatterns = [
    /https?:\/\//,
    /www\./,
    /\.com\b/,
    /\.ir\b/,
    /\.net\b/,
    /\.org\b/,
    /t\.me\//,
    /telegram\./,
    /instagram\./,
    /wa\.me\//,
    /whatsapp\./,
    /youtube\./,
    /aparat\./,
    /rubika\./,
    /eitaa\./,
    /ble\.ir/,
    /gap\.im/,
  ];
  if (urlPatterns.some((re) => re.test(normalized))) return true;
  // ایمیل
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(normalized)) return true;
  // شماره تلفن ایرانی (۰۹... یا +98 یا 989...)
  if (/(\b09\d{9}\b)|(\+98\d{10})|(989\d{9})/.test(normalized.replace(/[\s\-()]/g, ""))) return true;
  // اشاره صریح به شبکه اجتماعی در متن
  if (/(اینستاگرام|تلگرام|واتساپ|روبیکا|ایتا|بله|شماره تماس|ایدی|آیدی|@)/.test(normalized)) return true;
  return false;
}
