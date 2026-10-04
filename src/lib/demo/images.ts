// ============================================================================
// تصاویر نمایشی — همه محلی، بدون هیچ درخواست بیرونی
// ----------------------------------------------------------------------------
// پیش از این تصاویر نمونه از دامنه‌های بیرونی (pexels/unsplash) می‌آمدند. آن
// دامنه‌ها از ایران بدون فیلترشکن باز نمی‌شوند؛ نتیجه این بود که هر تصویر تا
// تایم‌اوت معلق می‌ماند و صفحه برای کاربران با اینترنت ضعیف چند ده ثانیه کند
// می‌شد. حالا همهٔ تصاویر از دامنهٔ خودِ ورکر و با فرمت WebP سبک سرو می‌شوند.
//
// برای هر عکس سه اندازه موجود است:
//   -32.webp  → ۳۲×۳۲ و کمتر از ۴۰۰ بایت: به‌عنوان تصویر جانشین فوری (LQIP)
//   -400.webp → آواتار و کارت‌های کوچک
//   -800.webp → کارت‌های بزرگ و نمونه‌کارها
// ============================================================================

/** آدرس تصویر نمونهٔ محلی با اندازهٔ دلخواه */
export function demoPhoto(id: string, size: 32 | 400 | 800 = 400): string {
  return `/images/demo/${id}-${size}.webp`;
}

/** نسخهٔ کوچک تصویر (کمتر از ۴۰۰ بایت) برای نمایش فوری پیش از تصویر اصلی */
export function demoPhotoLqip(id: string): string {
  return demoPhoto(id, 32);
}

/** مسیرهای srcset برای تصاویر واکنش‌گرا */
export function demoPhotoSrcSet(id: string): string {
  return `${demoPhoto(id, 400)} 400w, ${demoPhoto(id, 800)} 800w`;
}

/**
 * اگر آدرسی از دامنه‌های بیرونی قدیمی باشد (مثلاً از رکوردهای ذخیره‌شده در
 * نشست نمایشی یا دادهٔ کش‌شده) به مسیر محلی تبدیلش می‌کند.
 */
const LEGACY_REMOTE = /^https:\/\/images\.(pexels|unsplash)\.com\//;
const LEGACY_PHOTO_ID = /photos\/(\d+)\//;

export function localizeDemoImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (LEGACY_REMOTE.test(url)) {
    const match = LEGACY_PHOTO_ID.exec(url);
    if (match) return demoPhoto(match[1], 400);
  }
  return url;
}