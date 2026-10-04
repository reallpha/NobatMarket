import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter, Vazirmatn, Lalezar } from "next/font/google";
import Script from "next/script";
import { auth } from "@/lib/auth";
import Providers from "@/components/providers";
import DemoPopup from "@/components/ui/DemoPopup";
import AntiCopyProtection from "@/components/ui/AntiCopyProtection";
import SitePreloader from "@/components/ui/SitePreloader";
import ImageSourceGuard from "@/components/ui/ImageSourceGuard";
import { getSetting } from "@/lib/server-settings";
import "./globals.css";
import "./premium-motion.css";

const sahel = localFont({
  src: "../../node_modules/sahel-font/dist/Sahel-VF.woff2",
  variable: "--font-sahel",
  display: "swap",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lalezar = Lalezar({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
});

const FALLBACK_TITLE = "پلتفرم رزرو نوبت";
const FALLBACK_DESCRIPTION =
  "نوبت مارکت، پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران. پیدا کنید، رزرو کنید، مدیریت کنید.";
const FALLBACK_KEYWORDS = [
  "رزرو نوبت", "نوبت آنلاین", "رزرو وقت", "کسب‌وکار", "سالن زیبایی", "آرایشگر",
  "نوبت مارکت", "نوبت", "booking", "appointment", "business",
];

/**
 * متادیتای سراسری از تنظیمات ادمین خوانده می‌شود.
 *
 * پیش از این عنوان/توضیحات/کلمات کلیدی سایت به‌صورت هاردکد بود و بخش «سئو»
 * در پنل مدیریت هیچ تأثیری روی سایت نداشت.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [titleSetting, descSetting, keywordsSetting, verification] =
    await Promise.all([
      getSetting("SEO_DEFAULT_TITLE", ""),
      getSetting("SEO_DEFAULT_DESCRIPTION", ""),
      getSetting("SEO_KEYWORDS", ""),
      getSetting("GOOGLE_SITE_VERIFICATION", ""),
    ]);

  const title = titleSetting || FALLBACK_TITLE;
  const description = descSetting || FALLBACK_DESCRIPTION;
  const keywords = keywordsSetting
    ? keywordsSetting.split(/[,،]/).map((k) => k.trim()).filter(Boolean)
    : FALLBACK_KEYWORDS;

  return {
    title: { default: title, template: "%s | نوبت مارکت" },
    description,
    keywords,
    authors: [{ name: "نوبت مارکت" }],
    creator: "نوبت مارکت",
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: "نوبت مارکت",
      title,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "نوبت مارکت" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    ...(verification ? { verification: { google: verification } } : {}),
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }],
};

// Vazirmatn is the default Persian font for all text
const FONT_STACK = `var(--font-vazirmatn), 'Vazirmatn', var(--font-sahel), 'Sahel', 'Tahoma', system-ui, sans-serif`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // شناسه‌های تحلیل ترافیک از تنظیمات ادمین (پیش‌تر هاردکد/غایب بودند)
  const [gtmId, gaId] = await Promise.all([
    getSetting("GTM_ID", ""),
    getSetting("GOOGLE_ANALYTICS_ID", ""),
  ]);

  return (
    <html lang="fa" dir="rtl" className="dark">
      <body
        className={`${sahel.variable} ${vazirmatn.variable} ${inter.variable} ${lalezar.variable} min-h-screen bg-[#09090b] text-white antialiased`}
        style={{ fontFamily: FONT_STACK }}
      >
        {gtmId && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {/* پیش‌بارگذار: اولین چیزی است که رسم می‌شود و خودش محو می‌شود */}
        <SitePreloader />
        <AntiCopyProtection />
        <ImageSourceGuard />
        <DemoPopup />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
