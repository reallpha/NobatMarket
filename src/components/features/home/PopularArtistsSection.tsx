"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toPersianNumbers, formatPrice } from "@/lib/utils";
import { localizeDemoImage } from "@/lib/demo/images";

function getImageUrl(url: string): string {
  // همهٔ تصاویر نمایشی محلی‌اند؛ رکوردهای قدیمی هم به مسیر محلی هدایت می‌شوند
  return localizeDemoImage(url) || "";
}

type PopularArtist = {
  slug: string;
  name: string;
  city: string;
  verified: boolean;
  styles: string[];
  rating: number;
  reviews: number;
  satisfaction: number;
  bookings: number;
  followers: number;
  works: number;
  priceFrom: number | null;
  accepting: boolean;
  avatar: string | null;
  works_images: string[];
};

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3 w-3 ${i < Math.round(value) ? "text-amber-400" : "text-zinc-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function PopularArtistsSection() {
  const [artists, setArtists] = useState<PopularArtist[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/popular-artists")
      .then((r) => r.json())
      .then((data) => { if (active) setArtists(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setArtists([]); });
    return () => { active = false; };
  }, []);

  if (!artists || artists.length === 0) return null;
  const displayArtists = artists.slice(0, 4);

  return (
    <section className="relative overflow-hidden py-14 lg:py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#0b0a08] to-zinc-950" />
      <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.05] blur-[200px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* تیتر */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-4 py-1.5 text-xs font-medium text-amber-400">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            منتخب نوبت مارکت
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">
            محبوب‌ترین <span className="bg-gradient-to-l from-amber-400 to-rose-400 bg-clip-text text-transparent">هنرمندان</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            بر اساس نمونه‌کار واقعی، امتیاز مشتریان و سابقه رزرو — بدون هیچ انتخاب دستی.
          </p>
        </div>

        {/* کارت‌ها */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayArtists.map((a, idx) => (
            <Link
              key={a.slug}
              href={`/artists/${a.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/25 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              {/* نمونه‌کارهای شاخص */}
              <div className="grid grid-cols-3 gap-1 p-1.5 pb-0">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`overflow-hidden bg-zinc-800/60 ${i === 0 ? "rounded-r-xl" : ""} ${i === 2 ? "rounded-l-xl" : ""} aspect-square`}>
                    {a.works_images[i] ? (
                      <img
                        src={getImageUrl(a.works_images[i])}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-zinc-700">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* هویت */}
              <div className="p-4">
                <div className="flex flex-col items-start gap-1.5 text-right">
                  <p className="flex items-center gap-1.5 truncate text-[15px] font-black text-white group-hover:text-amber-300">
                    <span className="truncate">{a.name}</span>
                    {a.verified && (
                      <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                    {a.city}
                  </p>
                </div>

                {/* سبک‌ها */}
                {a.styles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.styles.map((s) => (
                      <span key={s} className="rounded-full border border-rose-500/20 bg-rose-500/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-rose-300">{s}</span>
                    ))}
                  </div>
                )}

                {/* امتیاز و آمار */}
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <span className="flex items-center gap-1.5">
                    <Stars value={a.rating} />
                    <span className="text-[11px] text-zinc-500">({toPersianNumbers(a.reviews)} نظر)</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {toPersianNumbers(a.bookings)} رزرو موفق · {toPersianNumbers(a.works)} نمونه‌کار
                  </span>
                </div>

                {/* قیمت و وضعیت */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    {a.priceFrom ? <>شروع از {formatPrice(a.priceFrom)}</> : "تماس بگیرید"}
                  </span>
                  <span className={`flex items-center gap-1.5 text-[11px] font-medium ${a.accepting ? "text-emerald-400" : "text-zinc-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${a.accepting ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    {a.accepting ? "پذیرش رزرو" : "تکمیل ظرفیت"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/artists"
            className="group inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-7 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500/[0.14] hover:text-white"
          >
            مشاهده همه هنرمندان
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
