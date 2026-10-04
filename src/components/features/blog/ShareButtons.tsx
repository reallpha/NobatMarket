"use client";

import { useState } from "react";

export default function ShareButtons({ slug, title, compact = false }: { slug: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = `https://nobat-market.com/magazine/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const btn = compact
    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-all sm:h-9 sm:w-9 sm:rounded-xl"
    : "flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-all";

  const iconSize = compact ? 14 : 16;

  return (
    <div className={`flex min-w-0 items-center ${compact ? "gap-1.5 sm:gap-3" : "gap-3"}`}>
      <span className={`shrink-0 text-zinc-500 ${compact ? "text-[11px] sm:text-sm" : "text-sm"}`}>اشتراک‌گذاری:</span>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="اشتراک در تلگرام"
        aria-label="اشتراک در تلگرام"
        className={`${btn} hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10`}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="اشتراک در ایکس"
        aria-label="اشتراک در ایکس"
        className={`${btn} hover:border-sky-500/50 hover:text-sky-400 hover:bg-sky-500/10`}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <button
        onClick={copyLink}
        title="کپی لینک مقاله"
        aria-label="کپی لینک مقاله"
        className={`${btn} ${copied ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : "hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10"}`}
      >
        {copied ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        )}
      </button>
      {copied && <span className="shrink-0 text-[11px] text-emerald-400 sm:text-xs">کپی شد ✓</span>}
    </div>
  );
}
