"use client";

import { useState, useEffect } from "react";
import AuthPromptModal from "@/components/ui/AuthPromptModal";

interface FlashLikeButtonProps {
  flashTattooId: string;
  isLoggedIn?: boolean;
}

export default function FlashLikeButton({ flashTattooId, isLoggedIn = false }: FlashLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetch(`/api/flash/like?flashTattooId=${flashTattooId}`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(data.isLiked);
        setCount(data.likeCount);
      })
      .catch(() => {});
  }, [flashTattooId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/flash/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashTattooId }),
      });

      if (res.status === 401) {
        setShowAuthModal(true);
        return;
      }

      const data = await res.json();
      setLiked(data.liked);
      setCount((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
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
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="برای لایک کردن طرح‌های تتو ابتدا باید وارد حساب کاربری خود شوید" />
    </>
  );
}
