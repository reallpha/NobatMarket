"use client";

import { useState, useEffect } from "react";
import AuthPromptModal from "@/components/ui/AuthPromptModal";

interface SaveButtonProps {
  portfolioItemId: string;
  initialSaved?: boolean;
  initialCount?: number;
  isLoggedIn?: boolean;
  variant?: "flash" | "compact";
}

export default function SaveButton({ portfolioItemId, initialSaved = false, initialCount = 0, isLoggedIn = false, variant = "compact" }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/portfolio/save?portfolioItemId=${portfolioItemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.saved !== undefined) setSaved(data.saved);
        if (data.saveCount !== undefined) setCount(data.saveCount);
      })
      .catch(() => {});
  }, [portfolioItemId, isLoggedIn]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId }),
      });

      if (res.status === 401) {
        setShowAuthModal(true);
        return;
      }

      const data = await res.json();
      setSaved(data.saved);
      setCount((prev) => (data.saved ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "flash") {
    return (
      <>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            saved
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${saved ? "scale-110" : ""}`}>
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>{count.toLocaleString("fa-IR")}</span>
        </button>
        <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="برای ذخیره نمونه کارها ابتدا باید وارد حساب کاربری خود شوید" />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleSave}
        disabled={loading}
        className={`flex items-center gap-1 text-[11px] transition-colors ${saved ? "text-amber-400" : "text-zinc-500 hover:text-amber-400"}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {count > 0 && <span>{count}</span>}
      </button>
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message="برای ذخیره نمونه کارها ابتدا باید وارد حساب کاربری خود شوید" />
    </>
  );
}
