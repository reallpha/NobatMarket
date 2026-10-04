// ============================================================================
// هدر برند شیک صفحات ورود / ثبت‌نام - نوبت مارکت
// آیکون هر صفحه متفاوت است: ورود = سپر امن | ثبت‌نام = ساخت حساب
// (بدون تکرار نام برند — هدر سایت نام دارد)
// ============================================================================

type Variant = "login" | "register";

export function AuthBrand({
  variant = "login",
  subtitle = "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران",
}: {
  variant?: Variant;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      {/* لوگو */}
      <div className="relative">
        {/* هاله نور */}
        <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-2xl" aria-hidden="true" />
        {/* حلقه خارجی */}
        <div className="absolute -inset-2 rounded-full border border-amber-500/15" aria-hidden="true" />
        <div className="absolute -inset-2 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-amber-500/10" aria-hidden="true" />

        {/* دایره آیکون */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-amber-600/5 shadow-[0_0_50px_-10px_rgba(245,158,11,0.45)] backdrop-blur-xl sm:h-24 sm:w-24">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent" aria-hidden="true" />

          {variant === "login" ? (
            /* ── ورود: سپر امن با سوراخ کلید (ورود امن و حرفه‌ای) ── */
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative h-9 w-9 text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.55)] sm:h-10 sm:w-10"
              aria-hidden="true"
            >
              {/* بدنه سپر */}
              <path d="M12 2.6l7.2 2.7v5.4c0 4.7-3 8.6-7.2 10.1-4.2-1.5-7.2-5.4-7.2-10.1V5.3L12 2.6z" />
              {/* سوراخ کلید */}
              <circle cx="12" cy="10.2" r="1.9" />
              <path d="M12 12.1v3.2" strokeWidth={2} />
            </svg>
          ) : (
            /* ── ثبت‌نام: ساخت حساب جدید + درخشش ── */
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative h-9 w-9 text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.55)] sm:h-10 sm:w-10"
              aria-hidden="true"
            >
              {/* سر کاربر */}
              <circle cx="10" cy="7.6" r="3.1" />
              {/* بدن کاربر */}
              <path d="M3.6 20.4v-1.2a5.6 5.6 0 0 1 5.6-5.6h1.6a5.6 5.6 0 0 1 4.5 2.3" />
              {/* علامت + */}
              <path d="M18.4 12.2v5.6M15.6 15h5.6" strokeWidth={1.9} />
            </svg>
          )}
        </div>
      </div>

      {/* زیرنویس */}
      <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-px w-8 bg-gradient-to-l from-amber-500/40 to-transparent" aria-hidden="true" />
        {subtitle}
        <span className="h-px w-8 bg-gradient-to-r from-amber-500/40 to-transparent" aria-hidden="true" />
      </div>
    </div>
  );
}
