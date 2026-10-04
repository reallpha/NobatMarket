// ============================================================================
// کش ساده تنظیمات سیستم
//
// در نسخهٔ اصلی، middleware روی Edge اجرا می‌شد و مجبور بود تنظیمات را از یک
// مسیر داخلی HTTP بخواند. در نسخهٔ پیش‌نمایش، منبع داده درون خود پروسه است و
// بدون هیچ درخواست شبکه‌ای خوانده می‌شود (با کش کوتاه ۱۵ ثانیه‌ای).
// ============================================================================

import { db } from "@/lib/db";

let cachedSettings: Record<string, string> = {};
let lastFetch = 0;
const CACHE_TTL = 15 * 1000;

async function loadSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(cachedSettings).length > 0) {
    return cachedSettings;
  }
  try {
    const rows = await db.systemSetting.findMany({ select: { key: true, value: true } });
    const next: Record<string, string> = {};
    for (const row of rows as { key: string; value: string }[]) next[row.key] = row.value;
    cachedSettings = next;
    lastFetch = now;
  } catch {
    // در صورت خطا، مقادیر کش‌شدهٔ قبلی برگردانده می‌شود
  }
  return cachedSettings;
}

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  const settings = await loadSettings();
  const value = settings[key];
  return value !== undefined ? value : defaultValue;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await loadSettings();
  const results: Record<string, string> = {};
  for (const key of keys) results[key] = settings[key] ?? "";
  return results;
}

/** ابطال کش پس از ذخیرهٔ تنظیمات توسط ادمین */
export function revalidateSettingCache(): void {
  lastFetch = 0;
}
