"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { TATTOO_STYLE_LABELS } from "@/lib/utils";
import InspirationLikeButton from "./InspirationLikeButton";

interface InspirationCardProps {
  item: {
    id: string;
    title: string;
    images: string[];
    style: string;
    likeCount: number;
    saveCount: number;
    artistProfile: {
      slug: string;
      artistName: string;
      user: {
        avatarUrl: string | null;
      };
    };
  };
  index: number;
}

export default function InspirationCard({ item, index }: InspirationCardProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  return (
    <Link
      href={`/artists/${item.artistProfile.slug}`}
      className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:border-rose-500/30"
    >
      <div className="relative overflow-hidden">
        <img
          src={item.images[0]}
          alt={item.title}
          className="w-full object-cover transition-all duration-700 group-hover:scale-105"
          loading={index < 8 ? "eager" : "lazy"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 opacity-0 transition-all duration-500 group-hover:opacity-100">
          <div className="absolute top-3 left-3">
            <span className="rounded-lg bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
              {TATTOO_STYLE_LABELS[item.style] || item.style}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800">
                {item.artistProfile.user.avatarUrl ? (
                  <img src={item.artistProfile.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400">{item.artistProfile.artistName.charAt(0)}</span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-white">{item.artistProfile.artistName}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <InspirationLikeButton
                portfolioItemId={item.id}
                initialLiked={false}
                initialCount={item.likeCount}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
            {item.artistProfile.user.avatarUrl ? (
              <img src={item.artistProfile.user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[8px] text-zinc-500">{item.artistProfile.artistName.charAt(0)}</span>
            )}
          </div>
          <span className="text-[11px] text-zinc-500">{item.artistProfile.artistName}</span>
        </div>
      </div>
    </Link>
  );
}
