// ============================================================================
// خواندن تنظیمات سیستم در سمت سرور (Node runtime)
// ----------------------------------------------------------------------------
// چرا این ماژول لازم است؟
// پنل ادمین اجازه می‌دهد مقادیری مثل «درصد بیعانه»، «حداکثر حجم آپلود» و
// «عنوان سئو» تنظیم شوند. اگر کد این مقادیر را نخواند، ادمین فکر می‌کند
// تنظیمش اعمال شده ولی رفتار سیستم ثابت و هاردکد باقی می‌ماند.
// این ماژول تنها مرجع خواندن تنظیمات در سمت سرور است.
//
// اولویت: تنظیمات دیتابیس ← مقدار پیش‌فرض کد
// نکته: کش کوتاه (۵ ثانیه) گذاشته شده تا در هر رندر یک کوئری تکراری نزنیم،
// ولی تغییر ادمین هم تقریباً بلافاصله اعمال شود.
// ============================================================================

import { db } from "@/lib/db";

/** مدت اعتبار کش (میلی‌ثانیه) */
const CACHE_TTL_MS = 5_000;

let cache: Record<string, string> = {};
let lastFetch = 0;
let inflight: Promise<Record<string, string>> | null = null;

/**
 * همه تنظیمات را می‌خواند (با کش کوتاه).
 * در صورت خطای دیتابیس، آخرین مقادیر کش‌شده برگردانده می‌شود تا صفحه از کار نیفتد.
 */
export async function readSystemSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL_MS && Object.keys(cache).length > 0) {
    return cache;
  }
  // جلوگیری از چند کوئری هم‌زمان در یک رندر
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const rows = await db.systemSetting.findMany({
        select: { key: true, value: true },
      });
      const next: Record<string, string> = {};
      for (const r of rows) next[r.key] = r.value;
      cache = next;
      lastFetch = Date.now();
    } catch (err) {
      console.error("خطا در خواندن تنظیمات سیستم:", err);
    } finally {
      inflight = null;
    }
    return cache;
  })();

  return inflight;
}

/** ابطال کش — بعد از ذخیره تنظیمات توسط ادمین صدا زده می‌شود */
export function revalidateSettings(): void {
  lastFetch = 0;
}

/** یک تنظیم متنی؛ اگر خالی یا نبود، مقدار پیش‌فرض */
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const all = await readSystemSettings();
  const value = all[key];
  return value !== undefined && value !== "" ? value : fallback;
}

/** یک تنظیم عددی با محدودسازی بازه (برای جلوگیری از مقدار مخرب در دیتابیس) */
export async function getNumberSetting(
  key: string,
  fallback: number,
  opts: { min?: number; max?: number } = {}
): Promise<number> {
  const raw = await getSetting(key, "");
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed)) return fallback;
  const min = opts.min ?? Number.NEGATIVE_INFINITY;
  const max = opts.max ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(parsed, min), max);
}

/** یک تنظیم بولی */
export async function getBoolSetting(key: string, fallback: boolean): Promise<boolean> {
  const raw = (await getSetting(key, "")).trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}
