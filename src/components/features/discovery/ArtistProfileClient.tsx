"use client";

// ============================================================================
// کامپوننت تعاملی پروفایل هنرمند (Client Component)
// شامل: تب‌ها، پورتفولیو، سرویس‌ها، نظرات
// ============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LikeButton from "@/components/features/portfolio/LikeButton";
import {
  TATTOO_STYLE_LABELS,
  TATTOO_SIZE_LABELS,
  formatPrice,
  toPersianNumbers,
  formatJalaliDate,
} from "@/lib/utils";
import type { ArtistProfileFull, ArtistCard } from "@/services/discovery.service";

interface ArtistProfileClientProps {
  artist: ArtistProfileFull;
  relatedArtists: ArtistCard[];
}

// ============================================================================
// تب‌ها
// ============================================================================

type Tab = "portfolio" | "services" | "flash" | "reviews";

const TABS: { key: Tab; label: string; count?: number }[] = [
  { key: "portfolio", label: "پورتفولیو" },
  { key: "services", label: "سرویس‌ها و قیمت" },
  { key: "flash", label: "تتوهای فلش" },
  { key: "reviews", label: "نظرات" },
];

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export default function ArtistProfileClient({
  artist,
  relatedArtists,
}: ArtistProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <>
      {/* ─── Sticky CTA Bar ─── */}
      <div className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Tabs */}
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-rose-500/10 text-rose-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href={`/bookings/new?artist=${artist.slug}`}
            className="hidden rounded-lg bg-gradient-to-l from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(231,68,68,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(231,68,68,0.6)] hover:brightness-110 sm:inline-flex"
          >
            رزرو وقت
          </Link>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ═══ درباره هنرمند ═══ */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-white">درباره هنرمند</h2>
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
            {artist.fullBio ? (
              <p className="leading-relaxed text-zinc-400">{artist.fullBio}</p>
            ) : artist.shortBio ? (
              <p className="leading-relaxed text-zinc-400">{artist.shortBio}</p>
            ) : (
              <p className="text-zinc-600">بیوگرافی ثبت نشده است.</p>
            )}

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "حداقل قیمت",
                  value: artist.minPrice
                    ? formatPrice(artist.minPrice)
                    : "-",
                },
                {
                  label: "حداکثر قیمت",
                  value: artist.maxPrice
                    ? formatPrice(artist.maxPrice)
                    : "-",
                },
                {
                  label: "مدت جلسه",
                  value: `${toPersianNumbers(artist.averageSessionDuration)} دقیقه`,
                },
                {
                  label: "عضویت از",
                  value: formatJalaliDate(artist.createdAt, "short"),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-zinc-800/50 bg-zinc-800/30 p-4"
                >
                  <p className="text-[10px] text-zinc-600">{stat.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ═══ پورتفولیو ═══ */}
        {activeTab === "portfolio" && (
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">
              پورتفولیو
              <span className="mr-2 text-sm font-normal text-zinc-500">
                ({toPersianNumbers(artist.portfolioItems.length)} اثر)
              </span>
            </h2>
            {artist.portfolioItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-16 text-center">
                <svg className="h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <p className="mt-3 text-sm text-zinc-500">هنوز پورتفولیویی ثبت نشده</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {artist.portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:border-zinc-700/50 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                          <svg className="h-10 w-10 text-zinc-700 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="w-full p-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                              {TATTOO_STYLE_LABELS[item.style] || item.style}
                            </span>
                            {item.size && (
                              <span className="rounded-md bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400">
                                {TATTOO_SIZE_LABELS[item.size] || item.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {item.price && (
                          <span className="text-xs font-semibold text-amber-500">
                            {formatPrice(item.price)}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <LikeButton portfolioItemId={item.id} initialLiked={false} initialCount={item.likeCount} isLoggedIn={isLoggedIn} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══ سرویس‌ها ═══ */}
        {activeTab === "services" && (
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">سرویس‌ها و قیمت</h2>
            {artist.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-16 text-center">
                <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="mt-3 text-sm text-zinc-500">هنوز سرویسی ثبت نشده</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {artist.services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          {toPersianNumbers(service.durationMinutes)} دقیقه
                        </p>
                      </div>
                      <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                        {toPersianNumbers(service.bookingCount)} رزرو
                      </span>
                    </div>
                    {service.description && (
                      <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-4 border-t border-zinc-800/50 pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">
                          {formatPrice(service.basePrice)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {service.supportedSizes.map((size) => (
                          <span
                            key={size}
                            className="rounded border border-zinc-800 px-2 py-0.5 text-[10px] leading-relaxed text-zinc-400"
                          >
                            {TATTOO_SIZE_LABELS[size] || size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══ تتوهای فلش ═══ */}
        {activeTab === "flash" && (
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">تتوهای فلش</h2>
            {artist.flashTattoos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-16 text-center">
                <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <p className="mt-3 text-sm text-zinc-500">هنوز تتوی فلشی ثبت نشده</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {artist.flashTattoos.map((flash) => (
                  <div
                    key={flash.id}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-500/30"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={flash.imageUrl}
                        alt={flash.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {/* Price tag */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-amber-400">
                            {formatPrice(flash.price)}
                          </span>
                          {flash.isExclusive && (
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                              اختصاصی
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-white">
                        {flash.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                        <span>{TATTOO_STYLE_LABELS[flash.style] || flash.style}</span>
                        <span>•</span>
                        <span>{toPersianNumbers(flash.viewCount)} بازدید</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══ نظرات ═══ */}
        {activeTab === "reviews" && (
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">
              نظرات مشتریان
              <span className="mr-2 text-sm font-normal text-zinc-500">
                ({toPersianNumbers(artist.reviews.length)} نظر)
              </span>
            </h2>
            {artist.reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-16 text-center">
                <svg className="h-10 w-10 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <p className="mt-3 text-sm text-zinc-500">هنوز نظری ثبت نشده</p>
              </div>
            ) : (
              <div className="space-y-4">
                {artist.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-800">
                        {review.author.avatarUrl ? (
                          <img
                            src={review.author.avatarUrl}
                            alt={review.author.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                            {review.author.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {review.author.displayName}
                          </span>
                          {review.isVerified && (
                            <span className="text-[10px] text-emerald-500">✓ تأیید شده</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "text-amber-400"
                                  : "text-zinc-700"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          {review.comment}
                        </p>
                        <p className="mt-2 text-[10px] text-zinc-600">
                          {formatJalaliDate(review.createdAt, "datetime")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══ هنرمندان مرتبط ═══ */}
        {relatedArtists.length > 0 && (
          <section className="mt-16 border-t border-zinc-800/50 pt-10">
            <h2 className="mb-6 text-lg font-bold text-white">
              هنرمندان مرتبط
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArtists.map((ra) => (
                <Link
                  key={ra.id}
                  href={`/artists/${ra.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-rose-500/30"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800">
                    {ra.user.avatarUrl ? (
                      <img
                        src={ra.user.avatarUrl}
                        alt={ra.artistName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xl">
                        
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-rose-400">
                      {ra.artistName}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {toPersianNumbers(ra.satisfactionScore.toFixed(1))}
                      <span className="mx-1 text-zinc-700">•</span>
                      {ra.shortBio?.substring(0, 40)}...
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Mobile Sticky CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/50 bg-zinc-950/90 p-4 backdrop-blur-xl sm:hidden">
        {(artist as { activeBookingCount?: number }).activeBookingCount !== undefined &&
        (artist as { activeBookingCount?: number }).activeBookingCount! >= 2 ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 py-3.5 text-xs font-medium text-amber-300">
            ظرفیت رزرو این هنرمند تکمیل است
          </div>
        ) : (
          <Link
            href={`/bookings/new?artist=${artist.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-500 to-rose-600 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(231,68,68,0.5)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            رزرو وقت
          </Link>
        )}
      </div>
    </>
  );
}
