"use client";

import Link from "next/link";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { usePublicSettings } from "@/hooks/use-public-settings";

const discover = [
  { label: "\u0647\u0646\u0631\u0645\u0646\u062F\u0627\u0646", href: "/businesses" },
  { label: "\u062A\u062A\u0648\u0647\u0627\u06CC \u0641\u0644\u0634", href: "/flash" },
  { label: "\u06AF\u0627\u0644\u0631\u06CC \u0627\u0644\u0647\u0627\u0645\u200C\u0628\u062E\u0634", href: "/inspiration" },
];
const support = [
  { label: "\u0631\u0627\u0647\u0646\u0645\u0627 \u0648 \u0633\u0648\u0627\u0644\u0627\u062A", href: "/faq" },
  { label: "\u062A\u0645\u0627\u0633 \u0628\u0627 \u0645\u0627", href: "/contact" },
  { label: "\u0634\u0631\u0627\u06CC\u0637 \u0627\u0633\u062A\u0641\u0627\u062F\u0647", href: "/terms" },
  { label: "\u062D\u0631\u06CC\u0645 \u062E\u0635\u0648\u0635\u06CC", href: "/privacy" },
];
const company = [
  { label: "\u062F\u0631\u0628\u0627\u0631\u0647 \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A", href: "/about" },
  { label: "\u0645\u062C\u0644\u0647", href: "/magazine" },
];

function ArrowRightSvg({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }

function MailSvg() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }


function useSocials(s: Record<string, string>) {
  return [
    { label: "\u0627\u06CC\u0646\u0633\u062A\u0627\u06AF\u0631\u0627\u0645", href: s.INSTAGRAM_URL || "https://instagram.com/nobatmarket", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> },
    { label: "\u062A\u0644\u06AF\u0631\u0627\u0645", href: s.TELEGRAM_URL || "https://t.me/nobatmarket", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
    { label: "\u062A\u0648\u06CC\u062A\u0631", href: s.TWITTER_URL || "https://twitter.com/nobatmarket", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg> },
    { label: "\u06CC\u0648\u062A\u06CC\u0648\u0628", href: "https://youtube.com/@nobatmarket", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg> },
  ];
}

function LinkList({ title, links, className = "" }: { title: string; links: { label: string; href: string }[]; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-center text-sm font-bold tracking-wider text-zinc-300 lg:text-right">{title}</h3>
      <ul className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:flex-col lg:items-start lg:gap-2.5 lg:justify-start">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="group inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-zinc-500 transition-colors hover:text-rose-400">{l.label}<span className="opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"><ArrowRightSvg /></span></Link></li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const settings = usePublicSettings();
  const socials = useSocials(settings);
  return (
    <footer className="relative overflow-hidden border-t border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#050508] to-[#020203]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-rose-500/[0.04] blur-[200px]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4v4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
        <h2 className="sr-only">{"\u062F\u0633\u062A\u0631\u0633\u06CC \u0633\u0631\u06CC\u0639 \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A"}</h2>
        <div className="mb-12 grid gap-10 lg:grid-cols-5 lg:gap-8">
          <div className="flex flex-col items-center space-y-5 text-center lg:col-span-2 lg:items-start lg:text-right">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Nobat Market">
              <div className="relative h-10 w-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512" fill="white" className="absolute inset-0 drop-shadow-lg"><path d="M199.3 367.9c3.1 20.2-3.6 36.9-17.6 50.6c-17.3 17.1-43.3 17.6-63.3 6.5c-8.8-4.9-12.9-5.8-20.1-13.5c-2.1-2.1-6.1-9.5-7.4-11.4l-4.3-10.3c-1.1-11.9-1.7-22.9 1.4-34.3c6.1-21.8 30-36.6 50.5-37.1c17.1-.4 31.9 4.7 43.8 16.1c9.3 8.9 15 20.3 17 33.4M512 114.1V398c0 30.5-11.9 59.1-33.4 80.6c-21.6 21.5-50.2 33.4-80.7 33.4H114.1c-30.5 0-59.1-11.9-80.6-33.4C11.9 457.1 0 428.4 0 397.9V114.1C0 83.6 11.9 55 33.4 33.5C55 11.9 83.6 0 114.1 0H398c30.5 0 59.1 11.9 80.6 33.4S512 83.6 512 114.1m-87.2 262.6c-3.4-4.9-6.6-10.2-13.2-11.1c-18.5-2-37-3.5-55.5-5.2c-10.3-.9-20.7-1.2-30.9-2.7c-10.3-1.5-20.4-4.1-30.6-6.1c-13-2.6-26.2-5.3-36.6-14.1c-2.9-2.5-5.6-7.1-5.7-10.8c-.4-10.3 4.1-19.6 10.2-27.6c7-9.2 14.6-18 22.5-26.4c17.1-18.3 34.5-36.3 51.8-54.4c5.6-5.8 11.7-11.1 16.9-17.2c5.2-6.2 4-12.1-2.4-19.1c-5-5.4-9.6-5.7-16.9-.4c-11.9 8.7-23.6 17.8-35.4 26.5c-25.4 18.7-50.6 37.6-76.3 55.9c-8.2 5.8-18 8.7-28.1 6.7c-13.2-4.8-15.8-13.3-16.9-25.7c-1.7-18.1-3.5-36.2-5.1-54.3c-1.4-16.5-2.8-33-3.7-49.6c-1.1-19.7-1.7-39.5-2.7-59.3c-.2-3.7-1.2-7.5-2.5-11.1c-2.1-5.8-9.3-10.8-13.6-10.1c-5.2.8-11.2 8.1-11.6 14.3c-.5 8.7-.9 17.4-1.3 26.2c-.5 11.5-.8 22.9-1.3 34.4c-.6 13-4.5 48.5-6.4 61.6c-2 13.7-4.1 27.6-7.7 41c-6.1 22.5-23.3 29.4-44.8 18.2c-9.1-4.7-17.6-10.1-26-15.7v153c0 37.6 30.3 67.9 67.9 67.9h140.4l-1.2-1.5c-.9-1-1.7-2-2.6-3.4c0-.4.1-.4.1-.4c-.8-1-1.7-2-2.6-3.3c0-.4.1-.4.1-.4c-2.5-2.9-10.4-13-10.4-20.4c.7-5.4.2-10.3 2-14.2c3.4-7.7 10.3-11.9 18.2-14.5c20.2-6.7 41.2-7.6 62-8.5c28.4-1.2 56.8-1 85.2-1.5c11.7-.5 17.7-7.6 14.7-16.7"/></svg>
              </div>
              <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(244,63,94,0.25)]">{"\u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A"}</span>
            </Link>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-500 lg:mx-0">{settings.PLATFORM_DESCRIPTION || "\u067E\u0644\u062A\u0641\u0631\u0645 \u0631\u0632\u0648 \u0646\u0648\u0628\u062A \u0628\u0631\u0627\u06CC \u06A9\u0633\u0628\u0648\u06A9\u0627\u0631 \u062F\u0631 \u0627\u06CC\u0631\u0627\u0646."}</p>
            <div className="flex justify-center gap-2 lg:justify-start">
              {/* آیکون‌ها بدون لینک — فقط نماد شبکه‌های اجتماعی */}
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-zinc-500" aria-label="اینستاگرام"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-zinc-500" aria-label="تلگرام"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-zinc-500" aria-label="تویتر"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-zinc-500" aria-label="یوتیوب"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg></span>
            </div>
          </div>
          {/* موبایل: کاوش و پشتیبانی کنار هم و وسط‌چین — شرکت فقط در دسکتاپ */}
          <div className="grid grid-cols-2 gap-6 text-center lg:contents lg:text-right">
            <LinkList title={"\u06A9\u0627\u0648\u0634"} links={discover} />
            <LinkList title={"\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC"} links={support} />
          </div>
          <LinkList title={"\u0634\u0631\u06A9\u062A"} links={company} className="hidden lg:block" />
        </div>

        <div className="mb-10 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="text-center sm:text-right sm:flex-shrink-0">
              <div className="flex items-center justify-center gap-2 sm:justify-start mb-1"><span className="text-rose-400"><MailSvg /></span><h3 className="font-lalezar text-lg text-white">{"\u062E\u0628\u0631\u0646\u0627\u0645\u0647 \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A"}</h3></div>
              <p className="text-sm text-zinc-500">{"\u062C\u062F\u06CC\u062F\u062A\u0631\u06CC\u0646 \u0637\u0631\u062D\u200C\u0647\u0627 \u0648 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u0647\u0627 \u0631\u0627 \u062F\u0631 \u0627\u06CC\u0645\u06CC\u0644 \u062E\u0648\u062F \u062F\u0631\u06CC\u0627\u0641\u062A \u06A9\u0646\u06CC\u062F"}</p>
            </div>
            <div className="w-full sm:ms-auto sm:w-full sm:max-w-sm">
              <NewsletterForm />
            </div>
          </div>
        </div>            <div className="border-t border-zinc-800/50 pt-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span className="text-xs text-zinc-600">توسعه داده شده توسط آریا پیکسل</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
