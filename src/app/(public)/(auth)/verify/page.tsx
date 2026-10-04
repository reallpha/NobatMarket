"use client";

// ============================================================================
// صفحه تأیید کد OTP - دارک مود
// ============================================================================

export default function VerifyPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
              <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              تأیید شماره موبایل
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              کد ۶ رقمی ارسال شده به شماره خود را وارد کنید
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">
                کد تأیید
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="۱۲۳۴۵۶"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-center text-lg tracking-[0.5em] text-white outline-none transition-colors focus:border-rose-500/50"
                dir="ltr"
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-500"
            >
              تأیید و ورود
            </button>
          </form>

          <div className="mt-6 text-center">
            <button className="text-sm text-zinc-500 transition-colors hover:text-white">
              ارسال مجدد کد
            </button>
            <p className="mt-1 text-xs text-zinc-600">
              تا ارسال مجدد کد ۶۰ ثانیه صبر کنید
            </p>
          </div>

          <div className="mt-4 text-center text-sm text-zinc-500">
            <a href="/login" className="text-rose-400 hover:text-rose-300">
              تغییر شماره موبایل
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
