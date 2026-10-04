"use client";

// ============================================================================
// صفحه ثبت‌نام — نوبت مارکت
// ============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/AuthShell";
import {
  AuthAlert,
  Field,
  PhoneField,
  PasswordField,
  TextField,
  SubmitButton,
} from "@/components/features/auth/AuthFields";
import { registerUser } from "@/services/auth.service";

type Role = "CLIENT" | "ARTIST";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (displayName.trim().length < 2) {
      setError("نام خود را وارد کنید");
      return;
    }
    const cleanPhone = phone.replace(/[\s\-()+]/g, "").trim();
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError("شماره موبایل را درست وارد کنید (مثل 09123456789)");
      return;
    }
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (password !== confirmPassword) {
      setError("تکرار رمز عبور درست نیست");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        phone: cleanPhone,
        password,
        confirmPassword,
        displayName: displayName.trim(),
        role,
      });
      if (!result.success) {
        setError(result.message || "ثبت‌نام انجام نشد");
        return;
      }
      router.push(`/login?registered=true&role=${role}`);
    } catch {
      setError("مشکلی پیش آمد، دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="register"
      icon={
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      }
      title="ساخت حساب جدید"
      subtitle="فقط با شماره موبایل، کمتر از یک دقیقه"
      footer={
        <>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="font-bold text-amber-400 hover:text-amber-300 transition-colors">
            ورود
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {error && <AuthAlert type="error">{error}</AuthAlert>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="نام">
            <TextField
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="نام شما"
              autoComplete="nickname"
              maxLength={100}
            />
          </Field>

          <Field label="شماره موبایل">
            <PhoneField value={phone} onChange={setPhone} />
          </Field>

          <Field label="رمز عبور">
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="حداقل ۸ کاراکتر"
              autoComplete="new-password"
            />
          </Field>

          <Field label="تکرار رمز عبور">
            <PasswordField
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="رمز را دوباره وارد کنید"
              autoComplete="new-password"
            />
          </Field>

          <Field label="نوع حساب کاربری">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5" role="radiogroup" aria-label="نوع حساب">
              {(["CLIENT", "ARTIST"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg px-4 py-2.5 text-[13px] font-bold transition-all ${
                    role === r
                      ? "bg-gradient-to-l from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {r === "CLIENT" ? "مشتری هستم" : "هنرمند هستم"}
                </button>
              ))}
            </div>
            {role === "ARTIST" && (
              <p className="mt-2 text-xs leading-6 text-zinc-500" dir="rtl">
                حساب هنرمند بعد از تأیید مدیریت فعال می‌شود.
              </p>
            )}
          </Field>

          <SubmitButton loading={loading} loadingText="در حال ثبت‌نام...">
            ثبت‌نام
          </SubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
