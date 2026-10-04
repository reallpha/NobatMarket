// ============================================================================
// پیکربندی Next.js — نسخهٔ پیش‌نمایش روی Cloudflare Workers
//
// تفاوت‌های عمدی با نسخهٔ اصلی (که فقط برای اجرای پیش‌نمایش است):
//   ۱. خروجی standalone حذف شده؛ OpenNext خودش بستهٔ Worker را می‌سازد.
//   ۲. ماژول‌های Prisma و Auth.js با نسخهٔ نمایشی جایگزین شده‌اند.
//   ۳. بهینه‌سازی تصویر خاموش است (روی Worker نیازی به Image Optimization نیست).
//   ۴. هدرهای X-Frame-Options و frame-ancestors حذف شده‌اند تا این پیش‌نمایش
//      بتواند داخل iframe صفحهٔ محصول نمایش داده شود.
// ============================================================================

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // در پیش‌نمایش، خطاهای نوعیِ مربوط به کلاینت تولیدنشدهٔ Prisma مانع build نشوند
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // تصاویر دست‌نخورده سرو می‌شوند (بدون بهینه‌سازی سمت سرور)
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // هدرهای امنیتی (بدون محدودیت embedding)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/assets/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // فایل‌های استاتیک Next نام هش‌دار دارند؛ بنابراین می‌توان بی‌نهایت کش‌شان کرد.
      // بدون این تنظیمات، هر بازدید دوباره برای «تازه‌سازی» هر فایل درخواست می‌فرستد.
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // جایگزینی ماژول‌های زیرساختی با نسخهٔ نمایشی
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next-auth/react$": path.resolve(__dirname, "src/lib/demo/next-auth-react.tsx"),
      "next-auth/providers/credentials$": path.resolve(
        __dirname,
        "src/lib/demo/next-auth-providers.ts"
      ),
      "next-auth$": path.resolve(__dirname, "src/lib/demo/next-auth-server.ts"),
      "@prisma/client$": path.resolve(__dirname, "src/types/prisma-standin.ts"),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
