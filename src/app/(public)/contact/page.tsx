"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import toast from "react-hot-toast";
import { usePublicSettings } from "@/hooks/use-public-settings";

const DEFAULT_FAQ = [
  { q: "چطور می‌تونم هنرمند تتو پیدا کنم؟", a: "از بخش «هنرمندان» می‌تونید بر اساس سبک، شهر و امتیاز جستجو کنید و پورتفولیوی هر هنرمند رو ببینید." },
  { q: "هزینه رزرو چقدره؟", a: "هزینه رزرو به هنرمند و سبک تتو بستگی داره. هر هنرمند قیمت خودش رو مشخص می‌کنه و شما قبل از رزرو اون رو می‌بینید." },
  { q: "آیا پرداخت امن هست؟", a: "بله، تمام پرداخت‌ها از درگاه‌های بانکی معتبر انجام میشه و تا زمان انجام تتو، مبلغ نزد ما امانی می‌مونه." },
  { q: "اگه از تتو راضی نباشم چی؟", a: "اگه از نتیجه راضی نبودید، می‌تونید از طریق پشتیبانی مشکلتون رو مطرح کنید تا بررسی و حلش کنیم." },
];

function parseFaq(raw: string | undefined): { q: string; a: string }[] {
  if (!raw) return DEFAULT_FAQ;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const clean = parsed
        .filter((x) => x && typeof x.q === "string" && typeof x.a === "string")
        .map((x) => ({ q: x.q, a: x.a }))
        .slice(0, 10);
      if (clean.length > 0) return clean;
    }
  } catch {
    /* fallback به پیش‌فرض */
  }
  return DEFAULT_FAQ;
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const s = usePublicSettings();

  const t = (key: string, fallback: string) => s[key] || fallback;
  const faqItems = useMemo(() => parseFaq(s.CONTACT_FAQ), [s.CONTACT_FAQ]);

  const socials = [
    { label: "اینستاگرام", href: t("INSTAGRAM_URL", "https://instagram.com/nobatmarket"), svgPath: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z M17.5 6.5h.01" },
    { label: "تلگرام", href: t("TELEGRAM_URL", "https://t.me/nobatmarket"), svgPath: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
    { label: "توییتر", href: t("TWITTER_URL", "https://twitter.com/nobatmarket"), svgPath: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" },
    { label: "یوتیوب", href: "https://youtube.com/@nobatmarket", svgPath: "M2.5 17a24.12 24.12 0 010-10 2 2 0 011.4-1.4 49.56 49.56 0 0116.2 0A2 2 0 0121.5 7a24.12 24.12 0 010 10 2 2 0 01-1.4 1.4 49.55 49.55 0 01-16.2 0A2 2 0 012.5 17 M10 15l5-3-5-3z" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("لطفاً فیلدهای ضروری را پر کنید");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("پیام شما با موفقیت ارسال شد");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(data.message || "خطا در ارسال");
      }
    } catch {
      toast.error("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "تماس با نوبت مارکت",
    url: "https://nobat-market.com/contact",
    isPartOf: { "@type": "WebSite", name: "نوبت مارکت", url: "https://nobat-market.com" },
    mainEntity: {
      "@type": "Organization",
      name: "نوبت مارکت",
      email: t("CONTACT_EMAIL", "support@nobat-market.ir"),
      telephone: t("CONTACT_PHONE", "021-12345678"),
    },
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      {/* Hero */}
      <ScrollReveal>
      <section className="relative overflow-hidden pb-8 pt-20 sm:pt-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-rose-500/[0.06] blur-[120px]" />
          <div className="absolute top-20 right-1/4 h-60 w-60 rounded-full bg-purple-500/[0.04] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/[0.08] px-5 py-2 text-sm font-medium text-rose-400 backdrop-blur-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            پشتیبانی ۲۴/۷
          </span>
          <h1 className="mt-7 font-[family-name:var(--font-lalezar)] text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            {(() => {
              const title = t("CONTACT_TITLE", "در تماس");
              const subtitle = t("CONTACT_SUBTITLE", "با ما در تماس باشید");
              const idx = subtitle.indexOf(title);
              if (idx === -1) return <>{subtitle} <span className="bg-gradient-to-l from-rose-400 to-purple-400 bg-clip-text text-transparent">{title}</span></>;
              return <>{subtitle.slice(0, idx)}<span className="bg-gradient-to-l from-rose-400 to-purple-400 bg-clip-text text-transparent">{title}</span>{subtitle.slice(idx + title.length)}</>;
            })()}
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-lg text-zinc-400 leading-relaxed">
            {t("CONTACT_DESC", "سوالی دارید؟ پیشنهادی دارید؟ مشکلی پیش اومده؟ تیم ما آماده کمک به شماست.")}
          </p>
        </div>
      </section>
      </ScrollReveal>

      {/* Contact Info Cards */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <a href={`mailto:${t("CONTACT_EMAIL", "support@nobat-market.ir")}`} className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-rose-500/30 hover:bg-rose-500/[0.05] hover:shadow-lg hover:shadow-rose-500/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 transition-colors group-hover:bg-rose-500/20">
              <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">ایمیل</h3>
            <p className="mt-1 text-xs text-zinc-500" dir="ltr">{t("CONTACT_EMAIL", "support@nobat-market.ir")}</p>
          </a>
          <a href={`tel:${t("CONTACT_PHONE", "021-12345678").replace(/-/g, "")}`} className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:bg-amber-500/[0.05] hover:shadow-lg hover:shadow-amber-500/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">تلفن</h3>
            <p className="mt-1 text-xs text-zinc-500" dir="ltr">{t("CONTACT_PHONE", "021-12345678")}</p>
          </a>
          <div className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/[0.05] hover:shadow-lg hover:shadow-purple-500/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">آدرس</h3>
            <p className="mt-1 text-xs text-zinc-500">{t("CONTACT_ADDRESS", "تهران، خیابان ولیعصر")}</p>
          </div>
          <div className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">ساعات کاری</h3>
            <p className="mt-1 text-xs text-zinc-500">{t("CONTACT_HOURS", "شنبه تا پنجشنبه · ۹ صبح تا ۶ عصر")}</p>
          </div>
        </div>
      </section>

      <ScrollReveal delay={100}>
      {/* Main Content: Form + Sidebar */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-1">{t("CONTACT_FORM_TITLE", "پیام بفرستید")}</h2>
              <p className="text-sm text-zinc-500 mb-8">{t("CONTACT_FORM_SUBTITLE", "فرم زیر رو پر کنید و ما در اسرع وقت پاسخ می‌دیم.")}</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">نام و نام خانوادگی *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
                      placeholder="مثال: علی رضایی"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">ایمیل *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
                      placeholder="ایمیل خود را وارد کنید"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">موضوع</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm text-white outline-none transition-all focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
                  >
                    <option value="">انتخاب کنید...</option>
                    <option value="support">پشتیبانی فنی</option>
                    <option value="booking">مشکل رزرو</option>
                    <option value="payment">مشکل پرداخت</option>
                    <option value="artist">سوال درباره هنرمند</option>
                    <option value="partnership">همکاری و شراکت</option>
                    <option value="feedback">پیشنهاد و انتقاد</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">پیام *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 resize-none"
                    placeholder="پیام خود را اینجا بنویسید..."
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-zinc-600">* فیلدهای ضروری</p>
                  <button
                    type="submit"
                    disabled={sending}
                    className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {sending ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <span>ارسال پیام</span>
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-[-4px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white mb-4">ما رو دنبال کنید</h3>
              <div className="grid grid-cols-2 gap-3">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-800/30 px-4 py-3 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/60 hover:scale-[1.02]">
                    <svg className="h-5 w-5 text-zinc-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.svgPath} /></svg>
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-rose-500/[0.06] to-purple-500/[0.03] p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                  <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t("CONTACT_RESPONSE_TITLE", "پاسخ سریع")}</h3>
                  <p className="text-xs text-zinc-500">زیر ۲۴ ساعت</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{t("CONTACT_RESPONSE_TEXT", "تیم پشتیبانی ما در تمام ساعات کاری آماده پاسخگویی به سوالات شماست. معمولاً ظرف ۲ ساعت پاسخ می‌دیم.")}</p>
            </div>
            <a href={t("TELEGRAM_URL", "https://t.me/nobatmarket")} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/[0.05]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">چت مستقیم در تلگرام</h3>
                <p className="text-xs text-zinc-500 mt-0.5">سریع‌ترین راه ارتباطی با ما</p>
              </div>
              <svg className="mr-auto h-4 w-4 text-zinc-600 transition-all group-hover:text-blue-400 group-hover:translate-x-[-4px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}
