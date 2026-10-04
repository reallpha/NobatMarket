"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { TATTOO_STYLE_LABELS, formatPrice } from "@/lib/utils";
import FlashLikeButton from "@/components/features/portfolio/FlashLikeButton";

interface FlashCardProps {
  flash: {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    style: string;
    isExclusive?: boolean;
    artistProfile: {
      slug: string;
      artistName: string;
      isVerified?: boolean;
      user: { avatarUrl: string | null };
    };
  };
}

export default function FlashCard({ flash }: FlashCardProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <Link
      href={`/artists/${flash.artistProfile.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={flash.imageUrl} alt={flash.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Price */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-400">{formatPrice(flash.price)}</span>
            {flash.isExclusive && (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400">اختصاصی</span>
            )}
          </div>
        </div>

        {/* Style */}
        <div className="absolute right-3 top-3">
          <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300 backdrop-blur-md">
            {TATTOO_STYLE_LABELS[flash.style] || flash.style}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-xs font-semibold text-white group-hover:text-amber-400">{flash.title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
              {flash.artistProfile.user.avatarUrl ? (
                <img src={flash.artistProfile.user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[8px] text-zinc-500">{flash.artistProfile.artistName.charAt(0)}</span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500">{flash.artistProfile.artistName}</span>
            {flash.artistProfile.isVerified && <span className="text-emerald-500">✓</span>}
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <FlashLikeButton flashTattooId={flash.id} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </Link>
  );
}
