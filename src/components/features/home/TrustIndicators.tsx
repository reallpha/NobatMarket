"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  { title: "پرداخت امن", desc: "درگاه زرین‌پال با رمزنگاری بانکی، پول تا تکمیل جلسه در امان‌ست", color: "cyan" },
  { title: "هنرمندان تأییدشده", desc: "احراز هویت، چک سابقه کار، پورتفولیو بررسی‌شده", color: "amber" },
  { title: "ضمان رضایت", desc: "بازپرداخت کامل در صورت عدم تطابق با طرح نهایی", color: "emerald" },
  { title: "پوشش سراسری", desc: "۳۰+ شهر، ۵۰۰+ هنرمند، استودیوهای استاندارد", color: "rose" },
  { title: "کیف پول دیجیتال", desc: "مدیریت درآمد، برداشت آسان، تاریخچه تراکنش شفاف", color: "purple" },
  { title: "پشتیبانی ۲۴/۷", desc: "تیم پشتیبانی همیشه در خدمت، حل مسائل در کمتر از ۱ ساعت", color: "cyan" },
];

const featureColors: Record<string, { icon: string; bg: string }> = {
  cyan: { icon: "text-cyan-400", bg: "bg-cyan-500/10" },
  amber: { icon: "text-amber-400", bg: "bg-amber-500/10" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10" },
  rose: { icon: "text-rose-400", bg: "bg-rose-500/10" },
  purple: { icon: "text-purple-400", bg: "bg-purple-500/10" },
};

const featureIcons = [
  <svg key="shield" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  <svg key="award" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  <svg key="truck" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.6 9.64a1 1 0 0 0-.78-.62H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>,
  <svg key="credit" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  <svg key="message" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
];

const reviews = [
  { rating: 5, content: "یک گل رز رئالیستیک رو بازو زدم، دارا آرت جزئیات برگ‌ها رو خیلی طبیعی اجرا کرد. رنگ‌ها بعد ۳ ماه هنوز زنده‌ان و همه فکر می‌کنن عکسه. از رزرو آنلاین تا روز اجرا همه چیز راحت و حرفه‌ای بود.", author: "امیر حسینی", city: "تهران", style: "رئالیستیک", artist: "دارا آرت", slug: "dara-art" },
  { rating: 5, content: "طراحی مینیمال یک خط بی‌وقفه از گوش تا فک رو نیکا استودیو انجام داد. اولش نگران بودم خط کج بشه ولی نتیجه بی‌نقص دراومد. پاک‌کاری و نظافت هم عالی بود.", author: "سارا رحیمی", city: "تهران", style: "فاین‌لاین مینیمال", artist: "نیکا استودیو", slug: "nika-studio" },
  { rating: 5, content: "یک طرح ژاپنی کامل شامل اژدها و ابر رو کمرم زدم. کیان بلک‌ورک توی جزئیات فلس‌ها و سایه‌ها واقعاً استاده. سه جلسه طول کشید ولی هر جلسه صبورانه کار کرد. قیمتش هم منصفانه بود.", author: "محمد تقوی", city: "اصفهان", style: "ژاپنی بلک‌ورک", artist: "کیان بلک‌ورک", slug: "kian-blackwork" },
  { rating: 5, content: "طرح ژئومتریک رو پشت گوشم زدم، یاسنا کریتیو خیلی دقیق زاویه‌ها رو رعایت کرد. خطوط صاف و منظم و فاصله‌ها یکسانه. توی مصاحبه کاری هم کسی متوجه نمیشه چون خیلی ظریفه.", author: "نگار عباسی", city: "اصفهان", style: "ژئومتریک", artist: "یاسنا کریتیو", slug: "yasna-creative" },
  { rating: 5, content: "اولین تتوی عمرم بود و خیلی استرس داشتم. مهدی دارک‌آرت اول طرحم رو با مداد روی پوست کشید تا مطمئن بشیم. بلک‌ورک روی ساعدم خیلی شیک دراومد و حتی مامانم خوشش اومد!", author: "امید کریمی", city: "مشهد", style: "بلک‌ورک", artist: "مهدی دارک‌آرت", slug: "mehdi-darkart" },
  { rating: 5, content: "یک تتوی نئو تریدیشنال شامل سر ببر و گل‌های صورتی رو بازو زدم. پارسا تتو ترکیب رنگ‌ها رو خیلی خوب انتخاب کرد — صورتی‌های تیره و روشن کنار هم. رزرو از طریق نوبت مارکت خیلی راحت بود.", author: "رها مهرابی", city: "شیراز", style: "نئو تریدیشنال", artist: "پارسا تتو", slug: "parsa-tattoo" },
  { rating: 5, content: "طراحی ترایبال روی شونه‌ام رو رامین کلاسیک انجام داد. خطوط ضخیم و دقیق و تقارن کامل. ۵ ساله تتو دارم ولی این یکی بهترینشونه. پیشنهاد می‌دم حتماً از نوبت مارکت رزرو کنید.", author: "بهرام نوری", city: "تبریز", style: "ترایبال", artist: "رامین کلاسیک", slug: "ramin-classic" },
];function Testimonials() {
  const [perView, setPerView] = useState(1);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // تعداد کارت نمایان بر اساس عرض صفحه
  useEffect(() => {
    const compute = () => setPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const maxIndex = Math.max(0, reviews.length - perView);

  // پخش خودکار (با توقف هنگام هاور)
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((p) => (p >= maxIndex ? 0 : p + 1)), 6000);
    return () => clearInterval(t);
  }, [paused, maxIndex]);

  // ریست هنگام تغییر اندازه
  useEffect(() => { setActive((p) => Math.min(p, maxIndex)); }, [maxIndex]);

  const prev = () => setActive((p) => Math.max(0, p - 1));
  const next = () => setActive((p) => Math.min(maxIndex, p + 1));

  return (
    <div
      className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 lg:p-10 backdrop-blur-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* هدر */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1"/></svg></span>
          <div>
            <h3 className="font-lalezar text-xl text-white">نظرات مشتریان</h3>
            <p className="text-xs text-zinc-500 mt-0.5">تجربه واقعی کاربرانی که با نوبت مارکت رزرو کردند</p>
          </div>
        </div>

      </div>

      {/* اسلایدر */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(${active * (100 / perView)}%)` }}
        >
          {reviews.map((r, i) => (
            <div key={i} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-all duration-500 hover:border-rose-500/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                {/* علامت نقل‌قول تزئینی */}
                <span className="pointer-events-none absolute -top-1 left-5 select-none font-serif text-7xl leading-none text-rose-500/[0.08] transition-colors duration-500 group-hover:text-rose-500/[0.14]" aria-hidden="true">&rdquo;</span>

                {/* امتیاز */}
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </span>
                  ))}
                </div>

                {/* متن نظر */}
                <p className="mb-5 line-clamp-5 flex-1 text-sm leading-7 text-zinc-300">{r.content}</p>

                {/* نویسنده */}
                <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 ring-1 ring-white/[0.08] text-sm font-bold text-amber-300">{r.author[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-white">{r.author}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-sky-400" aria-label="خرید تأییدشده"><path d="M12 1l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.91-2.01L12 1z"/></svg>
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {r.city} · <span className="text-zinc-400">{r.style}</span> با <a href={`/artists/${r.slug}`} className="text-rose-400 hover:text-rose-300 transition-colors">{r.artist}</a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* کنترل‌ها */}
      <div className="mt-7 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={active === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:pointer-events-none disabled:opacity-30"
          aria-label="قبلی"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-7 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "w-1.5 bg-zinc-700 hover:bg-zinc-600"}`}
              aria-label={`نظر ${toFa(i + 1)}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={active === maxIndex}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:pointer-events-none disabled:opacity-30"
          aria-label="بعدی"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
      </div>
    </div>
  );
}

function toFa(n: number) { return n.toLocaleString("fa-IR"); }

function ShieldSvg() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }

export default function TrustIndicators() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);

  return (
    <section ref={ref} className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#060609] to-zinc-950" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />

      {/* Grunge Sticker Decorations */}
      <img src="/image/675f75edd95bf5ffe0c16b52_sticker-cherubbaby.png" alt="" className="absolute top-12 right-4 sm:right-16 w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 opacity-[0.04] pointer-events-none select-none z-[1]" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-5 py-2.5 text-sm font-medium text-emerald-400 backdrop-blur-sm">
            <ShieldSvg /> اعتماد و امنیت
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">چرا نوبت مارکت؟</h2>

        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const c = featureColors[f.color] || featureColors.cyan;
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="group glass-shimmer-hover card-tilt rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04]" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(25px)", transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 100}ms` }}>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} border border-white/[0.06] group-hover:scale-110 transition-transform duration-300`}><span className={c.icon}>{Icon}</span></div>
                <h3 className="mb-2 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <Testimonials />
      </div>
    </section>
  );
}
