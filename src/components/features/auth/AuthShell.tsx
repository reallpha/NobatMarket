// ============================================================================
// پوسته صفحات احراز هویت — نوبت مارکت
// کارت روشن‌تر با پالت کهربایی/صورتی
// ============================================================================

import Link from "next/link";
import type { ReactNode } from "react";

export type AuthVariant = "login" | "register" | "forgot";

export function AuthShell({
  icon,
  title,
  subtitle,
  children,
  footer,
}: {
  variant: AuthVariant;
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-6 sm:pt-10 sm:pb-6">
      <div className="relative mx-auto w-full max-w-md">
        {/* کارت اصلی */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-6">
          {/* هدر آیکون + عنوان */}
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="relative">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-rose-500/10 text-amber-400">
                {icon}
              </span>
            </div>
            <h1 className="mt-4 text-xl font-black text-white sm:text-2xl">{title}</h1>
            <p className="mt-1.5 text-[13px] leading-6 text-zinc-400">{subtitle}</p>
          </div>

          {/* محتوای فرم */}
          <div>{children}</div>

          {/* فوتر لینک‌ها */}
          {footer && (
            <div className="mt-4 border-t border-white/[0.06] pt-3.5 text-center text-[13px] text-zinc-400">
              {footer}
            </div>
          )}
        </div>

        {/* قوانین */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>ورود شما به معنای پذیرش</span>
          <Link href="/terms" className="font-medium text-amber-400/80 hover:text-amber-300 transition-colors">
            قوانین
          </Link>
          <span>و</span>
          <Link href="/privacy" className="font-medium text-amber-400/80 hover:text-amber-300 transition-colors">
            حریم خصوصی
          </Link>
          <span>است</span>
        </div>
      </div>
    </div>
  );
}
