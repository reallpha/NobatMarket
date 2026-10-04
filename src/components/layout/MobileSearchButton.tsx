"use client";

// ============================================================================
// دکمه جستجوی موبایل هدر + تجربه جستجوی سریع Mobile-first
// استایل دقیقاً هم‌اندازه و هم‌خانواده دکمه همبرگری
// ============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Suggest = {
  artists: { slug: string; name: string; city: string | null; verified: boolean; rating: number; styles: string[]; avatar: string | null }[];
  styles: { value: string; label: string }[];
  cities: string[];
  popularSearches: string[];
  allCities: string[];
};

function proxyUrl(url: string) {
  // هر آدرس خارجی از مسیر پروکسی خودمان سرو می‌شود و مسیرهای داخلی دست‌نخورده می‌مانند
  if (!url || url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export default function MobileSearchButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // رندر در body تا backdrop-blur هدر، موقعیت fixed را خراب نکند
  useEffect(() => {
    const el = document.createElement("div");
    el.id = "mobile-search-portal";
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
        setSuggest(await res.json());
      } catch {
        /* silent */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open ]);

  const goArtists = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    setOpen(false);
    router.push(`/artists?${sp.toString()}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="جستجوی آرتیست"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white active:scale-95 md:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>

      {open && portalEl && createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col bg-zinc-950/95 backdrop-blur-xl md:hidden" role="dialog" aria-label="جستجوی سریع">
          {/* نوار جستجو */}
          <div className="flex items-center gap-2 border-b border-zinc-800/80 p-3">
            <button
              onClick={() => setOpen(false)}
              aria-label="بستن جستجو"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goArtists({ query: query.trim(), city }); }}
                placeholder="نام آرتیست، سبک، ایده..."
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900 py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/60"
              />
            </div>
          </div>

          {/* شهر */}
          <div className="border-b border-zinc-800/60 px-3 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="shrink-0 text-[11px] text-zinc-600">شهر:</span>
              <button
                onClick={() => setCity("")}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] ${!city ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-zinc-800 text-zinc-400"}`}
              >
                همه
              </button>
              {(suggest?.allCities || []).slice(0, 12).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(city === c ? "" : c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] ${city === c ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-zinc-800 text-zinc-400"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* نتایج */}
          <div className="flex-1 overflow-y-auto p-3">
            {query.trim() === "" ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold text-zinc-600">جستجوهای محبوب</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(suggest?.popularSearches || []).map((p) => (
                      <button
                        key={p}
                        onClick={() => goArtists({ query: p, city })}
                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => goArtists({ query: "", city })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-500 to-rose-600 py-3 text-sm font-bold text-white"
                >
                  مشاهده همه هنرمندان
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(suggest?.artists?.length || 0) > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold text-zinc-600">هنرمندان</p>
                    <div className="space-y-1.5">
                      {suggest!.artists.map((a) => (
                        <Link
                          key={a.slug}
                          href={`/artists/${a.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-2.5"
                        >
{a.avatar ? (
                              <img src={proxyUrl(a.avatar)} alt="" className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover" />
                            ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-base font-black text-rose-300">{a.name[0]}</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1 text-sm font-bold text-white">
                              <span className="truncate">{a.name}</span>
                              {a.verified && <span className="text-[10px] text-emerald-400">✓</span>}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">{a.city || ""}{a.styles.length > 0 ? ` · ${a.styles.join("، ")}` : ""}</span>
                          </span>
                          <svg className="h-4 w-4 shrink-0 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {(suggest?.styles?.length || 0) > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold text-zinc-600">سبک‌ها</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggest!.styles.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => goArtists({ style: s.value, city })}
                          className="rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => goArtists({ query: query.trim(), city })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-bold text-white"
                >
                  مشاهده همه نتایج «{query.trim()}»
                </button>
              </div>
            )}
          </div>
        </div>,
        portalEl
      )}
    </>
  );
}
