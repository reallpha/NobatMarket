// ============================================================================
// اجزای فرم احراز هویت — فیلدها، دکمه، هشدار، قدرت رمز
// راستچین اصولی برای فارسی
// ============================================================================

"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

// ─── هشدار ───
export function AuthAlert({
  type,
  children,
}: {
  type: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-500/25 bg-red-500/[0.08] text-red-300",
    success: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300",
    info: "border-sky-500/25 bg-sky-500/[0.08] text-sky-300",
  } as const;
  const icons = {
    error: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  } as const;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`animate-scale-in flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13px] leading-7 ${styles[type]}`}
    >
      {icons[type]}
      <span className="flex-1">{children}</span>
    </div>
  );
}

// ─── برچسب + راهنما ───
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div dir="rtl">
      <label htmlFor={htmlFor} className="mb-2 flex items-center justify-between text-[13px] font-bold text-zinc-200">
        <span>{label}</span>
        {hint && <span className="text-[11px] font-normal text-zinc-500">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── استایل پایه فیلدها (راستچین) ───
const inputBase =
  "w-full rounded-xl border bg-white/[0.06] py-2.5 pr-11 pl-4 text-[14px] text-white placeholder-zinc-500 outline-none backdrop-blur-md transition-all duration-200 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

// ─── فیلد موبایل (LTR برای اعداد) ───
export function PhoneField({
  value,
  onChange,
  autoFocus,
  id = "phone",
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  id?: string;
}) {
  return (
    <div className="relative" dir="rtl">
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="username"
        dir="ltr"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder="09123456789"
        className={`${inputBase} border-white/[0.08] text-left tracking-[0.12em] placeholder:tracking-normal focus:border-amber-500/60 focus:ring-amber-500/15`}
      />
    </div>
  );
}

// ─── فیلد رمز عبور با چشمک ───
export function PasswordField({
  value,
  onChange,
  placeholder = "رمز عبور خود را وارد کنید",
  id = "password",
  autoComplete = "current-password",
  showStrength = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div dir="rtl">
      <div className="relative">
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="rtl"
          className={`${inputBase} border-white/[0.08] focus:border-amber-500/60 focus:ring-amber-500/15`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
        >
          {show ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {showStrength && value.length > 0 && <StrengthMeter password={value} />}
    </div>
  );
}

// ─── قدرت رمز ───
export function StrengthMeter({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-ZԱ-Ֆآ-ی]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const level = Math.min(score, 4);
  const labels = ["خیلی ضعیف", "ضعیف", "متوسط", "قوی", "عالی"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];
  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= level ? colors[level] : "bg-zinc-800"}`} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-500" dir="rtl">
        قدرت رمز: <span className="font-bold text-zinc-300">{labels[level]}</span>
        {password.length < 8 && " — حداقل ۸ کاراکتر"}
      </p>
    </div>
  );
}

// ─── فیلد متنی عمومی (راستچین) ───
export function TextField({
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <div className="relative" dir="rtl">
      {icon && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
      )}
      <input
        {...props}
        dir="rtl"
        className={`${inputBase} border-white/[0.08] focus:border-amber-500/60 focus:ring-amber-500/15 ${icon ? "" : "!pr-4"} ${
          props.className ?? ""
        }`}
      />
    </div>
  );
}

// ─── دکمه ارسال ───
export function SubmitButton({
  loading,
  children,
  loadingText,
}: {
  loading: boolean;
  children: ReactNode;
  loadingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-amber-500 via-rose-500 to-rose-600 px-6 py-3.5 text-[15px] font-black text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/30 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
      <span className="relative inline-flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {loadingText}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
