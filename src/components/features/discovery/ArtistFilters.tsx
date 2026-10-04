"use client";

// ============================================================================
// فیلترهای جستجوی هنرمندان (Client Component)
// ============================================================================

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

// ─── کامپوننت ورودی قیمت با دکمه +/- ───
function PriceInput({
  placeholder,
  value,
  onChange,
  onBlur,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const step = 500000;

  const increment = () => {
    const current = parseInt(value) || 0;
    const next = current + step;
    onChange(String(next));
  };

  const decrement = () => {
    const current = parseInt(value) || 0;
    const next = Math.max(0, current - step);
    onChange(next === 0 ? "" : String(next));
  };

  return (
    <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800/50 transition-colors focus-within:border-rose-500/50">
      <button
        type="button"
        onClick={decrement}
        className="flex h-full w-8 shrink-0 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-700/50 hover:text-white active:bg-zinc-700"
        aria-label="کاهش"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      </button>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? Number(value).toLocaleString("en") : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw);
        }}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-center text-sm text-white outline-none placeholder:text-zinc-600"
        dir="ltr"
      />
      <button
        type="button"
        onClick={increment}
        className="flex h-full w-8 shrink-0 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-700/50 hover:text-white active:bg-zinc-700"
        aria-label="افزایش"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

interface ArtistFiltersProps {
  cities: string[];
  styles: { value: string; label: string }[];
  currentFilters: {
    city: string;
    style: string;
    minPrice: string;
    maxPrice: string;
    verified: boolean;
    sort: string;
  };
}

export default function ArtistFilters({
  cities,
  styles,
  currentFilters,
}: ArtistFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localFilters, setLocalFilters] = useState(currentFilters);

  const applyFilters = useCallback(
    (updates: Partial<typeof localFilters>) => {
      const newFilters = { ...localFilters, ...updates };
      setLocalFilters(newFilters);

      const params = new URLSearchParams();
      if (newFilters.city) params.set("city", newFilters.city);
      if (newFilters.style) params.set("style", newFilters.style);
      if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
      if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
      if (newFilters.verified) params.set("verified", "true");
      if (newFilters.sort && newFilters.sort !== "rating")
        params.set("sort", newFilters.sort);

      // حفظ query از URL فعلی
      const q = searchParams.get("query");
      if (q) params.set("query", q);

      router.push(`/artists?${params.toString()}`, { scroll: false });
    },
    [localFilters, router, searchParams]
  );

  const clearFilters = () => {
    setLocalFilters({
      city: "",
      style: "",
      minPrice: "",
      maxPrice: "",
      verified: false,
      sort: "rating",
    });
    const params = new URLSearchParams();
    const q = searchParams.get("query");
    if (q) params.set("query", q);
    router.push(`/artists?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters =
    localFilters.city ||
    localFilters.style ||
    localFilters.minPrice ||
    localFilters.maxPrice ||
    localFilters.verified;

  return (
    <div className="sticky top-24 space-y-4">
      {/* هدر فیلترها */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">فیلترها</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-rose-400 transition-colors hover:text-rose-300"
          >
            پاک کردن همه
          </button>
        )}
      </div>

      {/* فیلتر شهر */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          شهر
        </label>
        <select
          value={localFilters.city}
          onChange={(e) => applyFilters({ city: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
        >
          <option value="">همه شهرها</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* فیلتر سبک */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          سبک تتو
        </label>
        <select
          value={localFilters.style}
          onChange={(e) => applyFilters({ style: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
        >
          <option value="">همه سبک‌ها</option>
          {styles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* فیلتر قیمت */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          محدوده قیمت (تومان)
        </label>
        <div className="flex items-center gap-2">
          <PriceInput
            placeholder="از"
            value={localFilters.minPrice}
            onChange={(v) => setLocalFilters((f) => ({ ...f, minPrice: v }))}
            onBlur={() => applyFilters({ minPrice: localFilters.minPrice })}
          />
          <span className="text-zinc-600">—</span>
          <PriceInput
            placeholder="تا"
            value={localFilters.maxPrice}
            onChange={(v) => setLocalFilters((f) => ({ ...f, maxPrice: v }))}
            onBlur={() => applyFilters({ maxPrice: localFilters.maxPrice })}
          />
        </div>
      </div>

      {/* فیلتر تأیید شده */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            className={`relative h-5 w-5 rounded-md border-2 transition-all ${
              localFilters.verified
                ? "border-rose-500 bg-rose-500"
                : "border-zinc-700 bg-transparent"
            }`}
          >
            {localFilters.verified && (
              <svg
                className="absolute inset-0.5 h-3.5 w-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            checked={localFilters.verified}
            onChange={(e) => applyFilters({ verified: e.target.checked })}
            className="sr-only"
          />
          <span className="text-sm text-zinc-300">فقط هنرمندان تأیید شده</span>
        </label>
      </div>

      {/* مرتب‌سازی */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          مرتب‌سازی
        </label>
        <select
          value={localFilters.sort}
          onChange={(e) => applyFilters({ sort: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
        >
          <option value="rating">بهترین امتیاز</option>
          <option value="experience">بیشترین تجربه</option>
          <option value="popularity">محبوب‌ترین</option>
          <option value="price_low">ارزان‌ترین</option>
          <option value="price_high">گران‌ترین</option>
          <option value="newest">جدیدترین</option>
        </select>
      </div>
    </div>
  );
}
