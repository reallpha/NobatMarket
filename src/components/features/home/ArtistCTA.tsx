"use client";

import Link from "next/link";

function PenSvg() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>; }
function UsersSvg() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function StarSvg() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function CreditSvg() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>; }
function ArrowLeftSvg() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>; }

const benefits = [
  { icon: UsersSvg, title: "\u0645\u0634\u062A\u0631\u06CC\u0627\u0646 \u0648\u0627\u0642\u0639\u06CC", desc: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u0647\u0632\u0627\u0631\u0627\u0646 \u0645\u0634\u062A\u0631\u06CC \u0641\u0639\u0627\u0644 \u062F\u0631 \u0633\u0631\u0627\u0633\u0631 \u0627\u06CC\u0631\u0627\u0646" },
  { icon: StarSvg, title: "\u067E\u0648\u0631\u062A\u0641\u0648\u0644\u06CC\u0648\u06CC \u062D\u0631\u0641\u0647\u200C\u0627\u06CC", desc: "\u0646\u0645\u0627\u06CC\u0634 \u0646\u0645\u0648\u0646\u0647\u200C\u06A9\u0627\u0631\u0647\u0627\u06CC \u0634\u0645\u0627 \u0628\u0627 \u0637\u0631\u0627\u062D\u06CC \u0632\u06CC\u0628\u0627" },
  { icon: CreditSvg, title: "\u062F\u0631\u0622\u0645\u062F \u062A\u0636\u0645\u06CC\u0646\u06CC", desc: "\u067E\u0631\u062F\u0627\u062E\u062A \u0627\u0645\u0646 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0632\u0631\u06CC\u0646\u200C\u067E\u0627\u0644" },
];

export default function ArtistCTA() {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-[#060609] to-zinc-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-r from-rose-600/15 via-purple-600/10 to-amber-500/15 blur-[250px] animate-orbit-1" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/10 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12 lg:p-16 backdrop-blur-xl overflow-hidden glass-shimmer-hover">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(244,63,94,0.06), transparent 60%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(168,85,247,0.04), transparent 60%)" }} />
          <div className="relative flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1 text-center lg:text-right">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-5 py-2.5 text-sm font-medium text-rose-400 backdrop-blur-sm mb-6">
                <PenSvg />
                {"\u0628\u0631\u0627\u06CC \u0647\u0646\u0631\u0645\u0646\u062F\u0627\u0646 \u062A\u062A\u0648"}
              </span>
              <h2 className="mt-4 font-[family-name:var(--font-lalezar)] text-2xl font-black text-white sm:text-3xl lg:text-4xl">
                {"\u0647\u0646\u0631\u062A \u0631\u0648 \u0628\u0647"}
                <br />
                <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400 bg-clip-text text-transparent">{"\u0647\u0632\u0627\u0631\u0627\u0646 \u0646\u0641\u0631"}</span>
                {" \u0646\u0634\u0648\u0646 \u0628\u062F\u0647"}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 mx-auto lg:mx-0">
                {"\u0628\u0627 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u062F\u0631 \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A\u060C \u067E\u0648\u0631\u062A\u0641\u0648\u0644\u06CC\u0648\u06CC \u062D\u0631\u0641\u0647\u200C\u0627\u06CC \u0628\u0633\u0627\u0632\u060C \u0645\u0634\u062A\u0631\u06CC \u067E\u06CC\u062F\u0627 \u06A9\u0646 \u0648 \u062F\u0631\u0622\u0645\u062F\u062A \u0631\u0648 \u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0646. \u0628\u062F\u0648\u0646 \u06A9\u0645\u06CC\u0633\u06CC\u0648\u0646 \u0627\u0636\u0627\u0641\u06CC\u060C \u0628\u062F\u0648\u0646 \u062F\u0631\u062F\u0633\u0631."}
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/register" className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(244,63,94,0.5)] hover:scale-[1.03] btn-glow">
                  <span className="relative z-10 flex items-center gap-2.5">{"\u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0631\u0627\u06CC\u06AF\u0627\u0646 \u0647\u0646\u0631\u0645\u0646\u062F"} <ArrowLeftSvg /></span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
                <Link href="/about" className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] px-8 py-4 text-lg font-bold text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white">
                  {"\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0628\u06CC\u0634\u062A\u0631"}
                </Link>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:border-rose-500/20 hover:bg-white/[0.04] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] glass-shimmer-hover">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:scale-110 transition-all duration-300"><Icon /></div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-rose-400 transition-colors duration-300">{b.title}</h4>
                      <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors duration-300">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
