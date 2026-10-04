"use client";

import { useState, useEffect } from "react";
import AuthPromptModal from "@/components/ui/AuthPromptModal";

interface LikeButtonProps {
  portfolioItemId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn?: boolean;
}

export default function LikeButton({ portfolioItemId, initialLiked, initialCount, isLoggedIn = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch actual like status from server on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/portfolio/like?portfolioItemId=${portfolioItemId}`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(data.isLiked);
        setCount(data.likeCount);
      })
      .catch(() => {});
  }, [portfolioItemId, isLoggedIn]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId }),
      });

      if (res.status === 401) {
        setShowAuthModal(true);
        return;
      }

      const data = await res.json();
      setLiked(data.liked);
      setCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          liked
            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${liked ? "scale-110" : ""}`}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{count.toLocaleString("fa-IR")}</span>
      </button>
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="برای لایک کردن نمونه کارها ابتدا باید وارد حساب کاربری خود شوید" />
    </>
  );
}
