"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    num: "\u06F1\u06F0\u06F1", title: "\u062C\u0633\u062A\u062C\u0648 \u0648 \u06A9\u0634\u0641",
    desc: "\u0627\u0632 \u0628\u06CC\u0646 \u0635\u062F\u0647\u0627 \u0647\u0646\u0631\u0645\u0646\u062F \u062D\u0631\u0641\u0647\u0627\u06CC \u0628\u0627 \u0641\u06CC\u0644\u062A\u0631\u0647\u0627\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0633\u0628\u06A9\u060C \u0634\u0647\u0631 \u0648 \u0642\u06CC\u0645\u062A\u060C \u0647\u0646\u0631\u0645\u0646\u062F \u0645\u0648\u0631\u062F \u0646\u0638\u0631\u062A \u0631\u0648 \u067E\u06CC\u062F\u0627 \u06A9\u0646.",
    details: ["\u0641\u06CC\u0644\u062A\u0631 \u0628\u0631 \u0627\u0633\u0627\u0633 18+ \u0633\u0628\u06A9 \u062A\u062A\u0648", "\u062C\u0633\u062A\u062C\u0648\u06CC \u0645\u06A9\u0627\u0646\u06CC \u0628\u0627 \u0646\u0642\u0634\u0647", "\u0645\u0634\u0627\u0647\u062F\u0647 \u067E\u0648\u0631\u062A\u0641\u0648\u0644\u06CC\u0648 \u06A9\u0627\u0645\u0644", "\u062E\u0648\u0627\u0646\u062F\u0646 \u0646\u0638\u0631\u0627\u062A \u0645\u0634\u062A\u0631\u06CC\u0627\u0646"],
    color: "rose", iconBg: "bg-rose-500/10", iconText: "text-rose-400", glowColor: "rgba(244,63,94,0.15)", borderHover: "hover:border-rose-500/30",
  },
  {
    num: "\u06F1\u06F0\u06F2", title: "\u0631\u0632\u0631\u0648 \u0622\u0646\u0644\u0627\u06CC\u0646",
    desc: "\u0632\u0645\u0627\u0646 \u0648 \u062A\u0627\u0631\u06CC\u062E \u062F\u0644\u062E\u0648\u0627\u0647\u062A \u0631\u0648 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646. \u0631\u0632\u0631\u0648 \u0622\u0646\u06CC\u060C \u062A\u0623\u06CC\u06CC\u062F \u0633\u0631\u06CC\u0639 \u0648 \u062A\u0642\u0648\u06CC\u0645 \u0634\u062E\u0635\u06CC.",
    details: ["\u0645\u0634\u0627\u0647\u062F\u0647 \u062A\u0642\u0648\u06CC\u0645 \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u0647\u0646\u0631\u0645\u0646\u062F", "\u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u062C\u0644\u0633\u0647", "\u062A\u0623\u06CC\u06CC\u062F \u0641\u0648\u0631\u06CC \u06CC\u0627 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0632\u0645\u0627\u0646", "\u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u062E\u0648\u062F\u06A9\u0627\u0631 \u0642\u0628\u0644 \u0627\u0632 \u0646\u0648\u0628\u062A"],
    color: "amber", iconBg: "bg-amber-500/10", iconText: "text-amber-400", glowColor: "rgba(245,158,11,0.15)", borderHover: "hover:border-amber-500/30",
  },
  {
    num: "\u06F1\u06F0\u06F3", title: "\u0645\u0634\u0627\u0648\u0631\u0647 \u0648 \u0637\u0631\u0627\u062D\u06CC",
    desc: "\u0628\u0627 \u0647\u0646\u0631\u0645\u0646\u062F \u0686\u062A \u06A9\u0646\u060C \u0637\u0631\u062D \u0631\u0648 \u0646\u0647\u0627\u06CC\u06CC \u06A9\u0646 \u0648 \u0631\u0641\u0631\u0646\u0633\u200C\u0647\u0627 \u0631\u0648 \u0627\u0634\u062A\u0631\u0627\u06A9 \u0628\u06AF\u0630\u0627\u0631.",
    details: ["\u0686\u062A \u0645\u0633\u062A\u0642\u06CC\u0645 \u0628\u0627 \u0647\u0646\u0631\u0645\u0646\u062F", "\u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u0639\u06A9\u0633 \u0631\u0641\u0631\u0646\u0633", "\u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u0637\u0631\u062D \u0642\u0628\u0644 \u0627\u0632 \u062C\u0644\u0633\u0647", "\u062A\u0623\u06CC\u06CC\u062F \u0642\u06CC\u0645\u062A \u0646\u0647\u0627\u06CC\u06CC"],
    color: "sky", iconBg: "bg-sky-500/10", iconText: "text-sky-400", glowColor: "rgba(14,165,233,0.15)", borderHover: "hover:border-sky-500/30",
  },
  {
    num: "\u06F1\u06F0\u06F4", title: "\u062E\u0644\u0642 \u0627\u062B\u0631 \u0647\u0646\u0631\u06CC",
    desc: "\u062F\u0631 \u0645\u062D\u06CC\u0637 \u0627\u0645\u0646 \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC\u060C \u062A\u062A\u0648\u06CC \u0631\u0648\u06CC\u0627\u062A \u0631\u0648 \u0628\u0633\u0627\u0632 \u0628\u0627 \u0628\u0647\u062A\u0631\u06CC\u0646 \u0627\u0628\u0632\u0627\u0631\u0647\u0627.",
    details: ["\u0627\u0633\u062A\u0648\u062F\u06CC\u0648\u0647\u0627\u06CC \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F", "\u0645\u0644\u0632\u0648\u0645\u0627\u062A \u062A\u06A9\u200C\u0645\u0635\u0631\u0641", "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u062A\u06CC\u0645 \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A", "\u0636\u0645\u0627\u0646\u062A \u06A9\u06CC\u0641\u06CC\u062A \u06A9\u0627\u0631"],
    color: "purple", iconBg: "bg-purple-500/10", iconText: "text-purple-400", glowColor: "rgba(168,85,247,0.15)", borderHover: "hover:border-purple-500/30",
  },
  {
    num: "\u06F1\u06F0\u06F5", title: "\u067E\u0631\u062F\u0627\u062E\u062A \u0627\u0645\u0646",
    desc: "\u067E\u0631\u062F\u0627\u062E\u062A \u0627\u0632 \u0637\u0631\u06CC\u0642 \u062F\u0631\u06AF\u0627\u0647 \u0632\u0631\u06CC\u0646\u200C\u067E\u0627\u0644\u060C \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u06CC\u0627 \u0646\u0642\u062F\u06CC. \u067E\u0648\u0644 \u062A\u0627 3 \u0631\u0648\u0632 \u0628\u0639\u062F \u0648\u0627\u0631\u06CC\u0632 \u0645\u06CC\u0634\u0647.",
    details: ["\u062F\u0631\u06AF\u0627\u0647 \u0632\u0631\u06CC\u0646\u200C\u067E\u0627\u0644 \u0627\u0645\u0646", "\u06A9\u06CC\u0641 \u067E\u0648\u0644 \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644", "\u067E\u0631\u062F\u0627\u062E\u062A \u0646\u0642\u062F\u06CC \u062D\u0636\u0648\u0631\u06CC", "\u0636\u0645\u0627\u0646\u062A \u0628\u0627\u0632\u067E\u0631\u062F\u0627\u062E\u062A"],
    color: "amber", iconBg: "bg-amber-500/10", iconText: "text-amber-400", glowColor: "rgba(245,158,11,0.15)", borderHover: "hover:border-amber-500/30",
  },
  {
    num: "\u06F1\u06F0\u06F6", title: "\u0645\u0631\u0627\u0642\u0628\u062A \u0648 \u0646\u0638\u0631",
    desc: "\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u0645\u0631\u0627\u0642\u0628\u062A \u0628\u0639\u062F \u0627\u0632 \u062A\u062A\u0648 \u0628\u06AF\u06CC\u0631\u060C \u0646\u0638\u0631\u062A \u0631\u0648 \u062B\u0628\u062A \u06A9\u0646 \u0648 \u0628\u0647 \u062C\u0627\u0645\u0639\u0647 \u06A9\u0645\u06A9 \u06A9\u0646.",
    details: ["\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u0645\u0631\u0627\u0642\u0628\u062A \u06A9\u0627\u0645\u0644", "\u0627\u0645\u062A\u06CC\u0627\u0632\u062F\u0647\u06CC \u0686\u0646\u062F\u0645\u0639\u06CC\u0627\u0631\u0647", "\u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u0639\u06A9\u0633 \u0646\u062A\u06CC\u062C\u0647", "\u0628\u0631\u062F\u0627\u0634\u062A\u0646 \u062C\u0627\u06CC\u0632\u0647 \u0648\u0641\u0627\u062F\u0627\u0631\u06CC"],
    color: "emerald", iconBg: "bg-emerald-500/10", iconText: "text-emerald-400", glowColor: "rgba(16,185,129,0.15)", borderHover: "hover:border-emerald-500/30",
  },
];

const colorClasses: Record<string, { icon: string; bg: string; glow: string }> = {
  rose: { icon: "text-rose-400", bg: "bg-rose-500/10", glow: "rgba(244,63,94,0.15)" },
  amber: { icon: "text-amber-400", bg: "bg-amber-500/10", glow: "rgba(245,158,11,0.15)" },
  sky: { icon: "text-sky-400", bg: "bg-sky-500/10", glow: "rgba(14,165,233,0.15)" },
  purple: { icon: "text-purple-400", bg: "bg-purple-500/10", glow: "rgba(168,85,247,0.15)" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", glow: "rgba(16,185,129,0.15)" },
};

function SearchIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>; }
function CalendarIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>; }
function ChatIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>; }
function SparkleIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>; }
function CreditCardIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>; }
function CheckIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function CheckSmall() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>; }

const stepIcons = [SearchIcon, CalendarIcon, ChatIcon, SparkleIcon, CreditCardIcon, CheckIcon];

export default function HowItWorks() {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = parseInt((e.target as HTMLElement).dataset.idx || "0");
            setVisible((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    ref.current.querySelectorAll("[data-idx]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#07070a] to-zinc-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-amber-500/10 blur-[250px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

      {/* Grunge Sticker Decorations */}
      <img src="/image/675f5a13e2ebe46fa2b2b699_sticker-bird.png" alt="" className="absolute top-16 right-4 sm:right-12 w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 opacity-[0.04] pointer-events-none select-none" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />
      <img src="/image/675f774cf4ae696189d6311c_sticker-devilhand.png" alt="" className="absolute bottom-20 left-4 sm:left-12 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 opacity-[0.04] pointer-events-none select-none -rotate-12" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="mb-16 lg:mb-20 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-5 py-2.5 text-sm font-medium text-amber-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </span>
            {"\u0633\u0627\u062F\u0647\u060C \u0627\u0645\u0646\u060C \u0633\u0631\u06CC\u0639"}
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">{"\u0686\u0637\u0648\u0631 \u06A9\u0627\u0631 \u0645\u06CC\u200C\u06A9\u0646\u0647\u061F"}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">{"\u06F6 \u0645\u0631\u062D\u0644\u0647 \u0633\u0627\u062F\u0647 \u062A\u0627 \u0631\u0633\u06CC\u062F\u0646 \u0628\u0647 \u062A\u062A\u0648\u06CC \u0631\u0648\u06CC\u0627\u0647\u0627\u06CC \u062A\u0648"}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => {
            const c = colorClasses[step.color] || colorClasses.rose;
            const Icon = stepIcons[i];
            return (
              <article
                key={i}
                data-idx={i}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7 transition-all duration-700 ${step.borderHover} hover:bg-white/[0.04] hover:shadow-xl glass-shimmer-hover`}
                style={{ opacity: visible.has(i) ? 1 : 0, transform: visible.has(i) ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)", transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${c.glow}, transparent 60%)` }} />
                <div className={`relative mb-5 flex h-13 w-13 items-center justify-center rounded-xl ${c.bg} border border-white/[0.06] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}>
                  <span className={c.icon}><Icon /></span>
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300">{step.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">{step.desc}</p>
                <ul className="space-y-2.5">
                  {step.details.map((d, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-zinc-500 group-hover:text-zinc-400 transition-all duration-300" style={{ opacity: visible.has(i) ? 1 : 0, transform: visible.has(i) ? "translateX(0)" : "translateX(-10px)", transitionDelay: `${i * 100 + j * 60 + 200}ms`, transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.bg} ${c.icon}`}><CheckSmall /></span>
                      {d}
                    </li>
                  ))}
                </ul>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-20 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent transition-all duration-500" />
              </article>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a href="/artists" className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-bold text-zinc-950 shadow-xl shadow-amber-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-[1.03]">
            <SearchIcon />
            {"\u062C\u0633\u062A\u062C\u0648\u06CC \u0647\u0646\u0631\u0645\u0646\u062F\u0647\u0627"}
          </a>
        </div>
      </div>
    </section>
  );
}
