// ============================================================================
// تعیین «مبدأ عمومی» درخواست (Public Origin)
// ============================================================================
//
// ⚠️ چرا لازم است؟
// داخل کانتینر Docker، مقدار `request.url` به آدرسی که سرور روی آن گوش می‌دهد
// تبدیل می‌شود (مثلاً `http://0.0.0.0:3000`)، نه آدرسی که کاربر واقعاً استفاده
// کرده است. اگر ریدایرکت‌ها بر پایه `request.url` ساخته شوند، مرورگر کاربر به
// دامنه/هاستی متفاوت پرت می‌شود و چون کوکی نشست به همان هاست اصلی گره خورده
// است، کاربر به‌شکل غیرمنتظره «وارد نشده» تلقی می‌شود و به صفحه ورود می‌افتد.
//
// راه‌حل: هاست را از هدرهایی بخوانیم که همان چیزی را دارند که مرورگر فرستاده
// (`x-forwarded-host` در حالت پروکسی، در غیر این صورت `host`) و پروتکل را از
// `x-forwarded-proto` بگیریم.
// ============================================================================

interface RequestLike {
  url: string;
  headers: {
    get(name: string): string | null;
  };
}

/** اولین مقدار یک هدر چندمقداری (پروکسی‌ها ممکن است لیست بفرستند) */
function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first ? first : null;
}

/**
 * مبدأ عمومی درخواست، مثلاً `https://nobat-market.com` یا `http://localhost:3000`.
 * ترتیب اولویت: هدرهای پروکسی ← هدر Host ← مبدأ خود request.url
 */
export function getPublicOrigin(request: RequestLike): string {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));

  let fallbackProtocol = "http";
  try {
    fallbackProtocol = new URL(request.url).protocol.replace(":", "") || "http";
  } catch {
    // اگر request.url نامعتبر بود، پیش‌فرض http
  }

  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto || fallbackProtocol;

  if (host) {
    return `${protocol}://${host}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return `${protocol}://localhost:3000`;
  }
}

/**
 * ساخت آدرس مطلق بر پایه مبدأ عمومی درخواست.
 * `pathname` باید با «/» شروع شود.
 */
export function publicUrl(request: RequestLike, pathname: string): URL {
  try {
    return new URL(pathname, getPublicOrigin(request));
  } catch {
    return new URL(request.url);
  }
}
