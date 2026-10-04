// ============================================================================
// تعریف پترن‌های پیامکی ملی‌پیامک و ترتیب متغیرهای هر پترن
//
// این فایل عمداً هیچ وابستگی سمت‌سرور (مثل دیتابیس) ندارد تا هم در کلاینت
// (پنل مدیریت) و هم در سرور (سرویس ارسال) قابل import باشد.
//
// ⚠️ نکته کلیدی مستندات ملی‌پیامک:
// در متن پترن از جای‌نگهدارهای ترتیبی استفاده می‌شود: {0} {1} {2} ...
// پس ترتیب مقادیر در آرایه‌ی `variables` باید **دقیقاً** با ترتیب
// جای‌نگهدارها در متنی که در پنل ملی‌پیامک ثبت کرده‌اید یکی باشد.
// ============================================================================

export interface SmsPatternDef {
  /** کلید تنظیمات که کد پترن در آن ذخیره می‌شود */
  settingKey: string;
  /** برچسب فارسی برای نمایش در پنل مدیریت */
  label: string;
  /** نام فنی متغیرها به ترتیب — همان ترتیب {0}، {1}، ... در متن پترن */
  variables: string[];
  /** توضیح فارسی متغیرها به همان ترتیب، برای راهنمایی ادمین */
  hint: string;
}

export const SMS_PATTERNS = {
  OTP: {
    settingKey: "SMS_PATTERN_OTP",
    label: "کد تأیید هویت (OTP)",
    variables: ["code"],
    hint: "کد تأیید → {0}",
  },
  BOOKING_ARTIST: {
    settingKey: "SMS_PATTERN_BOOKING_ARTIST",
    label: "اعلان رزرو جدید (برای هنرمند)",
    variables: ["clientName", "serviceType", "bookingDate", "bookingId"],
    hint: "نام مشتری {0} · نوع سرویس {1} · تاریخ {2} · کد رزرو {3}",
  },
  BOOKING_CLIENT: {
    settingKey: "SMS_PATTERN_BOOKING_CLIENT",
    label: "تأیید رزرو (برای مشتری)",
    variables: ["artistName", "serviceType", "bookingDate", "bookingId"],
    hint: "نام هنرمند {0} · نوع سرویس {1} · تاریخ {2} · کد رزرو {3}",
  },
  BOOKING_CANCEL: {
    settingKey: "SMS_PATTERN_BOOKING_CANCEL",
    label: "لغو رزرو",
    variables: ["bookingId", "reason"],
    hint: "کد رزرو {0} · دلیل {1}",
  },
  NEW_MESSAGE: {
    settingKey: "SMS_PATTERN_NEW_MESSAGE",
    label: "اعلان پیام جدید",
    variables: ["senderName", "messagePreview"],
    hint: "نام فرستنده {0} · خلاصه پیام {1}",
  },
  REGISTER: {
    settingKey: "SMS_PATTERN_REGISTER",
    label: "ثبت‌نام موفق",
    variables: ["name"],
    hint: "نام کاربر {0}",
  },
  RESET_PASSWORD: {
    settingKey: "SMS_PATTERN_RESET_PASSWORD",
    label: "بازیابی رمز عبور",
    variables: ["newPassword"],
    hint: "رمز عبور جدید → {0}",
  },
} satisfies Record<string, SmsPatternDef>;

export type SmsPatternKey = keyof typeof SMS_PATTERNS;

/** لیست پترن‌ها به ترتیبی که در پنل مدیریت نمایش داده می‌شوند */
export const SMS_PATTERN_LIST: SmsPatternDef[] = [
  SMS_PATTERNS.OTP,
  SMS_PATTERNS.BOOKING_ARTIST,
  SMS_PATTERNS.BOOKING_CLIENT,
  SMS_PATTERNS.BOOKING_CANCEL,
  SMS_PATTERNS.NEW_MESSAGE,
  SMS_PATTERNS.REGISTER,
  SMS_PATTERNS.RESET_PASSWORD,
];
