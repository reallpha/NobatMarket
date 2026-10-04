"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TATTOO_STYLE_LABELS } from "@/lib/utils";

interface FavoriteItem {
  id: string;
  type: "portfolio" | "flash";
  title: string;
  images: string[];
  style: string;
  price: number | null;
  artist: {
    slug: string;
    name: string;
    avatarUrl: string | null;
  };
  likedAt: string;
}

export default function ClientFavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("آیا از حذف این مورد از علاقه‌مندی‌ها مطمئن هستید؟")) return;
    try {
      await fetch(`/api/favorites?id=${id}&type=${type}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error("Failed to remove favorite");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">علاقه‌مندی‌ها</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} مورد لایک شده
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-zinc-800/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="mt-4 text-zinc-500">هنوز هیچ علاقه‌مندی ثبت نشده</p>
          <p className="mt-1 text-xs text-zinc-600">وقتی جایی را لایک کنید اینجا نمایش داده می‌شود</p>
          <Link href="/inspiration" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-500">
            مشاهده الهام‌بخشی
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.type === "flash" ? "/flash" : `/artists/${item.artist.slug}`}
              className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 transition-all duration-300 hover:border-zinc-700 hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                    <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-lg ${
                    item.type === "flash"
                      ? "bg-amber-500/90 shadow-amber-500/30"
                      : "bg-rose-500/90 shadow-rose-500/30"
                  }`}>
                    {item.type === "flash" ? "تتو فلش" : "نمونه‌کار"}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <svg className="h-4 w-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id, item.type); }}
                  title="حذف از علاقه‌مندی‌ها"
                  className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-zinc-400 opacity-70 backdrop-blur-sm transition-all hover:bg-rose-600 hover:text-white hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="absolute bottom-3 right-3">
                  <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300 backdrop-blur-md">
                    {TATTOO_STYLE_LABELS[item.style] || item.style}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors truncate">
                  {item.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                    {item.artist.avatarUrl ? (
                      <img src={item.artist.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-zinc-500">{item.artist.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{item.artist.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
