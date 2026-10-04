export const dynamic = "force-dynamic";

// ============================================================================
// صفحه جستجوی هنرمندان - /artists
// طراحی پریموم، تاریک و بصری با حس تتو
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { searchArtists, getAvailableCities, type ArtistSearchFilters } from "@/services/discovery.service";
import { TATTOO_STYLE_LABELS } from "@/lib/utils";
import { toPersianNumbers, formatPrice } from "@/lib/utils";
import ArtistFilters from "@/components/features/discovery/ArtistFilters";

// ============================================================================
// متادیتای SEO
// ============================================================================

export const metadata: Metadata = {
  title: "هنرمندان تتو",
  description:
    "بهترین هنرمندان تتو ایران را بر اساس سبک، شهر، قیمت و رتبه‌بندی جستجو و مقایسه کنید. پیدا کنید، رزرو کنید، خلق کنید.",
  openGraph: {
    title: "هنرمندان تتو",
    description: "بزرگترین دایرکتوری هنرمندان تتو در ایران",
    locale: "fa_IR",
  },
};

// ============================================================================
// Props
// ============================================================================

interface ArtistsPageProps {
  searchParams: {
    query?: string;
    city?: string;
    style?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    verified?: string;
    sort?: string;
    page?: string;
  };
}

// ============================================================================
// کامپوننت اصلی صفحه
// ============================================================================

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  // پارس کردن فیلترها از URL
  const filters: ArtistSearchFilters = {
    query: searchParams.query || undefined,
    city: searchParams.city || undefined,
    style: searchParams.style || undefined,
    minPrice: searchParams.minPrice
      ? parseInt(searchParams.minPrice)
      : undefined,
    maxPrice: searchParams.maxPrice
      ? parseInt(searchParams.maxPrice)
      : undefined,
    minRating: searchParams.minRating
      ? parseFloat(searchParams.minRating)
      : undefined,
    verifiedOnly: searchParams.verified === "true",
    sortBy: (searchParams.sort as ArtistSearchFilters["sortBy"]) || "rating",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 12,
  };

  // دریافت نتایج و شهرها
  const [result, cities] = await Promise.all([
    searchArtists(filters),
    getAvailableCities(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden border-b border-zinc-800/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,68,68,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-sm text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {toPersianNumbers(result.totalItems)} هنرمند فعال
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              هنرمندان{" "}
              <span className="bg-gradient-to-l from-rose-500 to-amber-500 bg-clip-text text-transparent">
                تتو
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              بهترین هنرمندان تتو ایران را کشف کنید. بر اساس سبک، شهر و
              بودجه خود جستجو کنید.
            </p>
          </div>
        </div>
      </div>

      {/* ─── محتوای اصلی ─── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ─── Sidebar فیلترها ─── */}
          <aside className="w-full shrink-0 lg:w-72">
            <ArtistFilters
              cities={cities}
              styles={Object.entries(TATTOO_STYLE_LABELS).map(([key, label]) => ({
                value: key,
                label,
              }))}
              currentFilters={{
                city: searchParams.city || "",
                style: searchParams.style || "",
                minPrice: searchParams.minPrice || "",
                maxPrice: searchParams.maxPrice || "",
                verified: searchParams.verified === "true",
                sort: searchParams.sort || "rating",
              }}
            />
          </aside>

          {/* ─── Grid نتایج ─── */}
          <main className="flex-1">
            {/* نوار ابزار */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                نمایش {toPersianNumbers((result.page - 1) * result.pageSize + 1)} تا{" "}
                {toPersianNumbers(
                  Math.min(result.page * result.pageSize, result.totalItems)
                )}{" "}
                از {toPersianNumbers(result.totalItems)} نتیجه
              </p>
            </div>

            {/* Grid هنرمندان */}
            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-20 text-center backdrop-blur-sm">
                <svg className="mx-auto mb-4 h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <h3 className="text-xl font-semibold text-white">
                  هنرمندی یافت نشد
                </h3>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                  فیلترهای خود را تغییر دهید یا عبارت جستجو را اصلاح کنید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-rose-500/30 hover:bg-zinc-900/80 hover:shadow-[0_16px_50px_-12px_rgba(231,68,68,0.2)]"
                  >
                    {/* ── هدر معرفی: تصویر پروفایل اصلی ── */}
                    <div className="relative overflow-hidden border-b border-zinc-800/50 px-5 pb-5 pt-6">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,68,68,0.08),transparent_60%)]" />
                      <div className="pointer-events-none absolute -left-6 -top-10 h-28 w-28 rounded-full bg-rose-500/[0.06] blur-2xl" />

                      <div className="relative flex items-center gap-4">
                        {/* آواتار بزرگ (تصویر اصلی) */}
                        <div className="relative shrink-0">
                          <div className="absolute -inset-1.5 rounded-[1.4rem] bg-gradient-to-br from-rose-500/25 to-amber-500/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
                          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] transition-all duration-500 group-hover:border-rose-500/50 sm:h-24 sm:w-24">
                            {artist.user.avatarUrl ? (
                              <img
                                src={artist.user.avatarUrl}
                                alt={artist.artistName}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <span className="text-3xl font-bold text-white/25">{artist.artistName[0]}</span>
                            )}
                          </div>
                          {/* نشان تأیید */}
                          {artist.isVerified && (
                            <span className="absolute -bottom-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-900 bg-emerald-500 text-white shadow-lg">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-lg font-bold text-white transition-colors group-hover:text-rose-400 sm:text-xl">
                            {artist.artistName}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {artist.user.displayName}
                          </p>

                          {/* شهر و آمار */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                            {(artist.city || artist.user.city) && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3 w-3 text-rose-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {artist.city || artist.user.city}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {artist.satisfactionScore > 0 ? toPersianNumbers(artist.satisfactionScore.toFixed(1)) : "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3 w-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {toPersianNumbers(artist._count.followers)} فالوور
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* محتوا */}
                    <div className="flex flex-1 flex-col px-5 pt-4">
                      {/* بیو */}
                      {artist.shortBio ? (
                        <p className="line-clamp-2 text-[13px] leading-relaxed text-zinc-400">{artist.shortBio}</p>
                      ) : (
                        <p className="text-[13px] text-zinc-600">هنرمند حرفه‌ای تتو در نوبت مارکت</p>
                      )}

                      {/* سبک‌ها */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {artist.specializations.slice(0, 3).map((style) => (
                          <span key={style} className="rounded-full border border-zinc-800 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                            {TATTOO_STYLE_LABELS[style] || style}
                          </span>
                        ))}
                        {artist.specializations.length > 3 && (
                          <span className="rounded-full border border-zinc-800 bg-zinc-800/60 px-2.5 py-1 text-[10px] text-zinc-500">
                            +{toPersianNumbers(artist.specializations.length - 3)}
                          </span>
                        )}
                      </div>

                      {/* آخرین نمونه‌کار (تصویر شاخص) */}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">آخرین نمونه‌کار</span>
                          <span className="text-[10px] text-zinc-600">
                            {toPersianNumbers(artist._count.portfolioItems)} اثر
                          </span>
                        </div>
                        <div className="relative aspect-[16/8] overflow-hidden rounded-xl border border-white/[0.06]">
                          {artist.portfolioItems[0]?.images[0] ? (
                            <img
                              src={artist.portfolioItems[0].images[0]}
                              alt={`${artist.artistName} - آخرین نمونه‌کار`}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-zinc-800/80 to-zinc-900">
                              <svg className="h-7 w-7 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" /></svg>
                              <span className="text-[10px] text-zinc-600">به‌زودی نمونه‌کار اضافه می‌شود</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 flex translate-y-1 items-center justify-center pb-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                              مشاهده نمونه‌کارها
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" /></svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* پانوشت: قیمت + رزرو */}
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800/50 px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-600">شروع قیمت خدمات</p>
                        {artist.minPrice ? (
                          <p className="truncate text-sm font-bold text-amber-400">{formatPrice(artist.minPrice)}</p>
                        ) : (
                          <p className="text-sm font-medium text-zinc-400">تماس بگیرید</p>
                        )}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-300 group-hover:bg-rose-500 group-hover:shadow-rose-500/30">
                        رزرو
                        <svg className="h-3.5 w-3.5 -scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ─── Pagination ─── */}
            {result.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
                  (p) => {
                    const params = new URLSearchParams();
                    if (searchParams.query) params.set("query", searchParams.query);
                    if (searchParams.city) params.set("city", searchParams.city);
                    if (searchParams.style) params.set("style", searchParams.style);
                    if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
                    if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
                    if (searchParams.minRating) params.set("minRating", searchParams.minRating);
                    if (searchParams.verified) params.set("verified", searchParams.verified);
                    if (searchParams.sort) params.set("sort", searchParams.sort);
                    params.set("page", String(p));

                    return (
                      <Link
                        key={p}
                        href={`/artists?${params.toString()}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          p === result.page
                            ? "bg-rose-500 text-white shadow-[0_0_15px_-3px_rgba(231,68,68,0.4)]"
                            : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {toPersianNumbers(p)}
                      </Link>
                    );
                  }
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
