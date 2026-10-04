// ============================================================================
// Middleware نسخهٔ پیش‌نمایش — نوبت مارکت
//
// همان ساختار نسخهٔ اصلی (RBAC + هدرهای امنیتی) ولی نشست از کوکی نمایشی خوانده
// می‌شود و هیچ بررسی رمزنگاری‌شده‌ای انجام نمی‌شود.
// ============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_COOKIE, decodeSession, redirectForRole } from "@/lib/demo/session";
import { publicUrl } from "@/lib/request-origin";

// ============================================================================
// نقش‌های مجاز برای هر مسیر
// ============================================================================

const ROLE_ROUTES: Record<string, string[]> = {
  "/client": ["CLIENT"],
  "/artist": ["ARTIST", "ADMIN"],
  "/admin": ["ADMIN"],
};

// ============================================================================
// مسیرهای عمومی
// ============================================================================

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/api/auth",
  "/api/payment/callback",
  "/api/image-proxy",
  "/api/artists",
  "/api/featured-artists",
  "/api/popular-artists",
  "/api/availability",
  "/api/home",
  "/api/public",
  "/api/search",
  "/api/bookings",
  "/api/contact",
  "/api/newsletter",
  "/api/blog",
  "/api/portfolio",
  "/api/flash",
  "/api/favorites",
  "/api/upload",
  "/artists",
  "/book",
  "/request",
  "/studios",
  "/flash",
  "/inspiration",
  "/magazine",
  "/aftercare",
  "/page",
  "/bookings",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/profile",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null;
}

function buildCsp(request: NextRequest): string {
  const origin = publicUrl(request, "/").origin;
  const wsOrigin = origin.replace(/^http/, "ws");
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: https://images.pexels.com https://*.pexels.com ${origin}`,
    `connect-src 'self' ${origin} ${wsOrigin}`,
    // در نسخهٔ پیش‌نمایش، محدودیت embedding برداشته شده تا این دمو بتواند
    // داخل iframe صفحهٔ محصول نمایش داده شود.
    "frame-ancestors *",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.delete("X-Frame-Options");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Content-Security-Policy", buildCsp(request));
  response.headers.delete("X-Powered-By");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // مسیر داخلی تنظیمات و فایل‌های استاتیک آزاد هستند
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/internal")) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  const sessionUser = decodeSession(request.cookies.get(DEMO_COOKIE)?.value);

  // مسیر عمومی
  if (isPublicPath(pathname) || pathname.includes(".")) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // احراز هویت نمایشی
  if (!sessionUser) {
    const url = publicUrl(request, "/login");
    url.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(url), request);
  }

  // کنترل دسترسی بر اساس نقش
  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles && !requiredRoles.includes(sessionUser.role)) {
    const home = redirectForRole(sessionUser.role);
    return addSecurityHeaders(NextResponse.redirect(publicUrl(request, home)), request);
  }

  // هدرهای کاربر برای لایه‌های بعدی
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", sessionUser.id);
  requestHeaders.set("x-user-role", sessionUser.role);

  return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), request);
}

export const config = {
  matcher: [
    // نکته: api/image-proxy بیرون از میدل‌ور است تا هر تصویر یک بار اضافه‌ی
    // پردازش میدل‌ور را هم تحمل نکند (سرعت بارگذاری تصاویر).
    "/((?!_next/static|_next/image|favicon.ico|api/image-proxy|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|txt|xml)$).*)",
  ],
};
