export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getInspirationItems, getAvailableStyles } from "@/services/inspiration.service";
import { TATTOO_STYLE_LABELS, toPersianNumbers } from "@/lib/utils";
import InspirationCard from "@/components/features/portfolio/InspirationCard";

export const metadata: Metadata = {
  title: "الهام‌بخشی",
  description: "از بهترین نمونهای هنرمندان تتو ایران",
};
export default async function InspirationPage({ searchParams }: { searchParams: { style?: string; page?: string } }) {
  const [result, styles] = await Promise.all([
    getInspirationItems({ style: searchParams.style, page: searchParams.page ? parseInt(searchParams.page) : 1, pageSize: 24 }),
    getAvailableStyles(),
  ]);
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative overflow-hidden border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,68,68,0.06)_0%,_rgba(234,179,8,0.04)_30%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-sm text-rose-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              گالری الهام‌بخش
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              الهام‌بخشی از {" "}
              <span className="bg-gradient-to-l from-rose-500 to-amber-500 bg-clip-text text-transparent">
                بهترین نمونه‌ها
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              از بهترین نمونه‌کارهای هنرمندان تتو ایران الهام بگیرید.
            </p>
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{result.totalItems}+</div>
                <div className="text-xs text-zinc-500">نمونه‌کار</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{styles.length}</div>
                <div className="text-xs text-zinc-500">سبک تتو</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">۱۰+</div>
                <div className="text-xs text-zinc-500">هنرمند</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* نوار دسته‌بندی: در هیچ اندازه‌ای چسبنده نیست */}
      <div className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <Link href="/inspiration" className={!searchParams.style ? "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all bg-rose-500 text-white" : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"}>همه</Link>
            {styles.map((s) => (<Link key={s.style} href={"/inspiration?style=" + s.style} className={searchParams.style === s.style ? "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all bg-rose-500 text-white" : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"}>{TATTOO_STYLE_LABELS[s.style] || s.style}<span className={searchParams.style === s.style ? "rounded-full px-1.5 py-0.5 text-[10px] bg-white/20 text-white" : "rounded-full px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-500"}>{toPersianNumbers(s.count)}</span></Link>))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-20 text-center">
            <h3 className="mt-4 text-xl font-semibold text-white">اثری یافت نشد</h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">فیلترها را تغییر دهید.</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {result.items.map((item: any, index: number) => (
              <InspirationCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
        {result.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (searchParams.style) params.set("style", searchParams.style);
              params.set("page", String(p));
              return (<Link key={p} href={"/inspiration?" + params.toString()} className={p === result.page ? "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium bg-rose-500 text-white" : "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"}>{toPersianNumbers(p)}</Link>);
            })}
          </div>
        )}
      </div>
    </div>
  );
}
