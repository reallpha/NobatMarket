"use client";

// ============================================================================
// گرید آیتم‌های ذخیره شده (Client Component)
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { TATTOO_STYLE_LABELS, toPersianNumbers, formatPrice } from "@/lib/utils";

interface SavedItem {
  savedId: string;
  id: string;
  title: string;
  description: string | null;
  images: string[];
  style: string;
  size: string | null;
  price: bigint | null;
  likeCount: number;
  saveCount: number;
  tags: string[];
  savedAt: string;
  artistName: string;
  artistSlug: string;
  artistAvatar: string | null;
  isVerified: boolean;
}

interface SavedItemsGridProps {
  items: SavedItem[];
}

export default function SavedItemsGrid({ items }: SavedItemsGridProps) {
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
    caption: string;
    artist: string;
  }>({
    isOpen: false,
    src: "",
    alt: "",
    caption: "",
    artist: "",
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 py-16 text-center">
        <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        <p className="mt-3 text-sm text-zinc-500">
          هنوز چیزی ذخیره نکرده‌اید
        </p>
        <a
          href="/inspiration"
          className="mt-4 btn-primary text-sm"
        >
          کاوش در گالری الهام‌بخشی
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.savedId}
            className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
          >
            {/* تصویر */}
            <div
              className="relative aspect-square cursor-pointer overflow-hidden"
              onClick={() =>
                setLightbox({
                  isOpen: true,
                  src: item.images[0] || "",
                  alt: item.title,
                  caption: item.title,
                  artist: item.artistName,
                })
              }
            >
              {item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800/50">
                  <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
              )}
            </div>

            {/* اطلاعات */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white">
                {item.title}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-zinc-800/50">
                  {item.artistAvatar ? (
                    <img src={item.artistAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-zinc-500">
                      {item.artistName.charAt(0)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/artists/${item.artistSlug}`}
                  className="text-xs text-zinc-400 hover:text-rose-400"
                >
                  {item.artistName}
                </Link>
                {item.isVerified && (
                  <span className="text-[10px] text-emerald-500">✓</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>{TATTOO_STYLE_LABELS[item.style] || item.style}</span>
                {item.price && <span>{formatPrice(item.price)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        isOpen={lightbox.isOpen}
        src={lightbox.src}
        alt={lightbox.alt}
        caption={lightbox.caption}
        artist={lightbox.artist}
        onClose={() => setLightbox((p) => ({ ...p, isOpen: false }))}
      />
    </>
  );
}
