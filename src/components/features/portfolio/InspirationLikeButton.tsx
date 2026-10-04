"use client";

import { useState, useEffect } from "react";
import AuthPromptModal from "@/components/ui/AuthPromptModal";

interface InspirationLikeButtonProps {
  portfolioItemId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn?: boolean;
}

export default function InspirationLikeButton({ portfolioItemId, initialLiked, initialCount, isLoggedIn = false }: InspirationLikeButtonProps) {
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

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        className={`flex items-center gap-1 transition-colors ${liked ? "text-rose-400" : "text-zinc-400 hover:text-rose-400"}`}
      >
        <svg className="h-3 w-3" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {count}
      </button>
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="برای لایک کردن نمونه کارها ابتدا باید وارد حساب کاربری خود شوید" />
    </>
  );
}
