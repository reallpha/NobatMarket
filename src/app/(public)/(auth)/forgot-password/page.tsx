"use client";

// ============================================================================
// صفحه فراموشی رمز عبور — ساده و واضح
// شماره موبایل → دریافت رمز جدید با پیامک → ورود
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/AuthShell";
import {
  AuthAlert,
  Field,
  PhoneField,
  SubmitButton,
} from "@/components/features/auth/AuthFields";
import { requestPasswordReset } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devPassword, setDevPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/[\s\-()+]/g, "").trim();
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError("شماره موبایل را درست وارد کنید (مثل 09123456789)");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset({ phone: cleanPhone });
      if (!result.success) {
        setError(result.message || "ارسال انجام نشد");
        return;
      }
      setDevPassword(result.data?.devPassword ?? null);
      setDone(true);
    } catch {
      setError("مشکلی پیش آمد، دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="forgot"
      icon={
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      }
      title="فراموشی رمز عبور"
      subtitle="شماره موبایل را وارد کنید تا رمز جدید پیامک شود"
      footer={
        <>
          <Link href="/login" className="font-bold text-amber-400 hover:text-amber-300">
            بازگشت به ورود
          </Link>
        </>
      }
    >
      {!done ? (
        <div className="space-y-4">
          {error && <AuthAlert type="error">{error}</AuthAlert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="شماره موبایل">
              <PhoneField value={phone} onChange={setPhone} autoFocus />
            </Field>

            <SubmitButton loading={loading} loadingText="در حال ارسال...">
              ارسال رمز جدید
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <AuthAlert type="success">
            رمز جدید به شماره <span dir="ltr" className="font-bold">{phone}</span> پیامک شد. با همان رمز وارد شوید.
          </AuthAlert>

          {devPassword && (
            <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/[0.06] px-4 py-3 text-center">
              <p className="text-[11px] text-amber-300/80">حالت توسعه — رمز جدید:</p>
              <p dir="ltr" className="mt-1 font-mono text-xl font-black tracking-[0.25em] text-amber-300">{devPassword}</p>
            </div>
          )}

          <Link
            href="/login?reset=sent"
            className="block rounded-2xl bg-gradient-to-l from-amber-400 via-yellow-500 to-amber-500 px-4 py-3.5 text-center text-sm font-black text-zinc-950 hover:brightness-110"
          >
            رفتن به صفحه ورود
          </Link>

          <button
            type="button"
            onClick={() => setDone(false)}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            شماره را اشتباه وارد کردم
          </button>
        </div>
      )}
    </AuthShell>
  );
}
