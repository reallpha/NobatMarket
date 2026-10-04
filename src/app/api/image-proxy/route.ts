// ============================================================================
// پروکسی تصویر — همهٔ تصاویر بیرونی از دامنهٔ خودِ ورکر سرو می‌شوند
// ----------------------------------------------------------------------------
// چرا این تغییر لازم بود؟
//   تصاویر نمونه در سرورهای بیرونی (pexels/unsplash) میزبانی می‌شوند. آن دامنه‌ها
//   از ایران بدون فیلترشکن یا اصلاً باز نمی‌شوند یا چند ده ثانیه معلق می‌مانند و
//   همین باعث می‌شد کل صفحه کند/نیمه‌خراب دیده شود.
//
// راه‌حل:
//   ۱. مرورگر فقط با دامنهٔ خودمان حرف می‌زند (بدون هیچ درخواست بیرونی).
//   ۲. خودِ Worker تصویر را از مبدأ می‌گیرد و «استریم» می‌کند (بدون بافر کردن کل فایل).
//   ۳. نتیجه در کش لبهٔ کلادفلر نگه داشته می‌شود؛ بازدید بعدی (حتی از طرف کاربر دیگر)
//      تقریباً صفر میلی‌ثانیه پاسخ می‌گیرد و دیگر به مبدأ بیرونی درخواستی نمی‌رود.
//   ۴. اگر مبدأ بیرونی کند/قطع بود، حداکثر پس از ۸ ثانیه به‌جای معلق‌ماندن تصویر،
//      یک تصویر جانشین سبک برگردانده می‌شود تا صفحه هیچ‌وقت معطل نماند.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

// توجه: تصاویر نمایشی دیگر از دامنه‌های بیرونی نمی‌آیند (همه محلی شدند)، اما این
// مسیر برای آواتار/تصاویری که کاربر یا ادمین با آدرس بیرونی ثبت می‌کند باقی می‌ماند.
const ALLOWED_HOSTS = ["images.pexels.com", "images.unsplash.com"];

/** مسیرهای محلی که باید بدون عبور از پروکسی و با کش یک‌ساله سرو شوند */
const LOCAL_ASSET_PREFIXES = ["/image/", "/images/", "/fonts/", "/_next/"];

/** تصاویر تغییر نمی‌کنند؛ یک سال کش مرورگر + کش لبه */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
/** جانشین‌ها را کوتاه کش می‌کنیم تا اگر درست شد دوباره تلاش شود */
const FALLBACK_CACHE = "public, max-age=300";

/** سقف انتظار برای مبدأ بیرونی (میلی‌ثانیه) */
const UPSTREAM_TIMEOUT_MS = 8000;

// ─── تصویر جانشین (SVG سبک، بدون هیچ درخواست بیرونی) ────────────────────────
const FALLBACK_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">` +
  `<rect width="400" height="400" fill="#18181b"/>` +
  `<g fill="none" stroke="#3f3f46" stroke-width="14" stroke-linecap="round">` +
  `<rect x="96" y="96" width="208" height="208" rx="28"/>` +
  `<circle cx="163" cy="163" r="16" fill="#3f3f46" stroke="none"/>` +
  `<path d="M112 276l70-70 58 58 30-30 30 30"/>` +
  `</g></svg>`;

function fallbackResponse(status = 200): NextResponse {
  return new NextResponse(FALLBACK_SVG, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": FALLBACK_CACHE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** کش لبهٔ کلادفلر (در محیط‌های دیگر بی‌سروصدا نادیده گرفته می‌شود) */
function edgeCache(): Cache | null {
  try {
    const store = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
    return store?.default ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") || "";

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // مسیرهای داخلی (مثل /image/...) نیازی به عبور از پروکسی ندارند؛
  // یک ریدایرکت دائمی می‌دهیم تا مرورگر خودش مسیر اصلی را کش کند.
  if (url.startsWith("/") && !url.startsWith("//")) {
    // مسیرهای محلی دارایی‌های استاتیک با کش یک‌ساله؛ بقیه بدون کش (ممکن است پویا باشند)
    const cacheControl = LOCAL_ASSET_PREFIXES.some((p) => url.startsWith(p))
      ? IMMUTABLE_CACHE
      : "no-store";
    return new NextResponse(null, {
      status: 308,
      headers: { Location: url, "Cache-Control": cacheControl },
    });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.includes(target.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  const upstreamUrl = target.toString();
  const cache = edgeCache();
  // کلید کش روی آدرس خودِ مبدأ است تا فرقی نکند از کدام صفحه درخواست شده.
  const cacheKey = new Request(upstreamUrl, { method: "GET" });

  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        return new NextResponse(hit.body, {
          status: 200,
          headers: {
            "Content-Type": hit.headers.get("content-type") || "image/jpeg",
            "Cache-Control": IMMUTABLE_CACHE,
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    } catch {
      // کش در دسترس نبود → ادامهٔ مسیر عادی
    }
  }

  try {
    // گزینهٔ cf مخصوص کلادفلر است (در محیط‌های دیگر نادیده گرفته می‌شود).
    const upstreamInit = {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NobatMarket/1.0)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit;

    const upstream = await fetch(upstreamUrl, upstreamInit);

    if (!upstream.ok || !upstream.body) {
      return fallbackResponse(200);
    }

    const headers = new Headers({
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Cache-Control": IMMUTABLE_CACHE,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    // بدنه استریم می‌شود؛ کل فایل در حافظه بافر نمی‌شود.
    const response = new NextResponse(upstream.body, { status: 200, headers });

    if (cache) {
      try {
        await cache.put(cacheKey, response.clone());
      } catch {
        // پر شدن کش مشکلی ایجاد نمی‌کند
      }
    }

    return response;
  } catch {
    return fallbackResponse(200);
  }
}
