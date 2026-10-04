"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { SMS_PATTERN_LIST } from "@/lib/sms-patterns";

export type FeaturedArtistOption = {
  id: string;
  slug: string;
  artistName: string;
  city: string | null;
  isVerified: boolean;
  completedBookings: number;
  avatarUrl: string | null;
  rating: number;
};

type Props = {
  initialSettings: Record<string, string>;
  /** هنرمندان برای انتخاب در بخش «هنرمندان برتر» صفحه اصلی */
  artists?: FeaturedArtistOption[];
  /** مقالات منتشرشده برای انتخاب «مطالب ویژه» مجله */
  posts?: { slug: string; title: string }[];
};

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4 cursor-pointer hover:border-zinc-700 transition-colors">
      <div>
        <span className="text-sm text-zinc-300">{label}</span>
        {desc && <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        dir="ltr"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
          checked ? "bg-rose-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "bg-zinc-800 border-zinc-700 text-white";

export function AdminSettingsPanel({ initialSettings, artists = [], posts = [] }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("general");

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ── هنرمندان منتخب «هنرمندان برتر هفته» صفحه اصلی ──
  const featuredSlugs = useMemo(() => {
    try {
      const parsed = JSON.parse(settings.HOME_FEATURED_ARTISTS || "[]");
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  }, [settings.HOME_FEATURED_ARTISTS]);

  const toggleFeatured = (slug: string) => {
    const has = featuredSlugs.includes(slug);
    const next = has ? featuredSlugs.filter((s) => s !== slug) : [...featuredSlugs, slug];
    update("HOME_FEATURED_ARTISTS", JSON.stringify(next));
  };

  const setFeaturedCount = (value: string) => {
    const n = parseInt(value || "0", 10);
    const clamped = Number.isFinite(n) ? Math.min(30, Math.max(2, n)) : 10;
    update("HOME_FEATURED_COUNT", String(clamped));
  };

  const artistMap = useMemo(() => new Map(artists.map((a) => [a.slug, a])), [artists]);
  const orderedSelected = featuredSlugs
    .map((slug) => artistMap.get(slug))
    .filter((a): a is FeaturedArtistOption => Boolean(a));

  // ── مطالب ویژه مجله (حداکثر ۵ مقاله) ──
  const featuredPostSlugs = useMemo(() => {
    try {
      const parsed = JSON.parse(settings.MAGAZINE_FEATURED_POSTS || "[]");
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string").slice(0, 5) : [];
    } catch {
      return [];
    }
  }, [settings.MAGAZINE_FEATURED_POSTS]);

  const toggleFeaturedPost = (slug: string) => {
    const has = featuredPostSlugs.includes(slug);
    const next = has
      ? featuredPostSlugs.filter((s) => s !== slug)
      : [...featuredPostSlugs, slug].slice(0, 5);
    update("MAGAZINE_FEATURED_POSTS", JSON.stringify(next));
  };

  const postMap = useMemo(() => new Map(posts.map((p) => [p.slug, p])), [posts]);
  const orderedSelectedPosts = featuredPostSlugs
    .map((slug) => postMap.get(slug))
    .filter((p): p is { slug: string; title: string } => Boolean(p));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("تنظیمات با موفقیت ذخیره شد ✓");
      } else {
        toast.error(result.error || "خطا در ذخیره تنظیمات");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  // ── تست اتصال پنل پیامکی ملی‌پیامک ──
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState("");

  const handleTestSms = async () => {
    setSmsTesting(true);
    try {
      // ابتدا همین مقادیر روی صفحه ذخیره می‌شود تا تست دقیقاً با آن‌ها انجام شود
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MELI_USERNAME: settings.MELI_USERNAME || "",
          MELI_PASSWORD: settings.MELI_PASSWORD || "",
          MELI_API_KEY: settings.MELI_API_KEY || "",
          MELI_SENDER_NUMBER: settings.MELI_SENDER_NUMBER || "",
          SMS_ENABLED: settings.SMS_ENABLED || "false",
        }),
      });

      const res = await fetch("/api/admin/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone: smsTestPhone.trim() || undefined }),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "اتصال به پنل پیامکی برقرار نشد");
        return;
      }

      if (result.testSms) {
        if (result.testSms.success) {
          toast.success("اتصال برقرار است و پیامک آزمایشی ارسال شد ✓");
        } else {
          toast.error(`اتصال برقرار است، اما ارسال آزمایشی ناموفق بود: ${result.testSms.error}`);
        }
      } else {
        toast.success(result.message || "اتصال به پنل پیامکی برقرار است ✓");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSmsTesting(false);
    }
  };

  const sections = [
    { key: "general", label: "عمومی", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg> },
    { key: "seo", label: "سئو", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> },
    { key: "booking", label: "رزرو", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { key: "payment", label: "پرداخت", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
    { key: "social", label: "شبکه‌ها", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
    { key: "flash", label: "تتوی فلش", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { key: "notifications", label: "اعلان‌ها", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { key: "content", label: "محتوا", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { key: "contact", label: "تماس با ما", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { key: "homepage", label: "صفحه اصلی", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" /></svg> },
    { key: "sms", label: "پنل پیامکی", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { key: "system", label: "سیستم", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg> },
  ];

  return (
    <>
      {/* هدر */}
      <div>
        <h1 className="text-2xl font-bold text-white">تنظیمات سیستم</h1>
        <p className="mt-1 text-sm text-zinc-500">تنظیمات کلی پلتفرم را مدیریت کنید.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── منوی کناری ── */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  activeSection === s.key
                    ? "bg-rose-600/10 text-rose-400 border border-rose-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent"
                }`}
              >
                <span className="text-current">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── محتوا ── */}
        <div className="flex-1 min-w-0">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۱. تنظیمات عمومی */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "general" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات عمومی</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="نام پلتفرم">
                  <Input value={settings.PLATFORM_NAME || ""} onChange={(e) => update("PLATFORM_NAME", e.target.value)} className={inputClass} />
                </Field>
                <Field label="توضیحات کوتاه پلتفرم">
                  <Input value={settings.PLATFORM_DESCRIPTION || ""} onChange={(e) => update("PLATFORM_DESCRIPTION", e.target.value)} placeholder="نوبت مارکت، اولین و بزرگترین..." className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="تلفن پشتیبانی">
                    <Input value={settings.SUPPORT_PHONE || ""} onChange={(e) => update("SUPPORT_PHONE", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="ایمیل پشتیبانی">
                    <Input value={settings.SUPPORT_EMAIL || ""} onChange={(e) => update("SUPPORT_EMAIL", e.target.value)} dir="ltr" className={inputClass} placeholder="support@nobat-market.com" />
                  </Field>
                </div>
                <Field label="آدرس دفتر مرکزی">
                  <Input value={settings.OFFICE_ADDRESS || ""} onChange={(e) => update("OFFICE_ADDRESS", e.target.value)} placeholder="تهران، خیابان..." className={inputClass} />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۲. سئو */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "seo" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">بهینه‌سازی موتورهای جستجو (SEO)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
<Field label="عنوان پیش‌فرض صفحات">
                  <Input value={settings.SEO_DEFAULT_TITLE || ""} onChange={(e) => update("SEO_DEFAULT_TITLE", e.target.value)} placeholder="نوبت مارکت | پلتفرم رزرو نوبت ایران" className={inputClass} />
                  <p className="mt-0.5 text-[10px] text-zinc-600">{(settings.SEO_DEFAULT_TITLE || "").length}/60 کاراکتر</p>
                </Field>
                <Field label="توضیحات پیش‌فرض (Meta Description)">
                  <textarea value={settings.SEO_DEFAULT_DESCRIPTION || ""} onChange={(e) => update("SEO_DEFAULT_DESCRIPTION", e.target.value)} rows={3} placeholder="نوبت مارکت پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران..." className={`w-full rounded-md border px-3 py-2 text-sm ${inputClass}`} />
                  <p className="mt-0.5 text-[10px] text-zinc-600">{(settings.SEO_DEFAULT_DESCRIPTION || "").length}/160 کاراکتر</p>
                </Field>
                <Field label="کلمات کلیدی (جدا شده با کاما)">
                  <Input value={settings.SEO_KEYWORDS || ""} onChange={(e) => update("SEO_KEYWORDS", e.target.value)} placeholder="رزرو نوبت, نوبت آنلاین, رزرو وقت, کسب‌وکار, سالن زیبایی, آرایشگر" className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Google Analytics ID">
                    <Input value={settings.GOOGLE_ANALYTICS_ID || ""} onChange={(e) => update("GOOGLE_ANALYTICS_ID", e.target.value)} placeholder="G-XXXXXXXXXX" dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="Google Tag Manager">
                    <Input value={settings.GTM_ID || ""} onChange={(e) => update("GTM_ID", e.target.value)} placeholder="GTM-XXXXXXX" dir="ltr" className={inputClass} />
                  </Field>
                </div>
                <Field label="Google Search Console Verification">
                  <Input value={settings.GOOGLE_SITE_VERIFICATION || ""} onChange={(e) => update("GOOGLE_SITE_VERIFICATION", e.target.value)} dir="ltr" className={inputClass} />
                </Field>
                <Field label="Robots.txt سفارشی">
                  <textarea value={settings.CUSTOM_ROBOTS_TXT || ""} onChange={(e) => update("CUSTOM_ROBOTS_TXT", e.target.value)} rows={3} placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/" className={`w-full font-mono text-xs rounded-md border px-3 py-2 ${inputClass}`} />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۳. رزرو */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "booking" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات رزرو</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle checked={settings.BOOKINGS_ENABLED !== "false"} onChange={(v) => update("BOOKINGS_ENABLED", String(v))} label="فعال‌سازی سیستم رزرو" />
                <Toggle checked={settings.AUTO_CONFIRM === "true"} onChange={(v) => update("AUTO_CONFIRM", String(v))} label="تأیید خودکار رزروها" desc="بدون نیاز به تأیید هنرمند" />

                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="حداکثر رزرو در انتظار هر هنرمند">
                    <Input type="number" min="1" max="50" value={settings.MAX_PENDING_BOOKINGS || "5"} onChange={(e) => update("MAX_PENDING_BOOKINGS", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداقل زمان لغو رزرو (ساعت)">
                    <Input type="number" min="0" max="72" value={settings.CANCELLATION_HOURS || "24"} onChange={(e) => update("CANCELLATION_HOURS", e.target.value)} dir="ltr" className={inputClass} />
                    <p className="mt-0.5 text-[10px] text-zinc-600">رزروها تا این ساعت قبل از زمان رزرو رایگان لغو می‌شوند</p>
                  </Field>
                  <Field label="درصد ودیعه پیش‌پرداخت (%)">
                    <Input type="number" min="0" max="100" value={settings.DEPOSIT_PERCENT || "30"} onChange={(e) => update("DEPOSIT_PERCENT", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداقل قیمت رزرو (تومان)">
                    <Input type="number" min="0" value={settings.MIN_BOOKING_PRICE || "500000"} onChange={(e) => update("MIN_BOOKING_PRICE", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداکثر قیمت رزرو (تومان)">
                    <Input type="number" min="0" value={settings.MAX_BOOKING_PRICE || "50000000"} onChange={(e) => update("MAX_BOOKING_PRICE", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Toggle checked={settings.REQUIRE_DEPOSIT === "true"} onChange={(v) => update("REQUIRE_DEPOSIT", String(v))} label="الزام پیش‌پرداخت" desc="مشتری باید ودیعه پرداخت کند" />
                  <Toggle checked={settings.ALLOW_RESCHEDULE === "true"} onChange={(v) => update("ALLOW_RESCHEDULE", String(v))} label="اجازه تغییر زمان رزرو" desc="مشتری و هنرمند بتوانند زمان را تغییر دهند" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۴. پرداخت */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "payment" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">درگاه پرداخت (زرین‌پال)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="وضعیت درگاه پرداخت">
                  <select
                    value={settings.PAYMENT_MODE || "mock"}
                    onChange={(e) => update("PAYMENT_MODE", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${inputClass}`}
                  >
                    <option value="mock">غیرفعال — پرداخت آزمایشی (بدون درگاه واقعی)</option>
                    <option value="zarinpal">فعال — اتصال به درگاه زرین‌پال</option>
                  </select>
                </Field>
                {settings.PAYMENT_MODE !== "zarinpal" && (
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-3">
                    <p className="text-[11px] text-amber-400 leading-relaxed">
                      در حالت آزمایشی کاربر به درگاه بانکی نمی‌رود و پرداخت به‌صورت شبیه‌سازی‌شده تأیید می‌شود
                      (مناسب تست جریان رزرو). برای پرداخت واقعی، گزینه «فعال — اتصال به درگاه زرین‌پال» را انتخاب و
                      کلید اصلی را وارد کنید. تا زمانی که این حالت فعال نشود، کلید و حالت تست زیر هیچ اثری ندارند.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="کلید اصلی (MERCHANT_ID)">
                    <Input value={settings.ZARINPAL_MERCHANT_ID || ""} onChange={(e) => update("ZARINPAL_MERCHANT_ID", e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حالت تست (SANDBOX)">
                    <select value={settings.ZARINPAL_SANDBOX || "true"} onChange={(e) => update("ZARINPAL_SANDBOX", e.target.value)} className={`w-full rounded-md border px-3 py-2 text-sm ${inputClass}`} dir="ltr">
                      <option value="true">فعال (تست)</option>
                      <option value="false">غیرفعال (واقعی)</option>
                    </select>
                  </Field>
                </div>
                <Field label="آدرس بازگشت (Callback URL)">
                  <Input value={settings.ZARINPAL_CALLBACK_URL || ""} onChange={(e) => update("ZARINPAL_CALLBACK_URL", e.target.value)} placeholder="https://nobat-market.com/api/payment/callback" dir="ltr" className={inputClass} />
                </Field>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    خالی بگذارید تا آدرس به‌طور خودکار از دامنهٔ فعلی ساخته شود.
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                    <b className="text-zinc-200">راه‌اندازی روی سرور واقعی (VPS):</b> آدرس بازگشت باید با{" "}
                    <b className="text-zinc-200">https</b> و روی <b className="text-zinc-200">همان دامنه‌ای</b> باشد که در پنل
                    زرین‌پال ثبت کرده‌اید. در غیر این صورت درگاه خطای «آدرس بازگشت با دامنهٔ ثبت‌شده مغایرت دارد (کد ۱۴-)»
                    برمی‌گرداند. اگر پشت nginx یا هر reverse proxy هستید، مطمئن شوید هدرهای{" "}
                    <span dir="ltr">X-Forwarded-Host</span> و <span dir="ltr">X-Forwarded-Proto</span> را پاس می‌دهد.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="درصد کارمزد پلتفرم (%)">
                    <Input type="number" min="0" max="100" value={settings.DEFAULT_COMMISSION_PERCENT || "15"} onChange={(e) => update("DEFAULT_COMMISSION_PERCENT", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداقل موجودی کیف پول برای برداشت (تومان)">
                    <Input type="number" min="0" value={settings.MIN_WITHDRAWAL || "500000"} onChange={(e) => update("MIN_WITHDRAWAL", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Toggle checked={settings.AUTO_PAYOUT === "true"} onChange={(v) => update("AUTO_PAYOUT", String(v))} label="پرداخت خودکار" desc="واریز خودکار به حساب هنرمندان" />
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-400">
                  ⚠️ برای تست، SANDBOX را روی «فعال (تست)» قرار دهید. در محیط واقعی غیرفعال کنید.
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۵. شبکه‌های اجتماعی */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "social" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">شبکه‌های اجتماعی</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="اینستاگرام">
                    <Input value={settings.INSTAGRAM_URL || ""} onChange={(e) => update("INSTAGRAM_URL", e.target.value)} placeholder="https://instagram.com/nobatmarket" dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="تلگرام">
                    <Input value={settings.TELEGRAM_URL || ""} onChange={(e) => update("TELEGRAM_URL", e.target.value)} placeholder="https://t.me/nobatmarket" dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="توییتر / X">
                    <Input value={settings.TWITTER_URL || ""} onChange={(e) => update("TWITTER_URL", e.target.value)} placeholder="https://x.com/nobatmarket" dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="آپارات">
                    <Input value={settings.APARAT_URL || ""} onChange={(e) => update("APARAT_URL", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                </div>
                <Field label="لینک گروه واتساپ">
                  <Input value={settings.WHATSAPP_URL || ""} onChange={(e) => update("WHATSAPP_URL", e.target.value)} dir="ltr" className={inputClass} />
                </Field>
                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="کلید عمومی تلگرام ربات">
                    <Input value={settings.TELEGRAM_BOT_TOKEN || ""} onChange={(e) => update("TELEGRAM_BOT_TOKEN", e.target.value)} dir="ltr" className={inputClass} placeholder="123456:ABC-DEF..." />
                  </Field>
                  <Field label="Chat ID تلگرام (برای اعلان‌ها)">
                    <Input value={settings.TELEGRAM_CHAT_ID || ""} onChange={(e) => update("TELEGRAM_CHAT_ID", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۶. تتوی فلش */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "flash" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات تتوی فلش</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle checked={settings.FLASH_ENABLED !== "false"} onChange={(v) => update("FLASH_ENABLED", String(v))} label="فعال‌سازی بخش تتوی فلش" />
                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="حداکثر تتوی فلش فعال هر هنرمند">
                    <Input type="number" min="1" max="100" value={settings.MAX_FLASH_PER_ARTIST || "20"} onChange={(e) => update("MAX_FLASH_PER_ARTIST", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداکثر روز فروش تتوی فلش">
                    <Input type="number" min="1" max="90" value={settings.FLASH_SALE_DAYS || "30"} onChange={(e) => update("FLASH_SALE_DAYS", e.target.value)} dir="ltr" className={inputClass} />
                    <p className="mt-0.5 text-[10px] text-zinc-600">تتوهای فلش پس از این مدت غیرفعال می‌شوند</p>
                  </Field>
                  <Field label="درصد کارمزد تتوی فلش (%)">
                    <Input type="number" min="0" max="100" value={settings.FLASH_COMMISSION || "15"} onChange={(e) => update("FLASH_COMMISSION", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۷. اعلان‌ها */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "notifications" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات اعلان‌ها</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle checked={settings.NOTIFICATIONS_ENABLED !== "false"} onChange={(v) => update("NOTIFICATIONS_ENABLED", String(v))} label="اعلان‌های ایمیلی فعال" desc="ارسال ایمیل برای رویدادهای مهم" />
                <Toggle checked={settings.SMS_ENABLED === "true"} onChange={(v) => update("SMS_ENABLED", String(v))} label="ارسال پیامک فعال" desc="ارسال از طریق پنل پیامکی ملی‌پیامک (تب «پنل پیامکی»)" />
                <Toggle checked={settings.PUSH_NOTIFICATIONS === "true"} onChange={(v) => update("PUSH_NOTIFICATIONS", String(v))} label="اعلان‌های Push فعال" desc="اعلان‌های فوری در مرورگر" />
                <Toggle checked={settings.NOTIFY_ADMIN_ON_BOOKING === "true"} onChange={(v) => update("NOTIFY_ADMIN_ON_BOOKING", String(v))} label="اعلان به ادمین هنگام رزرو جدید" />

                <div className="rounded-lg border border-purple-500/20 bg-purple-500/[0.04] p-3 space-y-3">
                  <p className="text-xs font-semibold text-purple-300">چت و تیکت‌ها</p>
                  <Toggle checked={settings.CHAT_FILE_UPLOAD_ENABLED !== "false"} onChange={(v) => update("CHAT_FILE_UPLOAD_ENABLED", String(v))} label="آپلود فایل در پیام‌ها و تیکت‌ها" desc="اجازه ارسال فایل در چت‌ها، تیکت‌ها و اعلان‌ها برای همه نقش‌ها" />
                  <Toggle checked={settings.CHAT_LINKS_ALLOWED === "true"} onChange={(v) => update("CHAT_LINKS_ALLOWED", String(v))} label="اجازه ارسال لینک در چت" desc="پیش‌فرض غیرفعال: ارسال لینک و اطلاعات تماس خارجی در چت ممنوع است (مسدودسازی حساب در صورت تکرار)" />
                </div>

                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    تنظیمات پنل پیامکی (نام کاربری، رمز عبور، شماره فرستنده و کد پترن‌ها) در تب
                    «پنل پیامکی» انجام می‌شود.
                  </p>
                  <Field label="کلید Resend API (ایمیل)">
                    <Input value={settings.RESEND_API_KEY || ""} onChange={(e) => update("RESEND_API_KEY", e.target.value)} dir="ltr" className={inputClass} placeholder="re_xxxxx" />
                  </Field>
                  <Field label="ایمیل فرستنده">
                    <Input value={settings.EMAIL_FROM || ""} onChange={(e) => update("EMAIL_FROM", e.target.value)} dir="ltr" className={inputClass} placeholder="noreply@nobat-market.com" />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۸. محتوا */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "content" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات محتوا</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle checked={settings.BLOG_ENABLED !== "false"} onChange={(v) => update("BLOG_ENABLED", String(v))} label="بخش مجله/بلاگ فعال" />
                <Toggle checked={settings.FLASH_PAGE_ENABLED !== "false"} onChange={(v) => update("FLASH_PAGE_ENABLED", String(v))} label="صفحه تتوی فلش فعال" />
                <Toggle checked={settings.STUDIOS_ENABLED !== "false"} onChange={(v) => update("STUDIOS_ENABLED", String(v))} label="بخش استودیوها فعال" />
                <Toggle checked={settings.INSPIRATION_ENABLED !== "false"} onChange={(v) => update("INSPIRATION_ENABLED", String(v))} label="بخش الهام‌بخش فعال" />
                <Toggle checked={settings.PORTFOLIO_PUBLIC === "true"} onChange={(v) => update("PORTFOLIO_PUBLIC", String(v))} label="پورتفولیوی هنرمندان عمومی" desc="همه بتوانند پورتفولیو را ببینند" />

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-amber-200">مطالب ویژه مجله <span className="text-xs font-normal text-zinc-500">(حداکثر ۵ مقاله — در سایدبار صفحه مقاله نمایش داده می‌شود)</span></p>
                    <span className="text-xs text-amber-400">{featuredPostSlugs.length}/۵</span>
                  </div>
                  {orderedSelectedPosts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {orderedSelectedPosts.map((p, i) => (
                        <span key={p.slug} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 py-1 pl-2.5 pr-1 text-[11px] text-amber-200">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold">{i + 1}</span>
                          <span className="max-w-[180px] truncate">{p.title}</span>
                          <button type="button" onClick={() => toggleFeaturedPost(p.slug)} className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-amber-300/60 transition-colors hover:bg-amber-500/20 hover:text-amber-200" aria-label={`حذف ${p.title}`}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="max-h-[260px] space-y-1.5 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-2">
                    {posts.length === 0 ? (
                      <p className="p-6 text-center text-sm text-zinc-500">مقاله منتشرشده‌ای یافت نشد.</p>
                    ) : (
                      posts.map((p) => {
                        const selected = featuredPostSlugs.includes(p.slug);
                        const full = featuredPostSlugs.length >= 5 && !selected;
                        return (
                          <button
                            key={p.slug}
                            type="button"
                            disabled={full}
                            onClick={() => toggleFeaturedPost(p.slug)}
                            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-right transition-all disabled:opacity-40 ${
                              selected
                                ? "border-amber-500/30 bg-amber-500/[0.08]"
                                : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/50"
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${selected ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-600 bg-zinc-800/60 text-transparent"}`}>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-white">{p.title}</span>
                            <span className="shrink-0 font-mono text-[10px] text-zinc-600">{p.slug}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="تعداد پست مجله در هر صفحه">
                    <Input type="number" min="3" max="24" value={settings.BLOG_POSTS_PER_PAGE || "9"} onChange={(e) => update("BLOG_POSTS_PER_PAGE", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="حداکثر حجم آپلود تصویر (MB)">
                    <Input type="number" min="1" max="50" value={settings.MAX_UPLOAD_SIZE_MB || "10"} onChange={(e) => update("MAX_UPLOAD_SIZE_MB", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="فرمت‌های مجاز تصویر">
                    <Input value={settings.ALLOWED_IMAGE_TYPES || "jpg,jpeg,png,webp"} onChange={(e) => update("ALLOWED_IMAGE_TYPES", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* تماس با ما — متن‌های صفحه /contact */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "contact" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">صفحه تماس با ما</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-blue-500/[0.04] p-3 text-xs leading-relaxed text-blue-300/80">
                  متن‌های صفحه «تماس با ما» را اینجا ویرایش کنید. با ذخیره تنظیمات، تغییرات بلافاصله در سایت اعمال می‌شود.
                </div>
                <Field label="تیتر اصلی (بخش رنگی)">
                  <Input value={settings.CONTACT_TITLE || ""} onChange={(e) => update("CONTACT_TITLE", e.target.value)} placeholder="در تماس" className={inputClass} />
                </Field>
                <Field label="زیرعنوان">
                  <Input value={settings.CONTACT_SUBTITLE || ""} onChange={(e) => update("CONTACT_SUBTITLE", e.target.value)} placeholder="با ما در تماس باشید" className={inputClass} />
                </Field>
                <Field label="توضیحات زیر تیتر">
                  <textarea value={settings.CONTACT_DESC || ""} onChange={(e) => update("CONTACT_DESC", e.target.value)} rows={2} className={`w-full rounded-md border px-3 py-2 text-sm ${inputClass}`} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ایمیل نمایشی">
                    <Input value={settings.CONTACT_EMAIL || ""} onChange={(e) => update("CONTACT_EMAIL", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="تلفن نمایشی">
                    <Input value={settings.CONTACT_PHONE || ""} onChange={(e) => update("CONTACT_PHONE", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="آدرس">
                    <Input value={settings.CONTACT_ADDRESS || ""} onChange={(e) => update("CONTACT_ADDRESS", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="ساعات کاری">
                    <Input value={settings.CONTACT_HOURS || ""} onChange={(e) => update("CONTACT_HOURS", e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <Field label="عنوان فرم پیام">
                  <Input value={settings.CONTACT_FORM_TITLE || ""} onChange={(e) => update("CONTACT_FORM_TITLE", e.target.value)} className={inputClass} />
                </Field>
                <Field label="توضیح فرم پیام">
                  <Input value={settings.CONTACT_FORM_SUBTITLE || ""} onChange={(e) => update("CONTACT_FORM_SUBTITLE", e.target.value)} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="عنوان کارت پاسخ سریع">
                    <Input value={settings.CONTACT_RESPONSE_TITLE || ""} onChange={(e) => update("CONTACT_RESPONSE_TITLE", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="متن کارت پاسخ سریع">
                    <Input value={settings.CONTACT_RESPONSE_TEXT || ""} onChange={(e) => update("CONTACT_RESPONSE_TEXT", e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <Field label="سوالات متداول (JSON)">
                  <textarea
                    value={settings.CONTACT_FAQ || ""}
                    onChange={(e) => update("CONTACT_FAQ", e.target.value)}
                    rows={6}
                    dir="ltr"
                    placeholder='[{"q":"سوال","a":"پاسخ"}]'
                    className={`w-full rounded-md border px-3 py-2 font-mono text-xs ${inputClass}`}
                  />
                  <p className="mt-0.5 text-[10px] text-zinc-600">فرمت JSON آرایه‌ای از آبجکت‌های q و a — خالی بگذارید تا پیش‌فرض نمایش داده شود</p>
                </Field>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۹. سیستم */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۱۰. پنل پیامکی ملی پیامک */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "sms" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">پنل پیامکی ملی پیامک</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Toggle checked={settings.SMS_ENABLED === "true"} onChange={(v) => update("SMS_ENABLED", String(v))} label="فعال‌سازی ارسال پیامک" desc="ارسال پیامک‌های اعلان و تأیید به کاربران" />
                
                <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-white">اطلاعات اتصال به پنل</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    نام کاربری و رمز عبور، همان اطلاعات ورود شما به پنل melipayamak.ir است.
                  </p>
                  <Field label="نام کاربری ملی پیامک">
                    <Input value={settings.MELI_USERNAME || ""} onChange={(e) => update("MELI_USERNAME", e.target.value)} dir="ltr" placeholder="username" className={inputClass} />
                  </Field>
                  <Field label="رمز عبور ملی پیامک">
                    <Input type="password" value={settings.MELI_PASSWORD || ""} onChange={(e) => update("MELI_PASSWORD", e.target.value)} dir="ltr" placeholder="••••••••" className={inputClass} />
                  </Field>
                  <Field label="شماره فرستنده">
                    <Input value={settings.MELI_SENDER_NUMBER || ""} onChange={(e) => update("MELI_SENDER_NUMBER", e.target.value)} dir="ltr" placeholder="1000xxxx" className={inputClass} />
                  </Field>
                  <Field label="کلید API (اختیاری — فقط در صورت الزام سامانه)">
                    <Input type="password" value={settings.MELI_API_KEY || ""} onChange={(e) => update("MELI_API_KEY", e.target.value)} dir="ltr" placeholder="در حالت عادی خالی بگذارید" className={inputClass} />
                  </Field>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    اگر سامانه برای حساب شما خطای «الزام استفاده از کلید API به جای رمز عبور» بدهد،
                    کلید API را از پنل ملی پیامک بسازید، در فیلد بالا وارد کنید و رمز عبور را خالی بگذارید.
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-300">تست اتصال</h4>
                  <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                    با زدن این دکمه، نام کاربری و رمز عبور بررسی می‌شود و اعتبار پنل و فهرست خطوط شما نمایش داده می‌شود
                    (بدون ارسال پیامک و بدون هزینه). اگر شماره‌ای وارد کنید، یک پیامک آزمایشی هم فرستاده می‌شود.
                  </p>
                  <Field label="شماره برای پیامک آزمایشی (اختیاری)">
                    <Input value={smsTestPhone} onChange={(e) => setSmsTestPhone(e.target.value)} dir="ltr" placeholder="09123456789" className={inputClass} />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestSms}
                    disabled={smsTesting}
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                  >
                    {smsTesting ? "در حال بررسی..." : "تست اتصال به پنل پیامکی"}
                  </Button>
                </div>

                <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-white">کد پترن‌های پیامکی</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    کد پترن‌های ساخته‌شده در پنل ملی پیامک را وارد کنید. ترتیب متغیرها در متن هر پترن باید
                    دقیقاً مطابق راهنمای زیر باشد (نگه‌دارهای {`{0}`}، {`{1}`}، ... در متن پترن).
                  </p>
                  
                  {SMS_PATTERN_LIST.map((pattern) => (
                    <Field key={pattern.settingKey} label={pattern.label}>
                      <Input value={settings[pattern.settingKey] || ""} onChange={(e) => update(pattern.settingKey, e.target.value)} dir="ltr" placeholder="10000xxxx" className={inputClass} />
                      <p className="mt-1 text-[11px] text-zinc-500">متغیرها به همین ترتیب: {pattern.hint}</p>
                    </Field>
                  ))}
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-[11px] text-amber-400 leading-relaxed">
                    ⚠️ ابتدا پترن‌های مورد نیاز را در پنل ملی پیامک (melipayamak.ir) بسازید و کد آنها را در فیلدهای بالا وارد کنید. شماره فرستنده باید یکی از خطوط تأییدشده‌ی حساب شما باشد — با دکمه «تست اتصال» می‌توانید فهرست خطوط و اعتبار پنل خود را ببینید.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ۱۰. صفحه اصلی - هنرمندان برتر هفته */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "homepage" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">هنرمندان برتر صفحه اصلی</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3 text-xs leading-relaxed text-amber-200/70">
                  بخش «هنرمندان برتر هفته» در صفحه اصلی را شخصی‌سازی کنید: هنرمندان دلخواه را انتخاب کنید (ترتیب انتخاب = ترتیب نمایش).
                  اگر هنرمندی انتخاب نشود، بهترین‌ها به‌صورت خودکار بر اساس تأیید و رزروهای تکمیل‌شده نمایش داده می‌شوند.
                </div>

                <Field label="تعداد هنرمندان در این بخش">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="2"
                      max="30"
                      value={settings.HOME_FEATURED_COUNT || "10"}
                      onChange={(e) => setFeaturedCount(e.target.value)}
                      dir="ltr"
                      className={`${inputClass} max-w-[140px]`}
                    />
                    <span className="text-xs text-zinc-500">(بین ۲ تا ۳۰؛ پیش‌فرض ۱۰)</span>
                  </div>
                </Field>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-300">
                    {orderedSelected.length > 0 ? (
                      <>
                        <span className="font-semibold text-rose-400">{orderedSelected.length} هنرمند</span> انتخاب شده — ترتیب نمایش: به همان ترتیب انتخاب
                      </>
                    ) : (
                      <>هیچ هنرمندی انتخاب نشده — <span className="text-amber-400">انتخاب خودکار فعال است</span></>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const all = artists.map((a) => a.slug);
                      const next = featuredSlugs.length === all.length ? [] : all;
                      update("HOME_FEATURED_ARTISTS", JSON.stringify(next));
                    }}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-rose-500/40 hover:text-rose-400"
                  >
                    {featuredSlugs.length === artists.length && artists.length > 0 ? "پاک کردن همه" : "انتخاب همه"}
                  </button>
                </div>

                {/* پیش‌نمایش هنرمندان انتخاب‌شده */}
                {orderedSelected.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {orderedSelected.map((a, i) => (
                      <span key={a.slug} className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 py-1 pl-2.5 pr-1 text-[11px] text-rose-300">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-[9px] font-bold">{i + 1}</span>
                        {a.artistName}
                        <button type="button" onClick={() => toggleFeatured(a.slug)} className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-rose-400/60 transition-colors hover:bg-rose-500/20 hover:text-rose-300" aria-label={`حذف ${a.artistName}`}>✕</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* لیست هنرمندان */}
                <div className="max-h-[380px] space-y-1.5 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-2">
                  {artists.length === 0 ? (
                    <p className="p-6 text-center text-sm text-zinc-500">هنرمند تأییدشده‌ای یافت نشد.</p>
                  ) : (
                    artists.map((a) => {
                      const selected = featuredSlugs.includes(a.slug);
                      return (
                        <button
                          key={a.slug}
                          type="button"
                          onClick={() => toggleFeatured(a.slug)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-right transition-all ${
                            selected
                              ? "border-rose-500/30 bg-rose-500/[0.08]"
                              : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/50"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              selected
                                ? "border-rose-500 bg-rose-500 text-white"
                                : "border-zinc-600 bg-zinc-800/60 text-transparent"
                            }`}
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-sm font-bold text-rose-300">{a.artistName[0]}</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-white">{a.artistName}</span>
                              {a.isVerified && (
                                <svg className="h-3.5 w-3.5 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              )}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {a.city || "نامشخص"} · {a.completedBookings} رزرو · امتیاز {a.rating || "—"}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeSection === "system" && (
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader><CardTitle className="text-lg text-white">تنظیمات سیستم</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle checked={settings.MAINTENANCE_MODE === "true"} onChange={(v) => update("MAINTENANCE_MODE", String(v))} label="حالت تعمیرات" desc="سایت برای کاربران عادی بسته می‌شود" />
                <Toggle checked={settings.DEBUG_MODE === "true"} onChange={(v) => update("DEBUG_MODE", String(v))} label="حالت دیباگ" desc="نمایش خطاهای تفصیلی در لاگ" />
                <Toggle checked={settings.REGISTRATION_ENABLED !== "false"} onChange={(v) => update("REGISTRATION_ENABLED", String(v))} label="ثبت‌نام عمومی فعال" desc="کاربران جدید بتوانند ثبت‌نام کنند" />
                <Toggle checked={settings.rateLimitEnabled !== "false"} onChange={(v) => update("rateLimitEnabled", String(v))} label="محدودیت نرخ درخواست (Rate Limit)" desc="غیرفعال کردن این گزینه محدودیت درخواست‌ها را رفع می‌کند" />

                <div className="rounded-lg border border-zinc-800 p-4 space-y-3 mt-2">
                  <Field label="حداکثر نشست‌های فعال هر کاربر">
                    <Input type="number" min="1" max="20" value={settings.MAX_SESSIONS || "5"} onChange={(e) => update("MAX_SESSIONS", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="مدت اعتبار نشست (روز)">
                    <Input type="number" min="1" max="90" value={settings.SESSION_EXPIRY_DAYS || "30"} onChange={(e) => update("SESSION_EXPIRY_DAYS", e.target.value)} dir="ltr" className={inputClass} />
                  </Field>
                  <Field label="نرخ رتبه‌بندی هنرمندان (روز)">
                    <Input type="number" min="1" max="30" value={settings.RATING_CALC_INTERVAL || "7"} onChange={(e) => update("RATING_CALC_INTERVAL", e.target.value)} dir="ltr" className={inputClass} />
                    <p className="mt-0.5 text-[10px] text-zinc-600">هر چند روز امتیاز هنرمندان بازمحاسبه شود</p>
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── دکمه ذخیره ── */}
          <div className="mt-6 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-sm text-zinc-500">تمام تغییرات با کلیک روی دکمه ذخیره اعمال می‌شوند.</p>
            <Button onClick={handleSave} disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white min-w-[140px]">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  در حال ذخیره...
                </span>
              ) : "ذخیره تنظیمات"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
