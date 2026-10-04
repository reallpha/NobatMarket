/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// جایگزین «next-auth/providers/credentials» در نسخهٔ پیش‌نمایش
//
// این پروفایدر در نسخهٔ اصلی کاربر را با شماره موبایل و رمز عبور بررسی می‌کرد.
// اینجا فقط یک تعریف ساده است تا فایل‌های پیکربندی بدون خطا بارگذاری شوند.
// ============================================================================

export default function Credentials(config?: any) {
  return {
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    credentials: {},
    ...config,
  };
}
