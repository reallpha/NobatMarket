"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress < 1) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-zinc-900/50 backdrop-blur-sm">
      <div
        className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(244,63,94,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
