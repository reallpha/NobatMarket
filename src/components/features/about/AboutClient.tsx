"use client";

import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "جستجوی هوشمند",
    desc: "بر اساس سبک، شهر، قیمت و امتیاز هنرمند مورد نظرتان را پیدا کنید.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    title: "رزرو آنلاین",
    desc: "تاریخ و ساعت دلخواه را انتخاب کنید و بیعانه را آنلاین پرداخت کنید.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "مقایسه و بررسی",
    desc: "نمونه‌کارها، امتیازات و نظرات مشتریان واقعی را ببینید و مقایسه کنید.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "پرداخت امن",
    desc: "پرداخت از طریق درگاه بانکی زرین‌پال با تضمین امنیت کامل.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "پشتیبانی ۲۴ ساعته",
    desc: "تیم پشتیبانی نوبت مارکت در تمام ساعات شبانه‌روز آماده کمک به شماست.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: "نمونه‌کار واقعی",
    desc: "تمام نمونه‌کارها واقعی هستند و توسط تیم نوبت مارکت بررسی می‌شوند.",
  },
];

const stats = [
  { value: "۵۰۰+", label: "هنرمند فعال", color: "text-rose-400" },
  { value: "۱۰,۰۰۰+", label: "تتوی انجام شده", color: "text-amber-400" },
  { value: "۳۰+", label: "شهر تحت پوشش", color: "text-emerald-400" },
  { value: "۴.۸", label: "میانگین رضایت", color: "text-sky-400" },
];

export default function AboutClient() {
  return (
    <>
      {/* هدر */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950" />
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.04] blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-sm font-medium text-amber-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              درباره ما
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-lalezar)] text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              نوبت مارکت، <span className="bg-gradient-to-l from-amber-400 to-rose-400 bg-clip-text text-transparent">پلتفرم تتو</span> ایران
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-400">
              نوبت مارکت با هدف ساخت بزرگترین و مطمئن‌ترین پلتفرم بازار و رزرو آنلاین تتو در ایران راه‌اندازی شده است.
              ما هنرمندان حرفه‌ای را با مشتریانی که به دنبال بهترین کیفیت هستند متصل می‌کنیم.
            </p>
          </div>
        </div>
      </div>

      {/* آمار */}
      <ScrollReveal>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-center backdrop-blur-sm">
                <div className={`font-[family-name:var(--font-lalezar)] text-3xl ${stat.color}`}>{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* معرفی */}
      <ScrollReveal delay={100}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-[family-name:var(--font-lalezar)] text-3xl font-bold text-white sm:text-4xl">
              نوبت مارکت <span className="text-rose-400">چیست؟</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-400">
              نوبت مارکت یک پلتفرم آنلاین است که فرآیند پیدا کردن هنرمند تتو، مشاهده نمونه‌کار، مقایسه قیمت و رزرو وقت را
              برای اولین بار در ایران کاملاً دیجیتال و ساده کرده است. دیگر نیازی به جستجو در اینستاگرام، ارسال پیام در
              دایرکت و منتظر ماندن برای پاسخ نیست.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              ما به هنرمندان کمک می‌کنیم تا کسب‌وکار خود را حرفه‌ای مدیریت کنند و به مشتریان این امکان را می‌دهیم تا
              با خیال راحت بهترین هنرمند را انتخاب کنند.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* امکانات */}
      <ScrollReveal delay={100}>
        <div className="bg-zinc-900/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-[family-name:var(--font-lalezar)] text-3xl font-bold text-white sm:text-4xl">
                امکانات <span className="text-amber-400">نوبت مارکت</span>
              </h2>
              <p className="mt-3 text-zinc-400">هر آنچه برای یک تجربه تتوی عالی نیاز دارید</p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-amber-400">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* چرا نوبت مارکت */}
      <ScrollReveal delay={100}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-lalezar)] text-3xl font-bold text-white sm:text-4xl">
                چرا <span className="text-rose-400">نوبت مارکت</span>؟
              </h2>
              <div className="mt-8 space-y-5">
                {[
                  { title: "انتخاب آگاهانه", desc: "مقایسه نمونه‌کار، قیمت و امتیاز هنرمندان قبل از رزرو" },
                  { title: "پرداخت امن", desc: "بیعانه از طریق درگاه بانکی معتبر و بازگشت در صورت لغو" },
                  { title: "تضمین کیفیت", desc: "تمام هنرمندان توسط تیم نوبت مارکت بررسی و تأیید شده‌اند" },
                  { title: "پشتیبانی واقعی", desc: "تیم پشتیبانی ما در تمام مراحل کنار شماست" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-rose-500/[0.06] to-amber-500/[0.06] blur-2xl" />
              <div className="relative rounded-3xl border border-zinc-800/50 bg-zinc-900/50 p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  {[
                    "جستجوی هوشمند بر اساس سبک، شهر و قیمت",
                    "مشاهده نمونه‌کار واقعی قبل از رزرو",
                    "رزرو آنلاین با پرداخت امن بیعانه",
                    "مقایسه امتیاز و نظرات مشتریان",
                    "مدیریت رزروها در داشبورد شخصی",
                    "پشتیبانی در تمام مراحل",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-400">
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={100}>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-rose-500/[0.06] to-amber-500/[0.06] p-10 text-center backdrop-blur-sm sm:p-14">
            <h2 className="font-[family-name:var(--font-lalezar)] text-3xl font-bold text-white sm:text-4xl">
              آماده‌اید تتوی رویایی‌تان را بسازید؟
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              همین الان هنرمند مورد نظرتان را پیدا کنید و به‌صورت آنلاین وقت رزرو کنید.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-rose-600 to-rose-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:shadow-xl hover:shadow-rose-600/30"
              >
                جستجوی هنرمند
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/[0.08]"
              >
                ثبت‌نام رایگان
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </>
  );
}
