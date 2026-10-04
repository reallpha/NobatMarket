// ============================================================================
// محدودسازی نرخ درخواست (Rate Limiting)
// ============================================================================
//
// ⚠️ MVP: از فروشگاه In-Memory استفاده می‌شود.
// ⚠️ Production: از Redis (Upstash Rate Limit) استفاده کنید.
//
// الگوی Upstash:
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
// const ratelimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(10, "10 s"),
// });
// ============================================================================

// ============================================================================
// فروشگاه In-Memory
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// ─── پاکسازی خودکار هر ۶۰ ثانیه ───
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

// ============================================================================
// تابع Rate Limit
// ============================================================================

interface RateLimitConfig {
  /** حداکثر تعداد درخواست */
  maxRequests: number;
  /** بازه زمانی (میلی‌ثانیه) */
  windowMs: number;
  /** پیام خطا */
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * بررسی محدودیت نرخ درخواست
 *
 * @param key - شناسه یکتا (مثلاً IP یا userId)
 * @param config - پیکربندی محدودیت
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // ─── پنجره جدید ───
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    // ─── محدودیت رد شد ───
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // ─── افزایش شمارنده ───
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// ============================================================================
// پیکربندی‌های آماده
// ============================================================================

export const RATE_LIMITS = {
  /** درخواست‌های احراز هویت: ۱۰ درخواست در ۱۵ دقیقه */
  AUTH: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    message: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید.",
  },
  /** درخواست OTP: ۵ درخواست در ۵ دقیقه */
  OTP: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000,
    message: "تعداد ارسال کد تأیید بیش از حد مجاز است. لطفاً ۵ دقیقه صبر کنید.",
  },
  /** پیام‌رسانی: ۳۰ پیام در دقیقه */
  MESSAGING: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: "تعداد پیام‌های شما بیش از حد مجاز است.",
  },
  /** آپلود: ۲۰ درخواست در ۱۰ دقیقه */
  UPLOAD: {
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    message: "تعداد آپلودهای شما بیش از حد مجاز است.",
  },
  /** API عمومی: ۶۰ درخواست در دقیقه */
  API_GENERAL: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: "تعداد درخواست‌های شما بیش از حد مجاز است.",
  },
  /** پرداخت: ۵ درخواست در ۱۰ دقیقه */
  PAYMENT: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
    message: "تعداد درخواست‌های پرداخت بیش از حد مجاز است.",
  },
} as const;

// ============================================================================
// Helper: اعمال Rate Limit در Server Actions
// ============================================================================

/**
 * بررسی و اعمال Rate Limit
 * اگر محدودیت رد شد، خطا برمی‌گرداند
 */
export function enforceRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; error: string } {
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    console.warn(
      `🚨 Rate limit exceeded: ${identifier} (${config.maxRequests}/${config.windowMs}ms)`
    );
    return {
      allowed: false,
      error: config.message || "تعداد درخواست‌های شما بیش از حد مجاز است.",
    };
  }

  return { allowed: true };
}
