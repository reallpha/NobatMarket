// ============================================================================
// خواندن تنظیمات عمومی در سمت کلاینت
// ----------------------------------------------------------------------------
// کامپوننت‌های کلاینت (مثل پیشخوان رزرو) نمی‌توانند مستقیم دیتابیس را بخوانند،
// ولی برای نمایش درست مبلغ بیعانه و محدودیت آپلود باید همان مقادیر پنل ادمین
// را بدانند. این ماژول یک‌بار /api/public/settings را می‌خواند و نتیجه را
// در حافظه نگه می‌دارد تا همه کامپوننت‌ها یک درخواست مشترک داشته باشند.
// ============================================================================

type PublicSettings = Record<string, string>;

let inflight: Promise<PublicSettings> | null = null;

/** دریافت تنظیمات عمومی (یک بار برای هر بارگذاری صفحه) */
export function fetchPublicSettings(): Promise<PublicSettings> {
  if (!inflight) {
    inflight = fetch("/api/public/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const s = data?.settings;
        return (s && typeof s === "object" ? s : {}) as PublicSettings;
      })
      .catch(() => ({}) as PublicSettings);
  }
  return inflight;
}

/** درصد بیعانه تنظیم‌شده توسط ادمین (۰ تا ۱۰۰) */
export async function getDepositPercentClient(fallback = 20): Promise<number> {
  const s = await fetchPublicSettings();
  const n = Number(s.DEPOSIT_PERCENT);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 0), 100);
}

export type ClientUploadLimits = {
  /** حداکثر حجم فایل به بایت */
  maxBytes: number;
  /** فهرست MIME typeهای مجاز */
  allowedTypes: string[];
  /** حداکثر حجم به مگابایت (برای پیام خطا) */
  maxMb: number;
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * محدودیت‌های آپلود تصویر طبق تنظیمات ادمین.
 * پیش از این مقدار ۱۰ مگابایت و فهرست نوع فایل در کد هاردکد بود و تنظیم
 * «حداکثر حجم آپلود» ادمین هیچ اثری نداشت.
 */
export async function getUploadLimitsClient(): Promise<ClientUploadLimits> {
  const s = await fetchPublicSettings();

  const mb = Number(s.MAX_UPLOAD_SIZE_MB);
  const maxMb = Number.isFinite(mb) && mb > 0 ? mb : 10;

  const raw = (s.ALLOWED_IMAGE_TYPES || "jpg,jpeg,png,webp")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const allowedTypes = raw
    .map((ext) => EXT_TO_MIME[ext.replace(/^\./, "")])
    .filter((m): m is string => Boolean(m));

  return {
    maxBytes: maxMb * 1024 * 1024,
    maxMb,
    allowedTypes:
      allowedTypes.length > 0
        ? Array.from(new Set(allowedTypes))
        : Object.values(EXT_TO_MIME).slice(0, 4),
  };
}

/** حداکثر حجم مجاز تصویر به مگابایت (تنظیمات ادمین) */
export async function getImageMaxMb(fallback = 10): Promise<number> {
  const limits = await getUploadLimitsClient();
  return limits.maxMb > 0 ? limits.maxMb : fallback;
}

/** فقط برای تست/توسعه: پاک کردن کش ماژول */
export function resetPublicSettingsCache(): void {
  inflight = null;
}
