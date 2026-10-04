// ============================================================================
// سرویس OTP (رمز یکبار مصرف) - نوبت مارکت
// تولید، ذخیره و ارسال کد تأیید تلفنی
// ============================================================================

import { redis, cacheSet, cacheGet, cacheDel } from "@/lib/redis";
import { REDIS_KEYS, RATE_LIMITS } from "@/constants";

// ============================================================================
// ثابت‌ها
// ============================================================================

/** طول کد OTP */
const OTP_LENGTH = 6;

/** مدت اعتبار کد OTP (ثانیه) - ۵ دقیقه */
const OTP_EXPIRY_SECONDS = 5 * 60;

/** مهلت فاصله بین درخواست‌ها (ثانیه) - ۶۰ ثانیه */
const OTP_COOLDOWN_SECONDS = 60;

/** حداکثر تلاش‌های اشتباه */
const MAX_OTP_ATTEMPTS = 5;

// ============================================================================
// توابع تولید و ذخیره OTP
// ============================================================================

/**
 * تولید کد OTP شش‌رقمی تصادفی
 * از crypto.randomBytes برای ایمنی بالا استفاده می‌کند
 */
export function generateOtp(): string {
  const crypto = require("crypto");
  // تولید یک عدد تصادفی بین 0 تا 999999
  const buffer = crypto.randomBytes(4);
  const randomValue = buffer.readUInt32BE(0);
  const otp = (randomValue % 1_000_000).toString().padStart(OTP_LENGTH, "0");
  return otp;
}

/**
 * کلید Redis برای ذخیره OTP
 */
function getOtpKey(phone: string): string {
  return `${REDIS_KEYS.VERIFY_CODE}${phone}`;
}

/**
 * کلید Redis برای مهلت فاصله بین درخواست‌ها
 */
function getCoolDownKey(phone: string): string {
  return `${REDIS_KEYS.VERIFY_CODE}cooldown:${phone}`;
}

/**
 * کلید Redis برای شمارنده تلاش‌های اشتباه
 */
function getAttemptKey(phone: string): string {
  return `${REDIS_KEYS.VERIFY_CODE}attempts:${phone}`;
}

// ============================================================================
// توابع اصلی
// ============================================================================

/**
 * درخواست کد OTP برای شماره موبایل
 *
 * @param phone - شماره موبایل (فرمت: 09xxxxxxxxx)
 * @returns شیء شامل وضعیت، کد OTP (فقط در dev) و پیام
 */
export async function requestOtp(
  phone: string
): Promise<{ success: boolean; message: string; otp?: string }> {
  try {
    // بررسی مهلت فاصله
    const coolDownKey = getCoolDownKey(phone);
    const coolDown = await redis.get(coolDownKey);
    if (coolDown) {
      return {
        success: false,
        message: "لطفاً چند لحظه صبر کنید و مجدداً تلاش کنید",
      };
    }

    // تولید کد OTP
    const otp = generateOtp();

    // ذخیره در Redis با TTL
    const otpKey = getOtpKey(phone);
    await cacheSet(otpKey, { code: otp, attempts: 0 }, OTP_EXPIRY_SECONDS);

    // تنظیم مهلت فاصله
    await cacheSet(coolDownKey, "1", OTP_COOLDOWN_SECONDS);

    // ریست کردن شمارنده تلاش‌های اشتباه
    const attemptKey = getAttemptKey(phone);
    await redis.del(attemptKey);

    // ────────────────────────────────────────────────────────
    // 🔧 حالت توسعه (Mock Mode) - نمایش کد در console
    // در محیط production، این بخش با ارسال پیامک جایگزین می‌شود
    // ────────────────────────────────────────────────────────
    if (process.env.NODE_ENV === "development") {
      console.log("═══════════════════════════════════════════════════");
      console.log(`📱 کد تأیید نوبت مارکت برای شماره ${phone}:`);
      console.log(`   🔢 کد OTP: ${otp}`);
      console.log(`   ⏰ مدت اعتبار: ${OTP_EXPIRY_SECONDS / 60} دقیقه`);
      console.log("═══════════════════════════════════════════════════");

      return {
        success: true,
        message: `کد تأیید به شماره ${phone} ارسال شد`,
        otp, // فقط در dev mode برمی‌گردانیم
      };
    }

    // ────────────────────────────────────────────────────────
    // 📨 ارسال پیامک واقعی (Production)
    //
    // ارسال از طریق پنل پیامکی ملی‌پیامک انجام می‌شود (src/lib/sms.ts).
    // نام کاربری، رمز عبور و کد پترن OTP در «تنظیمات سیستم ← پنل پیامکی» تعیین می‌شوند.
    //
    // نمونه‌های مرجع سایر سرویس‌دهنده‌ها (در صورت تغییر سرویس):
    //
    // ۱. Kavehnegar (کاوه‌نگار):
    //    const response = await fetch(
    //      `https://api.kavenegar.com/v1/${process.env.KAVEHNEGAR_API_KEY}/verify/lookup.json`,
    //      {
    //        method: "POST",
    //        headers: { "Content-Type": "application/json" },
    //        body: JSON.stringify({
    //          receptor: phone,
    //          template: process.env.KAVEHNEGAR_VERIFY_TEMPLATE,
    //          token: otp,
    //          type: "sms",
    //        }),
    //      }
    //    );
    //
    // ۲. Ghasedak (قاصدک):
    //    const response = await fetch(
    //      "https://api.ghasedak.me/v2/Verification/send/otp",
    //      {
    //        method: "POST",
    //        headers: {
    //          "Content-Type": "application/json",
    //          ApiKey: process.env.GHASEDAK_API_KEY,
    //        },
    //        body: JSON.stringify({
    //          Code: otp,
    //          MobileNumber: phone,
    //          TemplateName: "nobat-market-verify",
    //        }),
    //      }
    //    );
    //
    // ۳. Melipayamak (ملی پیامک):
    //    const response = await fetch(
    //      "https://api.payamak-panel.com/post/Verify.asmx/SendByCellNumber",
    //      {
    //        method: "POST",
    //        headers: { "Content-Type": "application/json" },
    //        body: JSON.stringify({
    //          username: process.env.MELIPAYAMAK_USERNAME,
    //          password: process.env.MELIPAYAMAK_PASSWORD,
    //          text: `کد تأیید نوبت مارکت: ${otp}`,
    //          to: phone,
    //          from: process.env.MELIPAYAMAK_SENDER,
    //        }),
    //      }
    //    );
    // ────────────────────────────────────────────────────────

    const { sendOtpSms } = await import("@/lib/sms");
    const smsResult = await sendOtpSms(phone, otp);

    if (!smsResult.success) {
      console.error("[OTP] ارسال پیامک ناموفق:", phone, smsResult.error);
      return {
        success: false,
        message: "خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید",
      };
    }

    // اگر پیامک در تنظیمات غیرفعال باشد (حالت توسعه)، کد فقط در لاگ سرور چاپ می‌شود
    if (smsResult.messageId === "disabled") {
      console.log(`📱 [DEV] کد تأیید ${phone}: ${otp}`);
    }

    return {
      success: true,
      message: `کد تأیید به شماره ${phone} ارسال شد`,
    };
  } catch (error) {
    console.error("خطا در ارسال کد OTP:", error);
    return {
      success: false,
      message: "خطا در ارسال کد تأیید. لطفاً مجدداً تلاش کنید",
    };
  }
}

/**
 * تأیید کد OTP
 *
 * @param phone - شماره موبایل
 * @param code - کد تأیید وارد شده
 * @returns وضعیت تأیید
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const otpKey = getOtpKey(phone);
    const stored = await cacheGet<{ code: string; attempts: number }>(otpKey);

    // بررسی وجود کد ذخیره شده
    if (!stored) {
      return {
        success: false,
        message: "کد تأیید منقضی شده یا وجود ندارد. لطفاً مجدداً درخواست دهید",
      };
    }

    // بررسی حداکثر تلاش‌های اشتباه
    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      await redis.del(otpKey);
      return {
        success: false,
        message:
          "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً مجدداً کد دریافت کنید",
      };
    }

    // بررسی تطابق کد
    if (stored.code !== code) {
      // افزایش شمارنده تلاش‌های اشتباه
      const updated = { ...stored, attempts: stored.attempts + 1 };
      const remainingTTL = await redis.ttl(otpKey);
      if (remainingTTL > 0) {
        await cacheSet(otpKey, updated, remainingTTL);
      }
      const remainingAttempts = MAX_OTP_ATTEMPTS - updated.attempts;
      return {
        success: false,
        message: `کد تأیید اشتباه است. ${remainingAttempts} تلاش باقی‌مانده`,
      };
    }

    // ✅ کد صحیح - حذف از کش
    await redis.del(otpKey);
    const attemptKey = getAttemptKey(phone);
    await redis.del(attemptKey);

    return {
      success: true,
      message: "کد تأیید صحیح است",
    };
  } catch (error) {
    console.error("خطا در تأیید کد OTP:", error);
    return {
      success: false,
      message: "خطا در تأیید کد. لطفاً مجدداً تلاش کنید",
    };
  }
}

/**
 * پاکسازی OTP‌های منقضی شده (اختیاری - برای اجرا به صورت cron job)
 */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    const keys = await redis.keys(`${REDIS_KEYS.VERIFY_CODE}*`);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0 && !key.includes("cooldown:") && !key.includes("attempts:")) {
        await redis.del(key);
      }
    }
  } catch (error) {
    console.error("خطا در پاکسازی OTP‌ها:", error);
  }
}
