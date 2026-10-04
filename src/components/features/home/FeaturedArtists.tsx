"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demoPhoto, localizeDemoImage } from "@/lib/demo/images";

const styleLabels: Record<string, string> = {
  REALISM: "رئالیسم",
  FINE_LINE: "فاین\u200cلاین",
  MINIMAL: "مینیمال",
  DOTWORK: "داتورک",
  BLACKWORK: "بلک\u200cورک",
  WATERCOLOR: "واتروکالر",
  GEOMETRIC: "ژئومتریک",
  NEO_TRADITIONAL: "نئوتید",
  BLACK_AND_GREY: "سیاه و سفید",
  OLD_SCHOOL: "اولد اسکول",
  JAPANESE: "ژاپنی",
  TRIBAL: "ترایبال",
  LINE_ART: "لاین آرت",
};

function getStyleLabel(style: string): string {
  return styleLabels[style] || style.replace(/_/g, " ");
}

interface Artist {
  slug: string;
  name: string;
  city: string;
  styles: string[];
  rating: number;
  reviewCount: number;
  avatar: string | null;
  cover: string | null;
  verified: boolean;
}

// تصاویر نمایشی محلی‌اند؛ این تابع فقط رکوردهای قدیمی را هم به مسیر محلی می‌برد
function proxyUrl(url: string | null | undefined): string {
  return localizeDemoImage(url) || "";
}

const fallbackArtists: Artist[] = [
  { slug: "dara-art", name: "دارا آرت", city: "تهران", styles: ["REALISM", "BLACK_AND_GREY"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("2379004", 400), cover: demoPhoto("18214363", 800), verified: true },
  { slug: "ramin-classic", name: "رامین کلاسیک", city: "تبریز", styles: ["OLD_SCHOOL", "TRIBAL"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("220453", 400), cover: demoPhoto("19491552", 800), verified: true },
  { slug: "kian-blackwork", name: "کیان بلک‌ورک", city: "اصفهان", styles: ["BLACKWORK", "JAPANESE"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("1516680", 400), cover: demoPhoto("2181312", 800), verified: true },
  { slug: "parsa-tattoo", name: "پارسا تتو", city: "شیراز", styles: ["NEO_TRADITIONAL", "OLD_SCHOOL"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("2379005", 400), cover: demoPhoto("2865412", 800), verified: true },
  { slug: "nika-studio", name: "نیکا استودیو", city: "تهران", styles: ["MINIMAL", "LINE_ART"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("3658708", 400), cover: demoPhoto("20267349", 800), verified: true },
  { slug: "mehdi-darkart", name: "مهدی دارک‌آرت", city: "مشهد", styles: ["BLACKWORK", "DOTWORK"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("3785079", 400), cover: demoPhoto("28919353", 800), verified: true },
  { slug: "yasna-creative", name: "یاسنا کریتیو", city: "اصفهان", styles: ["GEOMETRIC", "DOTWORK"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("1239291", 400), cover: demoPhoto("1993189", 800), verified: true },
  { slug: "ali-test", name: "علی هنرمند", city: "تهران", styles: ["REALISM", "MINIMAL"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("7448095", 400), cover: demoPhoto("3785079", 800), verified: true },
  { slug: "sara-studio", name: "سارا استودیو", city: "کرج", styles: ["WATERCOLOR", "FINE_LINE"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("1065084", 400), cover: demoPhoto("2693526", 800), verified: true },
  { slug: "reza-ink", name: "رضا اینک", city: "همدان", styles: ["BLACK_AND_GREY", "REALISM"], rating: 4.5, reviewCount: 0, avatar: demoPhoto("2379004", 400), cover: demoPhoto("2865412", 800), verified: true },
];

function ArtistCard({ artist }: { artist: Artist }) {
  const mainImage = artist.avatar || artist.cover;
  return (
    <a
      href={`/artists/${artist.slug}`}
      className="group relative block h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]"
    >
      {/* تصویر اصلی: عکس پروفایل خود هنرمند (نه نمونه‌کار) */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        {mainImage ? (
          <img
            alt={`${artist.name}`}
            src={mainImage}
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-lalezar text-white/[0.07]">{artist.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        {/* نشان تأیید */}
        {artist.verified && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/30 backdrop-blur-md">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            تأییدشده
          </span>
        )}

        {/* سبک‌ها + رتبه */}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {artist.styles.slice(0, 2).map((style) => (
              <span key={style} className="rounded-full bg-white/[0.92] px-2.5 py-1 text-[10px] font-medium text-zinc-900 shadow-lg">{getStyleLabel(style)}</span>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[11px] font-bold text-amber-300 shadow-lg backdrop-blur-md">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            {artist.rating}
          </span>
        </div>
      </div>

      {/* اطلاعات هنرمند */}
      <div className="p-3 sm:p-4">
        <h3 className="truncate font-bold text-sm text-white transition-colors duration-300 group-hover:text-rose-400 sm:text-base">{artist.name}</h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-zinc-500 sm:text-xs">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="truncate">{artist.city}</span>
          </span>
          <span className="shrink-0 text-[10px] text-zinc-600">{artist.reviewCount > 0 ? `${artist.reviewCount} نظر` : ""}</span>
        </div>
      </div>
    </a>
  );
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<Artist[]>(fallbackArtists);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const touchStartRef = useRef(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/featured-artists")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // تعداد و ترکیب هنرمندان از سمت سرور (تنظیمات ادمین) تعیین می‌شود
          setArtists(data);
        }
      })
      .catch(() => {});
  }, []);

  // Update visible count on resize
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setVisibleCount(5);
      else if (w >= 1024) setVisibleCount(4);
      else if (w >= 640) setVisibleCount(3);
      else setVisibleCount(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const count = artists.length;
  const totalPages = Math.max(1, Math.ceil(count / visibleCount));

  // Reset page if it's out of bounds
  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(0);
  }, [currentPage, totalPages]);

  const goNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // Auto-play
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    autoPlayRef.current = setInterval(goNext, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [goNext, isPaused, totalPages]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goPrev();
      else goNext();
    }
  };

  // Get visible artists for current page
  const startIdx = currentPage * visibleCount;
  const visibleArtists = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleArtists.push(artists[(startIdx + i) % count]);
  }

  return (
    <section
      className="relative py-16 lg:py-24 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Grunge Sticker Decoration */}
      <img src="/image/675f5c4f5e7d150b893b228f_sticker-heart-girl.png" alt="" className="absolute top-8 left-4 sm:left-12 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 opacity-[0.04] pointer-events-none select-none" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />
      <img src="/image/675f797eb0486ab0bf26f553_sticker-payment.png" alt="" className="absolute bottom-8 right-4 sm:right-12 w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 opacity-[0.04] pointer-events-none select-none rotate-6" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-5 py-2.5 text-sm font-medium text-amber-400 backdrop-blur-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.91-2.01L12 1z"/></svg>
            هنرمندان برتر هفته
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">هنرمندهای متمایز</h2>
          <p className="mt-3 max-w-xl text-center mx-auto text-sm leading-relaxed text-zinc-400">انتخاب شده بر اساس امتیاز، کیفیت پورتفولیو و رضایت مشتریان</p>
        </div>

        {/* Grid of cards */}
        <div className="relative">
          <div
            className="grid gap-3 sm:gap-4"
            style={{
              gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
            }}
          >
            {visibleArtists.map((artist, i) => (
              <div key={`page-${currentPage}-${i}-${artist.slug}`} className="animate-fadeIn">
                <ArtistCard artist={artist} />
              </div>
            ))}
          </div>

          {/* Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-3 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-md text-white shadow-lg transition-all duration-300 hover:bg-rose-600 hover:border-rose-500 hover:shadow-rose-500/30 hover:scale-110 active:scale-95"
                aria-label="قبلی"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-3 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-md text-white shadow-lg transition-all duration-300 hover:bg-rose-600 hover:border-rose-500 hover:shadow-rose-500/30 hover:scale-110 active:scale-95"
                aria-label="بعدی"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}

          {/* Gradient fades */}
          <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none z-10" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-10" aria-hidden="true" />
        </div>

        {/* Dots */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5" role="tablist" aria-label="صفحات هنرمندان">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`relative h-2 rounded-full transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                  i === currentPage
                    ? "w-10 bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.5)]"
                    : "w-2 bg-zinc-700 hover:bg-zinc-500"
                }`}
                role="tab"
                aria-selected={i === currentPage}
                aria-label={`صفحه ${i + 1}`}
              >
                <span className="sr-only">صفحه {i + 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
