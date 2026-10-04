"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


type Suggest = {
  artists: { slug: string; name: string; city: string | null; verified: boolean; rating: number; styles: string[]; avatar: string | null }[];
  styles: { value: string; label: string }[];
  cities: string[];
  popularSearches: string[];
  popularCategories: { style: string; label: string; bookings: string }[];
  allCities: string[];
  allStyles: { value: string; label: string }[];
};

const PRICE_PRESETS = [
  { label: "زیر ۲ میلیون", min: "", max: "2000000" },
  { label: "۲ تا ۵ میلیون", min: "2000000", max: "5000000" },
  { label: "۵ میلیون به بالا", min: "5000000", max: "" },
];

function proxyUrl(url: string) {
  // هر آدرس خارجی از مسیر پروکسی خودمان سرو می‌شود و مسیرهای داخلی دست‌نخورده می‌مانند
  if (!url || url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export default function ArtistSearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // پیشنهادها + داده فیلترها
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggest(data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // بستن دراپ‌داون با کلیک بیرون
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const qs = sp.toString();
    router.push(qs ? `/artists?${qs}` : "/artists");
  };

  const submit = () => go({ query: query.trim(), city, style, minPrice, maxPrice });

  const hasSuggest = open && suggest && (suggest.artists.length > 0 || suggest.styles.length > 0 || suggest.cities.length > 0);

  return (
    <section className="relative overflow-hidden py-14 lg:py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#0a0a0d] to-zinc-950" />
      <div className="absolute top-1/2 left-1/2 h-[380px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/[0.07] blur-[220px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* تیتر */}
        <div className="mb-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-4 py-1.5 text-xs font-medium text-amber-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            جستجوی آرتیست
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">
            آرتیست تتوی مناسب رو جستجو کن
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            از ایده تا رزرو، فقط چند کلیک فاصله داری.
          </p>
        </div>

        {/* کارت جستجو */}
        <div ref={boxRef} className="relative rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* عبارت جستجو */}
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter") { setOpen(false); submit(); } }}
                placeholder="نام آرتیست، سبک، ایده... "
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/60 py-3 pl-4 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-rose-500/60"
              />
              {/* دراپ‌داون پیشنهادها */}
              {hasSuggest && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-black/60">
                  {loading && <p className="px-4 py-2 text-[11px] text-zinc-600">در حال جستجو...</p>}
                  {suggest.artists.length > 0 && (
                    <div className="border-b border-zinc-800/60 py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-zinc-600">هنرمندان</p>
                      {suggest.artists.map((a) => (
                        <Link key={a.slug} href={`/artists/${a.slug}`} className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-white/[0.04]">
                          {a.avatar ? (
                            <img src={proxyUrl(a.avatar)} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xs font-bold text-rose-300">{a.name[0]}</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                              <span className="truncate">{a.name}</span>
                              {a.verified && <span className="shrink-0 text-[10px] text-emerald-400">✓</span>}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">{a.city || ""}{a.styles.length > 0 ? ` · ${a.styles.join("، ")}` : ""}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {suggest.styles.length > 0 && (
                    <div className="border-b border-zinc-800/60 py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-zinc-600">سبک‌ها</p>
                      {suggest.styles.map((s) => (
                        <button key={s.value} onClick={() => go({ style: s.value, city })} className="flex w-full items-center gap-2 px-4 py-2 text-right text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white">
                          <svg className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggest.cities.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-zinc-600">شهرها</p>
                      {suggest.cities.map((c) => (
                        <button key={c} onClick={() => { setCity(c); go({ query: query.trim(), city: c, style }); }} className="flex w-full items-center gap-2 px-4 py-2 text-right text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white">
                          <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                          آرتیست‌های {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* شهر */}
            <div className="relative sm:w-40">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-700/60 bg-zinc-950/60 py-3 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-rose-500/60 hover:border-zinc-600/60"
              >
                <option value="">همه شهرها</option>
                {(suggest?.allCities || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            {/* سبک */}
            <div className="relative sm:w-40">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-700/60 bg-zinc-950/60 py-3 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-rose-500/60 hover:border-zinc-600/60"
              >
                <option value="">همه سبک‌ها</option>
                {(suggest?.allStyles || []).map((s) => (
                  <option key={s.value} value={s.value}>{s.label.split(" (")[0]}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            {/* محدوده قیمت */}
            <div className="relative sm:w-40">
              <select
                value={`${minPrice}-${maxPrice}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split("-");
                  setMinPrice(min || "");
                  setMaxPrice(max || "");
                }}
                className="w-full appearance-none rounded-xl border border-zinc-700/60 bg-zinc-950/60 py-3 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-rose-500/60 hover:border-zinc-600/60"
              >
                <option value="-">همه قیمت‌ها</option>
                {PRICE_PRESETS.map((p) => (
                  <option key={p.label} value={`${p.min}-${p.max}`}>{p.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            {/* دکمه */}
            <button
              onClick={submit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_25px_-8px_rgba(231,68,68,0.7)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              پیدا کن
            </button>
          </div>


        </div>

        {/* چطور کار می‌کنه — کامپکت شیشه‌ای */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-center text-sm font-bold text-zinc-400">
            نوبت مارکت چطور کار می‌کنه؟
          </p>
          <div className="w-full grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { n: "۱", t: "ایده بگیر", d: "جستجو کن و انتخاب کن" },
              { n: "۲", t: "مقایسه کن", d: "نمونه‌کار و قیمت رو ببین" },
              { n: "۳", t: "رزرو کن", d: "آنلاین وقت بگیر" },
              { n: "۴", t: "تتو بزن", d: "تجربه‌ت رو ثبت کن" },
            ].map((s, i) => (
              <div key={i} className="relative flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-lg font-black leading-none">{s.n}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-snug">{s.t}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


