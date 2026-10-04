/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// جایگزین ماژول «next-auth» در سمت سرور (نسخهٔ پیش‌نمایش)
//
// در نسخهٔ اصلی، getServerSession نشست Auth.js را از کوکی رمزنگاری‌شده می‌خواند.
// اینجا همان امضا حفظ شده ولی نشست از کوکی سادهٔ نمایشی خوانده می‌شود و هیچ
// بررسی اعتبار یا پایگاه داده‌ای در کار نیست.
// ============================================================================

import { cookies } from "next/headers";
import { DEMO_COOKIE, decodeSession } from "@/lib/demo/session";

export type NextAuthOptions = any;
export type DefaultSession = any;
export type Session = any;
export type User = any;
export type Account = any;

/** خواندن نشست فعلی — معادل Auth.js */
export async function getServerSession(..._args: any[]): Promise<any> {
  try {
    const store = await cookies();
    const user = decodeSession(store.get(DEMO_COOKIE)?.value);
    if (!user) return null;
    return {
      user: {
        id: user.id,
        name: user.name,
        email: null,
        image: user.avatarUrl ?? null,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      expires: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
  } catch {
    return null;
  }
}

/** معادل auth() در Auth.js v5 */
export const auth = getServerSession;

/** سازندهٔ هندلر Auth.js — در پیش‌نمایش استفاده نمی‌شود */
export function NextAuth(_options?: any) {
  return async function handler() {
    return new Response(JSON.stringify({ demo: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

export async function signIn(): Promise<any> {
  return { ok: true, error: null };
}

export async function signOut(): Promise<any> {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  return { ok: true };
}

export default NextAuth;
