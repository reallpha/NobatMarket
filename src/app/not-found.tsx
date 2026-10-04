import Link from "next/link";

// ============================================================================
// صفحه ۴۰۴ - یافت نشد
// ============================================================================

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="text-center">
        {/* شماره ۴۰۴ */}
        <div className="mb-8">
          <span className="text-[120px] font-bold leading-none text-zinc-800">
            ۴۰۴
          </span>
        </div>

        {/* عنوان */}
        <h1 className="mb-4 text-3xl font-bold text-white">
          صفحه یافت نشد
        </h1>

        {/* توضیح */}
        <p className="mb-8 max-w-md text-zinc-400">
          صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
        </p>

        {/* دکمه */}
        <Link
          href="/"
          className="inline-block rounded-lg bg-rose-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
