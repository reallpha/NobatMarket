// ============================================================================
// نشست نمایشی (Demo Session) — جایگزین NextAuth در نسخهٔ پیش‌نمایش
//
// در این نسخه هیچ احراز هویتی انجام نمی‌شود: کاربر می‌تواند با هر شماره و
// رمزی وارد شود و نقش را خودش انتخاب کند. نشست در یک کوکی ساده ذخیره می‌شود
// تا هم سرور و هم کلاینت بتوانند آن را بخوانند.
// ============================================================================

import { demoPhoto } from "./images";

export const DEMO_COOKIE = "nobat-market_demo_session";

export type DemoRole = "CLIENT" | "ARTIST" | "ADMIN";

export interface DemoSessionUser {
  id: string;
  phone: string;
  name: string;
  role: DemoRole;
  status: string;
  artistProfileId?: string;
  avatarUrl?: string;
}

/** تصویر محلی نمایشی (بدون هیچ درخواست بیرونی) */
const avatar = (id: string) => demoPhoto(id, 400);

/** سه حساب نمایشی که هر نقش را نمایندگی می‌کنند */
export const DEMO_ACCOUNTS: Record<DemoRole, DemoSessionUser> = {
  CLIENT: {
    id: "usr_client_1",
    phone: "09121111111",
    name: "نگار کیانی",
    role: "CLIENT",
    status: "ACTIVE",
    avatarUrl: avatar("774909"),
  },
  ARTIST: {
    id: "usr_artist_2",
    phone: "09132222222",
    name: "رضا اینک‌مستر",
    role: "ARTIST",
    status: "ACTIVE",
    artistProfileId: "ap_2",
    avatarUrl: avatar("220453"),
  },
  ADMIN: {
    id: "usr_admin",
    phone: "09991234567",
    name: "مدیر سیستم",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: avatar("2379004"),
  },
};

const ROLE_HOME: Record<DemoRole, string> = {
  ADMIN: "/admin/dashboard",
  ARTIST: "/artist/dashboard",
  CLIENT: "/client/dashboard",
};

export function redirectForRole(role: string): string {
  return ROLE_HOME[(role as DemoRole) in ROLE_HOME ? (role as DemoRole) : "CLIENT"];
}

// ─── رمزگذاری نشست در کوکی ───────────────────────────────────────────────────
// از base64url استاندارد (btoa/atob) استفاده می‌شود تا در Edge Runtime، Worker و
// مرورگر یکسان کار کند و متن فارسی هم سالم بماند.

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeSession(user: DemoSessionUser): string {
  try {
    const base64 = btoa(bytesToBinary(new TextEncoder().encode(JSON.stringify(user))));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeSession(raw: string | undefined | null): DemoSessionUser | null {
  if (!raw) return null;
  try {
    let base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const json = new TextDecoder().decode(binaryToBytes(atob(base64)));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || !parsed.role) return null;
    return parsed as DemoSessionUser;
  } catch {
    return null;
  }
}
