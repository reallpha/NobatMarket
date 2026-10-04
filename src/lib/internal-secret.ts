// ============================================================================
// راز مشترک مسیرهای داخلی (internal API)
// ----------------------------------------------------------------------------
// مسیر /api/internal/settings فقط باید توسط خود سرور (middleware) صدا زده شود،
// نه مرورگر کاربر. middleware روی Edge اجرا می‌شود و نمی‌تواند مستقیم به
// دیتابیس وصل شود، پس تنظیمات را از این مسیر داخلی می‌خواند. برای اینکه این
// مسیر عمومی نباشد، درخواست باید هدر مخفی زیر را داشته باشد.
//
// این مقدار فقط روی سرور وجود دارد و هرگز به مرورگر فرستاده نمی‌شود.
// ============================================================================

/** نام هدری که درخواست‌های داخلی باید ارسال کنند */
export const INTERNAL_SECRET_HEADER = "x-internal-secret";

/**
 * راز داخلی: اول متغیر اختصاصی، در غیر این صورت NEXTAUTH_SECRET.
 * اگر مقدار امنی تنظیم نشده باشد null برمی‌گرداند تا مسیر «بسته» بماند
 * (fail-closed) و به‌جای نشت داده، در دسترس نبودن را انتخاب کنیم.
 */
export function getInternalSecret(): string | null {
  const secret =
    process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET || "";
  return secret.length >= 16 ? secret : null;
}

/** آیا این درخواست از داخل خود سرور آمده است؟ */
export function isAuthorizedInternalCall(headerValue: string | null): boolean {
  const secret = getInternalSecret();
  if (!secret) return false;
  return headerValue === secret;
}
