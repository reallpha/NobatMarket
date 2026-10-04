"use client";

// ============================================================================
// صفحه ورود — نوبت مارکت (نسخهٔ پیش‌نمایش)
//
// تفاوت با نسخهٔ اصلی فقط در این است که اینجا هیچ اعتباری بررسی نمی‌شود:
// کاربر نقش موردنظر (مشتری / هنرمند / مدیر) را انتخاب می‌کند و با یک کلیک
// وارد همان پنل می‌شود. اطلاعات هر نقش از قبل پر می‌شود تا تست سریع باشد.
// ============================================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/features/auth/AuthShell";
import {
  AuthAlert,
  Field,
  PhoneField,
  PasswordField,
  SubmitButton,
} from "@/components/features/auth/AuthFields";
import { signInWithCredentials } from "@/services/auth.service";

type DemoRole = "CLIENT" | "ARTIST" | "ADMIN";

const DEMO_LOGINS: Record<DemoRole, { phone: string; password: string; label: string }> = {
  CLIENT: { phone: "09121111111", password: "demo1234", label: "مشتری" },
  ARTIST: { phone: "09132222222", password: "demo1234", label: "هنرمند" },
  ADMIN: { phone: "09991234567", password: "demo1234", label: "مدیر" },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>("CLIENT");
  const [phone, setPhone] = useState(DEMO_LOGINS.CLIENT.phone);
  const [password, setPassword] = useState(DEMO_LOGINS.CLIENT.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setRegisteredRole(params.get("role"));
      const requestedRole = params.get("role");
      if (requestedRole === "ARTIST" || requestedRole === "CLIENT") {
        setRole(requestedRole as DemoRole);
        setPhone(DEMO_LOGINS[requestedRole as DemoRole].phone);
        setPassword(DEMO_LOGINS[requestedRole as DemoRole].password);
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("registered");
      url.searchParams.delete("role");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("reset") === "sent") {
      setResetSent(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const selectRole = (next: DemoRole) => {
    setRole(next);
    setPhone(DEMO_LOGINS[next].phone);
    setPassword(DEMO_LOGINS[next].password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/[\s\-()+]/g, "").trim();
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError("شماره موبایل را درست وارد کنید (مثل 09123456789)");
      return;
    }
    if (!password) {
      setError("رمز عبور را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithCredentials({ phone: cleanPhone, password, role });
      if (!result.success) {
        setError(result.message || "شماره موبایل یا رمز عبور اشتباه است");
        return;
      }
      router.push(result.data?.redirectUrl || "/client/dashboard");
      router.refresh();
    } catch {
      setError("مشکلی پیش آمد، دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="login"
      icon={
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      }
      title="ورود به حساب"
      subtitle="با شماره موبایل و رمز عبور وارد شوید"
      footer={
        <>
          حساب ندارید؟{" "}
          <Link href="/register" className="font-bold text-amber-400 hover:text-amber-300 transition-colors">
            ثبت‌نام کنید
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {registeredRole && (
          <AuthAlert type="success">
            {registeredRole === "ARTIST"
              ? "حساب شما ساخته شد. وارد شوید و پروفایل را کامل کنید."
              : "ثبت‌نام انجام شد. حالا وارد شوید."}
          </AuthAlert>
        )}

        {resetSent && (
          <AuthAlert type="success">رمز جدید پیامک شد. با همان رمز وارد شوید.</AuthAlert>
        )}

        {error && <AuthAlert type="error">{error}</AuthAlert>}

        {/* ─── انتخاب نقش برای ورود آزمایشی ─── */}
        <div>
          <label className="mb-2 flex items-center justify-between text-[13px] font-bold text-zinc-200">
            <span>ورود به‌عنوان</span>
            <span className="text-[11px] font-normal text-zinc-500">حالت پیش‌نمایش</span>
          </label>
          <div
            className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5"
            role="radiogroup"
            aria-label="نوع حساب"
          >
            {(["CLIENT", "ARTIST", "ADMIN"] as DemoRole[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => selectRole(r)}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-all sm:text-[13px] ${
                  role === r
                    ? "bg-gradient-to-l from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {DEMO_LOGINS[r].label}
              </button>
            ))}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-zinc-500">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 8h.01M11 12h1v4h1" />
            </svg>
            این نسخه پیش‌نمایش است؛ اطلاعات از قبل پر شده و نیازی به رمز واقعی نیست.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="شماره موبایل">
            <PhoneField value={phone} onChange={setPhone} />
          </Field>

          <div>
            <Field label="رمز عبور">
              <PasswordField value={password} onChange={setPassword} placeholder="رمز عبور" />
            </Field>
            <div className="mt-2 text-left" dir="ltr">
              <Link href="/forgot-password" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                رمز عبور را فراموش کرده‌ام
              </Link>
            </div>
          </div>

          <SubmitButton loading={loading} loadingText="در حال ورود...">
            ورود
          </SubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
