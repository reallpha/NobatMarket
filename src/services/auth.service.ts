"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// سرویس احراز هویت — نسخهٔ پیش‌نمایش (بدون پایگاه داده)
//
// در نسخهٔ اصلی این فایل رمز عبور را با bcrypt مقایسه می‌کرد، کاربر را از
// پایگاه داده می‌خواند و توکن Auth.js می‌ساخت. در نسخهٔ پیش‌نمایش هیچ‌کدام لازم
// نیست: هر شماره و رمزی پذیرفته می‌شود و نقش انتخاب‌شدهٔ کاربر، تعیین می‌کند
// وارد کدام پنل شود. امضای توابع و شکل پاسخ‌ها دقیقاً مثل نسخهٔ اصلی است تا
// صفحه‌های ورود/ثبت‌نام/فراموشی رمز بدون تغییر کار کنند.
// ============================================================================

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  DEMO_ACCOUNTS,
  decodeSession,
  encodeSession,
  redirectForRole,
  DEMO_COOKIE,
  type DemoRole,
  type DemoSessionUser,
} from "@/lib/demo/session";
import type { ApiResponse } from "@/types";

// ─── توابع کمکی ──────────────────────────────────────────────────────────────

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string, errors?: Record<string, string[]>): ApiResponse<never> {
  return { success: false, message, errors } as ApiResponse<never>;
}

const ROLE_LABELS: Record<DemoRole, string> = {
  CLIENT: "مشتری",
  ARTIST: "هنرمند",
  ADMIN: "مدیر",
};

function normalizeRole(input?: string | null): DemoRole {
  const value = (input || "").toUpperCase();
  if (value === "ARTIST" || value === "ADMIN") return value as DemoRole;
  return "CLIENT";
}

async function setDemoSession(user: DemoSessionUser): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeSession(user), {
    path: "/",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });
}

// ============================================================================
// ورود — در پیش‌نمایش: هر شماره و رمزی پذیرفته می‌شود
// ============================================================================

export async function signInWithCredentials(data: {
  phone: string;
  password: string;
  role?: string;
}): Promise<ApiResponse<{ redirectUrl: string }>> {
  const phone = (data.phone || "").replace(/[\s\-()+]/g, "").trim();

  if (!phone) return error("شماره موبایل را وارد کنید");
  if (!data.password) return error("رمز عبور را وارد کنید");

  const role = normalizeRole(data.role);
  const base = DEMO_ACCOUNTS[role];

  // اگر شماره با یکی از حساب‌های نمونهٔ همان نقش مطابق بود، همان حساب باز می‌شود
  let account = base;
  try {
    const matched = (await db.user.findUnique({
      where: { phone },
      select: { id: true, displayName: true, role: true, status: true, avatarUrl: true },
    })) as any;
    if (matched && matched.role === role) {
      account = {
        ...base,
        id: matched.id,
        name: matched.displayName || base.name,
        status: matched.status || base.status,
        avatarUrl: matched.avatarUrl || base.avatarUrl,
      };
    } else {
      // شماره دلخواه: نشست با همان نقش اما با نام انتخابی ساخته می‌شود
      account = { ...base, phone, name: base.name };
    }
  } catch {
    account = { ...base, phone };
  }

  await setDemoSession(account);

  return success(`ورود به‌عنوان ${ROLE_LABELS[role]} انجام شد`, {
    redirectUrl: redirectForRole(role),
  });
}

// ============================================================================
// ثبت‌نام — در پیش‌نمایش: همیشه موفق
// ============================================================================

export async function registerUser(formData: {
  phone: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
  role?: string;
}): Promise<ApiResponse<{ userId: string; role: string }>> {
  const phone = (formData.phone || "").replace(/[\s\-()+]/g, "").trim();
  const role = normalizeRole(formData.role);

  if (!phone) return error("شماره موبایل را وارد کنید");
  if (!formData.password || formData.password.length < 8) {
    return error("رمز عبور باید حداقل ۸ کاراکتر باشد");
  }

  return success(
    role === "ARTIST"
      ? "حساب هنرمند ساخته شد. وارد شوید و پروفایل را کامل کنید."
      : "ثبت‌نام با موفقیت انجام شد",
    { userId: DEMO_ACCOUNTS[role].id, role }
  );
}

// ============================================================================
// ورود با کد یک‌بارمصرف (OTP) — نمایشی
// ============================================================================

export async function requestOtpCode(formData: {
  phone: string;
}): Promise<ApiResponse<{ otp?: string }>> {
  const phone = (formData.phone || "").replace(/[\s\-()+]/g, "").trim();
  if (!phone) return error("شماره موبایل را وارد کنید");

  return success("کد تأیید ارسال شد", { otp: "123456" });
}

export async function verifyOtpCode(formData: {
  phone: string;
  code: string;
}): Promise<ApiResponse<{ userId: string; role: string }>> {
  const phone = (formData.phone || "").replace(/[\s\-()+]/g, "").trim();
  if (!phone) return error("شماره موبایل را وارد کنید");
  if (!formData.code) return error("کد تأیید را وارد کنید");

  const account = DEMO_ACCOUNTS.CLIENT;
  await setDemoSession({ ...account, phone });

  return success("ورود انجام شد", { userId: account.id, role: "CLIENT" });
}

// ============================================================================
// بازیابی رمز عبور — نمایشی
// ============================================================================

export async function requestPasswordReset(formData: {
  phone: string;
}): Promise<ApiResponse<{ devPassword?: string }>> {
  const phone = (formData.phone || "").replace(/[\s\-()+]/g, "").trim();
  if (!phone) return error("شماره موبایل را وارد کنید");

  return success("رمز جدید پیامک شد", { devPassword: "TY12345678" });
}

// ============================================================================
// کاربر فعلی — نمایشی
// ============================================================================

export async function getCurrentUser(
  userId?: string
): Promise<ApiResponse<{ id: string; role: string; displayName: string }>> {
  try {
    const store = await cookies();
    const session = decodeSession(store.get(DEMO_COOKIE)?.value);
    const targetId = userId || session?.id || DEMO_ACCOUNTS.CLIENT.id;

    const row = (await db.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, displayName: true },
    })) as any;

    if (row) {
      return success("کاربر یافت شد", {
        id: row.id,
        role: row.role,
        displayName: row.displayName,
      });
    }
  } catch {
    // در پیش‌نمایش خطایی رخ نمی‌دهد؛ مقدار پیش‌فرض برگردانده می‌شود
  }

  return success("کاربر نمونه", {
    id: userId || DEMO_ACCOUNTS.CLIENT.id,
    role: "CLIENT",
    displayName: DEMO_ACCOUNTS.CLIENT.name,
  });
}
