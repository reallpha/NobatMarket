/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// احراز هویت نمایشی — جایگزین NextAuth در نسخهٔ پیش‌نمایش
//
// در این نسخه هیچ اعتبارسنجی‌ای انجام نمی‌شود. کاربر با انتخاب نقش وارد می‌شود
// و نشست در کوکی «nobat-market_demo_session» نگهداری می‌شود.
// ============================================================================

import { cookies } from "next/headers";
import {
  DEMO_ACCOUNTS,
  DEMO_COOKIE,
  decodeSession,
  encodeSession,
  redirectForRole,
  type DemoRole,
  type DemoSessionUser,
} from "@/lib/demo/session";
import { db } from "@/lib/db";

export type { DemoRole, DemoSessionUser };

// ============================================================================
// خواندن نشست فعلی (سمت سرور)
// ============================================================================

export async function getDemoSessionUser(): Promise<DemoSessionUser | null> {
  try {
    const store = await cookies();
    return decodeSession(store.get(DEMO_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** همان امضای Auth.js: در صورت نبود کاربر، null برمی‌گرداند. */
export async function auth(): Promise<{ user: any } | null> {
  const demoUser = await getDemoSessionUser();
  if (!demoUser) return null;

  let name = demoUser.name;
  let image = demoUser.avatarUrl ?? null;
  try {
    const row = await db.user.findUnique({
      where: { id: demoUser.id },
      select: { displayName: true, avatarUrl: true, email: true },
    });
    if (row) {
      name = row.displayName || name;
      image = row.avatarUrl ?? image;
    }
  } catch {
    // در صورت خطا، همان مقادیر کوکی استفاده می‌شود
  }

  return {
    user: {
      id: demoUser.id,
      name,
      email: null,
      image,
      phone: demoUser.phone,
      role: demoUser.role,
      status: demoUser.status,
    },
  };
}

export async function getSession() {
  return auth();
}

// ============================================================================
// ورود/خروج نمایشی
// ============================================================================

/** ورود نمایشی: کوکی نشست را می‌سازد و مسیر مقصد را برمی‌گرداند */
export async function demoSignIn(user: DemoSessionUser): Promise<string> {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeSession(user), {
    path: "/",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });
  return redirectForRole(user.role);
}

/** ورود به‌عنوان یکی از نقش‌های نمایشی */
export async function demoSignInAsRole(role: DemoRole): Promise<string> {
  return demoSignIn(DEMO_ACCOUNTS[role]);
}

/** خروج نمایشی */
export async function demoSignOut(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
}

// ============================================================================
// سازگاری با کد قبلی (Auth.js)
// ============================================================================

export { DEMO_ACCOUNTS, DEMO_COOKIE, decodeSession, encodeSession, redirectForRole };
export const authOptions = {} as any;
export const getServerSessionHelper = auth;
export const signIn = auth;
export const signOut = auth;
