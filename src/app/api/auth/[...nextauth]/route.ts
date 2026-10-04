// ============================================================================
// مسیر نشست نمایشی — جایگزین /api/auth/[...nextauth]
//
// همان مسیرهای پرکاربرد Auth.js (session و signout) با نشست کوکی نمایشی
// شبیه‌سازی شده‌اند تا هیچ بخشی از رابط کاربری نشکند.
// ============================================================================

import { NextResponse } from "next/server";
import { demoSignOut, getDemoSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getDemoSessionUser();
  if (!user) return NextResponse.json({});
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: null,
      image: user.avatarUrl ?? null,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function POST() {
  await demoSignOut();
  return NextResponse.json({ url: "/login" });
}
