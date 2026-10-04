// ============================================================================
// صفحه پروفایل هنرمند - /artists/[slug]
// طراحی پریموم، تاریک و چشمگیر با حس تتو
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtistBySlug, getRelatedArtists } from "@/services/discovery.service";
import { TATTOO_STYLE_LABELS, formatPrice, formatJalaliDate, toPersianNumbers } from "@/lib/utils";
import ArtistProfileClient from "@/components/features/discovery/ArtistProfileClient";
import JsonLd from "@/components/seo/JsonLd";
import { artistSchema, serviceSchema, organizationSchema, websiteSchema } from "@/lib/schema";

// ============================================================================
// متادیتای SEO (پویا)
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const artist = await getArtistBySlug(params.slug);

  if (!artist) {
    return { title: "هنرمند یافت نشد" };
  }

  const city = artist.city || artist.user.city || "";
  const description = artist.shortBio || `${artist.artistName}، هنرمند تتو ${city ? `در ${city}` : ""} با ${toPersianNumbers(artist.experienceYears || 0)} سال تجربه`;

  return {
    title: `${artist.artistName} | هنرمند تتو${city ? ` در ${city}` : ""} | نوبت مارکت`,
    description,
    openGraph: {
      title: `${artist.artistName} | هنرمند تتو${city ? ` در ${city}` : ""}`,
      description,
      images: artist.portfolioItems[0]?.images[0]
        ? [artist.portfolioItems[0].images[0]]
        : [],
      type: "profile",
      locale: "fa_IR",
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.artistName} | هنرمند تتو`,
      description,
    },
  };
}

// ============================================================================
// صفحه اصلی پروفایل هنرمند
// ============================================================================

export default async function ArtistProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const artist = await getArtistBySlug(params.slug);

  if (!artist) {
    notFound();
  }

  // دریافت هنرمندان مرتبط
  const relatedArtists = await getRelatedArtists(
    artist.slug,
    artist.specializations,
    artist.city || artist.user.city,
    3
  );

  const city = artist.city || artist.user.city || "";
  const coverImage = artist.portfolioItems[0]?.images[0] || null;
  const servicePrices = artist.services.map((s) => s.basePrice).filter((p) => typeof p === "number");
  const startingPrice = servicePrices.length
    ? Math.min(...servicePrices)
    : artist.minPrice ?? null;

  // Build structured data
  const profileUrl = `https://nobat-market.com/artists/${artist.slug}`;
  const artistSchemaData = artistSchema({
    name: artist.artistName,
    slug: artist.slug || "",
    city: artist.city || artist.user.city,
    description: artist.shortBio || undefined,
    avatarUrl: artist.user.avatarUrl || undefined,
    rating: artist.satisfactionScore ? Number(artist.satisfactionScore) : undefined,
    reviewCount: artist._count?.followers ? Number(artist._count.followers) : undefined,
    completedBookings: artist.completedBookings ? Number(artist.completedBookings) : undefined,
    // برچسب‌های فارسی برای داده‌های ساختاریافته (سئو)
    specialties: (artist.specializations || []).map((s) => TATTOO_STYLE_LABELS[s] || s).length
      ? (artist.specializations || []).map((s) => TATTOO_STYLE_LABELS[s] || s)
      : undefined,
    minPrice: startingPrice != null ? Number(startingPrice) : null,
  });
  const servicesSchemas = artist.services
    .filter((s) => s.name)
    .slice(0, 10)
    .map((s) =>
      serviceSchema({
        name: s.name,
        artistName: artist.artistName,
        artistSlug: artist.slug || "",
        price: s.basePrice ? Number(s.basePrice) : undefined,
        description: s.description || undefined,
      })
    );

  return (
    <div className="min-h-screen bg-zinc-950">
      <JsonLd graph={[websiteSchema(), organizationSchema(), artistSchemaData, ...servicesSchemas]} />

      {/* ════════════════════════════════════════════════════════════════
          HERO SECTION (premium) - cover image prominent + framed avatar
          ════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Cover Image / Background */}
        <div className="absolute inset-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt={artist.artistName}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent" />
        </div>

        {/* Background grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4v4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        {/* Subtle glow accent */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 h-64 w-64 rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
          <div className="flex flex-col items-center gap-8 sm:gap-10 lg:flex-row lg:items-center lg:gap-12">
            {/* Framed Profile Picture */}
            <div className="relative shrink-0">
              {/* قاب شیشه‌ایِ چرخیده (تزئینی) */}
              <div className="absolute -top-3 -left-3 h-36 w-36 rotate-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent lg:h-44 lg:w-44" aria-hidden="true" />
              {/* هاله نور */}
              <div className="absolute -inset-5 rounded-[2rem] bg-rose-500/10 blur-3xl" aria-hidden="true" />
              {/* Inner avatar */}
              <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-zinc-700/60 bg-zinc-800 shadow-[0_0_50px_-12px_rgba(231,68,68,0.35)] transition-all duration-500 hover:border-rose-500/50 hover:shadow-[0_0_60px_-12px_rgba(231,68,68,0.4)] sm:h-40 sm:w-40 lg:h-44 lg:w-44">
                {artist.user.avatarUrl ? (
                  <img
                    src={artist.user.avatarUrl}
                    alt={artist.artistName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/15 to-amber-500/15">
                    <svg className="h-14 w-14 text-rose-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                )}
              </div>
              {/* Verified badge */}
              {artist.isVerified && (
                <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-950 bg-emerald-500 shadow-xl shadow-emerald-500/20">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex-1 text-center lg:text-right">
              <div className="flex flex-col items-center lg:items-end">
                {/* Name */}
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl xl:text-6xl">
                  {artist.artistName}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  {artist.user.displayName}
                  {artist.experienceYears ? ` · ${toPersianNumbers(artist.experienceYears)} سال تجربه` : ""}
                </p>

                {/* Divider */}
                <div className="my-4 h-px w-24 bg-gradient-to-r from-transparent via-zinc-700 to-transparent lg:h-0.5 lg:my-5" />

                {/* Meta info */}
                <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-400 lg:justify-start">
                  {city && (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-zinc-300">{city}</span>
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {artist.specializations.map((style) => (
                    <Link
                      key={style}
                      href={`/inspiration?style=${style}`}
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 transition-all hover:bg-rose-500/20 hover:border-rose-500/40"
                    >
                      {TATTOO_STYLE_LABELS[style] || style}
                    </Link>
                  ))}
                </div>

                {/* CTA + قیمت شروع */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  {(artist as { activeBookingCount?: number }).activeBookingCount !== undefined &&
                  (artist as { activeBookingCount?: number }).activeBookingCount! >= 2 ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-6 py-3 text-sm font-medium text-amber-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ظرفیت رزرو این هنرمند تکمیل است — پس از اتمام پروژه‌های جاری دوباره تلاش کنید
                    </div>
                  ) : (
                    <Link
                      href={`/bookings/new?artist=${artist.slug}`}
                      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-l from-rose-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(231,68,68,0.6)] transition-all duration-300 hover:shadow-[0_0_40px_-6px_rgba(231,68,68,0.7)] hover:brightness-110 active:scale-[0.98]"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      رزرو وقت
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                    </Link>
                  )}
                  {startingPrice !== null && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 backdrop-blur-md">
                      <span className="text-xs text-zinc-400">شروع از</span>
                      <span className="text-sm font-bold text-amber-400">{formatPrice(startingPrice)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* نوار آمار — پنل شیشه‌ای تمام‌عرض، حرفه‌ای و متوازن */}
          <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-1.5 bg-zinc-950/60 px-4 py-5 transition-colors duration-300 hover:bg-zinc-900/60">
              <span className="text-2xl font-bold leading-none text-white">{toPersianNumbers(artist.completedBookings)}</span>
              <span className="text-[11px] font-medium text-zinc-500">تتو انجام‌شده</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-zinc-950/60 px-4 py-5 transition-colors duration-300 hover:bg-zinc-900/60">
              <span className="text-2xl font-bold leading-none text-white">{toPersianNumbers(artist._count.followers)}</span>
              <span className="text-[11px] font-medium text-zinc-500">فالوور</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-zinc-950/60 px-4 py-5 transition-colors duration-300 hover:bg-zinc-900/60">
              <span className="flex items-center gap-1.5 text-2xl font-bold leading-none text-amber-300">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {toPersianNumbers(artist.satisfactionScore.toFixed(1))}
              </span>
              <span className="text-[11px] font-medium text-zinc-500">امتیاز رضایت</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT (Client Component for tabs)
          ════════════════════════════════════════════════════════════════ */}
      <ArtistProfileClient
        artist={artist}
        relatedArtists={relatedArtists}
      />
    </div>
  );
}
