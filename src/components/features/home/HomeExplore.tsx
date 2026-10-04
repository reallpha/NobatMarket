"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toPersianNumbers } from "@/lib/utils";

// ============================================================================
// بخش «کاوش» صفحه اصلی: دسته‌بندی کامل سبک‌های تتو + آخرین نمونه‌کارها
// ============================================================================

interface Category {
  style: string;
  label: string;
  count: number;
  image: string | null;
}

interface Work {
  id: string;
  title: string;
  image: string;
  style: string;
  styleLabel: string;
  likeCount: number;
  saveCount: number;
  artist: {
    slug: string;
    artistName: string;
    isVerified: boolean;
    avatarUrl: string | null;
  };
}

export default function HomeExplore() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [works, setWorks] = useState<Work[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    setIsMobile(mql.matches);
    const on = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/home/explore")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setWorks(Array.isArray(data?.latestWorks) ? data.latestWorks : []);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
        setWorks([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#07070a] to-zinc-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-rose-500/[0.08] blur-[250px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

      {/* Grunge Sticker Decorations */}
      <img src="/image/675f5a13e2ebe46fa2b2b699_sticker-bird.png" alt="" className="absolute top-16 right-4 sm:right-12 w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 opacity-[0.04] pointer-events-none select-none" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />
      <img src="/image/675f797eb0486ab0bf26f553_sticker-payment.png" alt="" className="hidden sm:absolute bottom-24 left-4 sm:left-12 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 opacity-[0.04] pointer-events-none select-none rotate-12" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-rose-500/25 bg-rose-500/[0.08] px-5 py-2.5 text-sm font-medium text-rose-400 backdrop-blur-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.91-2.01L12 1z" /></svg>
            {"\u06A9\u0627\u0648\u0634 \u062F\u0631 \u062F\u0646\u06CC\u0627\u06CC \u062A\u062A\u0648"}
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">
            {"\u0633\u0628\u06A9\u200C\u0647\u0627 \u0648 \u062A\u0627\u0632\u0647\u200C\u062A\u0631\u06CC\u0646 \u0622\u062B\u0627\u0631"}
          </h2>
          <p className="mt-3 max-w-xl text-center mx-auto text-sm leading-relaxed text-zinc-400">
            {"\u0647\u0645\u0647 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC\u200C\u0647\u0627\u06CC \u062A\u062A\u0648 \u0631\u0627 \u0628\u0628\u06CC\u0646 \u0648 \u0627\u0632 \u062C\u062F\u06CC\u062F\u062A\u0631\u06CC\u0646 \u0627\u062B\u0631\u0647\u0627\u06CC \u0647\u0646\u0631\u0645\u0646\u062F\u0627\u0646 \u0627\u06CC\u0631\u0627\u0646 \u0627\u0644\u0647\u0627\u0645 \u0628\u06AF\u06CC\u0631"}
          </p>
        </div>

        {/* ── دسته‌بندی سبک‌ها ── */}
        {categories !== null && categories.length > 0 && (
          <div className="mb-16">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12l4 4V7a2 2 0 00-2-2H4z" /></svg>
                {"\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0633\u0628\u06A9\u200C\u0647\u0627"}
              </h3>
              <Link href="/inspiration" className="group relative inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-1.5 text-xs font-semibold text-rose-300 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.12)] transition-all duration-300 hover:border-rose-500/40 hover:bg-rose-500/[0.1] hover:text-rose-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                {"\u0645\u0634\u0627\u0647\u062F\u0647 \u0647\u0645\u0647"}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {categories
                .filter((cat) => isMobile ? cat.style !== "FINE_LINE" : true)
                .map((cat) => (
                <Link
                  key={cat.style}
                  href={`/inspiration?style=${cat.style}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900 transition-all duration-500 hover:border-rose-500/40 hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.label}
                      width={400}
                      height={500}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <span className="font-lalezar text-6xl text-white/[0.08]">{cat.label.replace(/[^\u0600-\u06FF\uFB8A ]/g, "").trim().charAt(0) || "ت"}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                    {toPersianNumbers(cat.count)} {"\u0622\u062B\u0627\u0631"}
                  </span>
                  <div className="absolute bottom-3 right-3 left-3">
                    <span className="block truncate text-sm font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                      {cat.label.split(" (")[0]}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-zinc-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      {"\u0645\u0634\u0627\u0647\u062F\u0647 \u0622\u062B\u0627\u0631"}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── آخرین نمونه‌کارها ── */}
        {works !== null && works.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                {"\u062A\u0627\u0632\u0647\u200C\u062A\u0631\u06CC\u0646 \u0627\u062B\u0631\u0647\u0627\u06CC \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647"}
              </h3>
              <Link href="/inspiration" className="group relative inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.12)] transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/[0.1] hover:text-amber-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                {"\u0645\u0634\u0627\u0647\u062F\u0647 \u0647\u0645\u0647"}
              </Link>
            </div>

            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {works.map((w) => (
                <Link
                  key={w.id}
                  href={`/artists/${w.artist.slug}`}
                  className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 transition-all duration-500 hover:border-rose-500/30"
                >
                  <div className="relative overflow-hidden">
                    <img src={w.image} alt={w.title} width={400} height={300} loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute right-3 top-3 rounded-lg bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg shadow-rose-500/30 transition-all duration-500 group-hover:opacity-100">
                      {w.styleLabel.split(" (")[0]}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                        {w.artist.avatarUrl ? (
                          <img src={w.artist.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-400">{w.artist.artistName.charAt(0)}</span>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-zinc-300 group-hover:text-white transition-colors">
                        {w.artist.artistName}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>


          </div>
        )}

        {/* Loading skeleton */}
        {categories === null && (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-zinc-800/60" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-800/40" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
