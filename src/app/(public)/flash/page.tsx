export const dynamic = "force-dynamic";

// ============================================================================
// صفحه گالری تتوهای فلش - /flash
// طراحی پریموم، تاریک و بصری
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { getAvailableFlashes } from "@/services/flash.service";
import { TATTOO_STYLE_LABELS, formatPrice, toPersianNumbers } from "@/lib/utils";
import FlashCard from "@/components/features/flash/FlashCard";

export const metadata: Metadata = {
  title: "تتوهای فلش",
  description:
    "طرح‌های آماده و فلش تتو از بهترین هنرمندان ایران. طرح مورد نظرتان را پیدا کنید و فوراً رزرو کنید.",
  openGraph: {
    title: "تتوهای فلش",
    description: "طرح‌های آماده تتو برای رزرو فوری",
    locale: "fa_IR",
  },
};

interface FlashPageProps {
  searchParams: {
    style?: string;
    page?: string;
  };
}

export default async function FlashPage({ searchParams }: FlashPageProps) {
  const result = await getAvailableFlashes({
    style: searchParams.style,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(234,179,8,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
              طرح‌های آماده
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              تتوهای{" "}
              <span className="bg-gradient-to-l from-amber-500 to-rose-500 bg-clip-text text-transparent">
                فلش
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              طرح‌های آماده از بهترین هنرمندان. یک طرح انتخاب کنید و فوراً
              رزرو کنید.
            </p>
          </div>
        </div>
      </div>

      {/* ─── فیلتر سبک ─── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <Link
            href="/flash"
            className={`inline-flex items-center justify-center shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              !searchParams.style
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-800"
            }`}
          >
            همه
          </Link>
          {Object.entries(TATTOO_STYLE_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/flash?style=${key}`}
              className={`inline-flex items-center justify-center shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                searchParams.style === key
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── گرید طرح‌ها ─── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-20 text-center">
            <svg className="mx-auto h-12 w-12 text-amber-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            <h3 className="mt-4 text-xl font-semibold text-white">
              طرحی یافت نشد
            </h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              فیلترها را تغییر دهید ا مشاهده کنید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {result.items.map((flash: any) => (
              <FlashCard key={flash.id} flash={flash} />
            ))}
          </div>
        )}

        {/* ─── Pagination ─── */}
        {result.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
              (p) => {
                const params = new URLSearchParams();
                if (searchParams.style) params.set("style", searchParams.style);
                params.set("page", String(p));

                return (
                  <Link
                    key={p}
                    href={`/flash?${params.toString()}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      p === result.page
                        ? "bg-amber-500 text-black shadow-[0_0_15px_-3px_rgba(234,179,8,0.4)]"
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
      </div>
    </div>
  );
}
