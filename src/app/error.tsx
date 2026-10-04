"use client";

// ============================================================================
// Error Boundary - صفحه خطا
// ============================================================================

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("خطای اپلیکیشن:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="text-center">
        {/* آیکون خطا */}
        <div className="mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
            <svg
              className="h-10 w-10 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* عنوان */}
        <h1 className="mb-4 text-3xl font-bold text-white">
          خطای غیرمنتظره
        </h1>

        {/* توضیح */}
        <p className="mb-8 max-w-md text-zinc-400">
          متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید یا به صفحه اصلی بازگردید.
        </p>

        {/* دکمه‌ها */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-rose-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            تلاش مجدد
          </button>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>

        {/* کد خطا */}
        {error.digest && (
          <p className="mt-8 text-xs text-zinc-600">
            کد خطا: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
