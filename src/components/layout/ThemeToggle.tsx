"use client";

// ============================================================================
// دکمه تغییر تم (دارک/لایت) - نوبت مارکت
// ============================================================================

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // خواندن تم ذخیره شده
    const saved = localStorage.getItem("theme");
    const shouldBeDark = saved ? saved === "dark" : true;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
    document.documentElement.classList.toggle("light", !shouldBeDark);
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
    document.documentElement.classList.toggle("light", !newDark);
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-white"
      title={isDark ? "حالت روشن" : "حالت تاریک"}
    >
      {isDark ? (
        // آیکون خورشید (برای رفتن به حالت روشن)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // آیکون ماه (برای رفتن به حالت تاریک)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
