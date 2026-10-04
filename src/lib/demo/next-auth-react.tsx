"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// جایگزین ماژول «next-auth/react» در نسخهٔ پیش‌نمایش
//
// همان API اصلی (SessionProvider، useSession، signIn، signOut) را ارائه می‌کند
// ولی هیچ درخواستی به سرور احراز هویت نمی‌زند. نشست از پراپرتی session که
// layout سرور پاس می‌دهد خوانده می‌شود و خروج با پاک کردن کوکی انجام می‌شود.
// ============================================================================

import { createContext, useContext, useMemo } from "react";
import { DEMO_COOKIE } from "@/lib/demo/session";

const SessionContext = createContext<any>({
  data: null,
  status: "unauthenticated",
  update: async () => null,
});

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  const value = useMemo(
    () => ({
      data: session ?? null,
      status: session ? ("authenticated" as const) : ("unauthenticated" as const),
      update: async () => session ?? null,
    }),
    [session]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): any {
  return useContext(SessionContext);
}

/** ورود نمایشی در سمت کلاینت (برای دکمه‌های نقش در صفحهٔ ورود) */
export async function signIn(
  provider?: any,
  options?: any,
  authorizationParams?: any
): Promise<any> {
  return { ok: true, error: null, url: null, provider, options, authorizationParams };
}

/** خروج نمایشی: کوکی نشست پاک می‌شود و به صفحهٔ ورود برمی‌گردیم */
export async function signOut(options?: { callbackUrl?: string }): Promise<void> {
  if (typeof document !== "undefined") {
    document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    window.location.href = options?.callbackUrl || "/login";
  }
}

export default { SessionProvider, useSession, signIn, signOut };
