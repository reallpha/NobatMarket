import HeroParticles from "./HeroParticles";


const orbitStyles = [
  { name: "رئالیسم", slug: "REALISM", color: "#f43f5e", angle: 0 },
  { name: "فاین\u200cلاین", slug: "FINE_LINE", color: "#eab308", angle: 45 },
  { name: "مینیمال", slug: "MINIMAL", color: "#22c55e", angle: 90 },
  { name: "داتورک", slug: "DOTWORK", color: "#a855f7", angle: 135 },
  { name: "بلک\u200cورک", slug: "BLACKWORK", color: "#ec4899", angle: 180 },
  { name: "واتروکالر", slug: "WATERCOLOR", color: "#0ea5e9", angle: 225 },
  { name: "ژئومتریک", slug: "GEOMETRIC", color: "#3b82f6", angle: 270 },
  { name: "نئو تریدیشنال", slug: "NEO_TRADITIONAL", color: "#f97316", angle: 315 },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "نوبت مارکت",
  url: "https://nobat-market.com",
  description: "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://nobat-market.com/businesses?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "نوبت مارکت",
    logo: { "@type": "ImageObject", url: "https://nobat-market.com/logo.png" },
  },
};

export default function HeroSection() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Orbit Animations ── */
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes orbit-counter-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .orbit-ring-spin {
          animation: orbit-spin 50s linear infinite;
        }
        .orbit-ring-spin:hover {
          animation-play-state: paused;
        }
        .orbit-counter-spin {
          animation: orbit-counter-spin 50s linear infinite;
        }
        .orbit-ring-spin:hover .orbit-counter-spin {
          animation-play-state: paused;
        }
        @keyframes hero-eyebrow-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hero-title-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eagle-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes eagle-breathe { 0% { transform: scale(1); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); } 100% { transform: scale(1.05); filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3)); } }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes accent-line-draw {
          from { transform: scaleX(0); transform-origin: right; }
          to { transform: scaleX(1); transform-origin: right; }
        }
        @keyframes proof-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbit-card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .orbit-card {
          animation: orbit-card-float 3s ease-in-out infinite;
        }
        @keyframes orbit-typo-pop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        .orbit-typo-label {
          animation: orbit-typo-pop 0.5s ease-out both;
        }
        .hero-eyebrow-animate {
          animation: hero-eyebrow-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .hero-title-animate {
          animation: hero-title-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
        }
        .hero-subtitle-animate {
          animation: hero-title-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
        }
        .hero-desc-animate {
          animation: hero-title-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both;
        }
        .hero-cta-animate {
          animation: hero-title-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both;
        }
        .hero-proof-animate {
          animation: proof-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both;
        }
        .hero-orbit-animate {
          animation: hero-title-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both;
        }
        .accent-line-animate {
          animation: accent-line-draw 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s both;
        }
        .eagle-float-animate { animation: eagle-float 4s ease-in-out infinite; }
        .eagle-breathe-animate { animation: eagle-breathe 3s ease-in-out infinite alternate; transform-origin: center center; }
        .glow-pulse {
          animation: hero-glow-pulse 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .orbit-ring, .orbit-ring-reverse, .orbit-card, .glow-pulse, .eagle-float-animate, .eagle-breathe-animate, .orbit-ring-spin, .orbit-counter-spin { animation: none !important; }
          .hero-eyebrow-animate, .hero-title-animate, .hero-subtitle-animate,
          .hero-desc-animate, .hero-cta-animate, .hero-proof-animate,
          .hero-orbit-animate, .accent-line-animate { animation-duration: 0.01ms !important; opacity: 1 !important; transform: none !important; }
        }
      ` }} />

      <section className="relative min-h-0 lg:min-h-[570px] flex items-center overflow-hidden bg-[#050507]">
        {/* ── Background Particles ── */}
        <HeroParticles />

        {/* ── Ambient Glow Orbs ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-rose-600/15 blur-[280px] glow-pulse" />
          <div className="absolute top-[30%] right-[15%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[200px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[180px]" />
        </div>

        {/* Grid Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Grunge Sticker Decorations */}
        <img src="/image/675f7a0d528dc10719873f56_sticker-moon.png" alt="" className="hidden sm:absolute top-8 left-8 w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56 opacity-[0.04] pointer-events-none select-none" style={{ filter: 'grayscale(1) brightness(2)' }} loading="lazy" />


        {/* Main Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 pb-[72px] lg:py-0">
            
            {/* Text Content */}
            <div className="text-center lg:text-right space-y-5 lg:space-y-6">
              <div className="hero-eyebrow-animate inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/[0.08] px-5 py-2.5 text-sm font-medium text-rose-400 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران
              </div>

              <h1 className="hero-title-animate font-[family-name:var(--font-lalezar)] text-[1.75rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight text-white whitespace-nowrap">
                خدمات <span className="text-white">خودت رو پیدا کن</span>
              </h1>

              <div className="hero-subtitle-animate flex items-center gap-3 justify-center lg:justify-start">
                <div className="accent-line-animate h-1 w-16 rounded-full bg-gradient-to-r from-rose-500 to-amber-500" />
                <span className="text-sm text-zinc-500 font-medium">پلتفرم رزرو نوبت برای کسب‌وکارها</span>
              </div>

              <div className="hero-cta-animate flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4">
                <a href="/artists" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 bg-[length:200%_100%] px-4 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-lg font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 hover:bg-right hover:shadow-[0_0_40px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10">جستجوی کسب‌وکار</span>
                  <svg className="h-5 w-5 relative z-10 transition-all duration-500 group-hover:translate-x-[-6px] group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="5" y1="12" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </a>
                <a href="/register" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-500 px-4 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-lg font-bold text-zinc-900 shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-500 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400 hover:shadow-none hover:backdrop-blur-sm hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10">ثبت‌نام کسب‌وکار</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </a>
              </div>

              <div className="hero-proof-animate flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2.5 overflow-x-auto">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0 font-medium text-zinc-300 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2)]"><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>رزرو آنلاین</div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0 font-medium text-zinc-300 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2)]"><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>مشاهده نمونه کار</div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0 font-medium text-zinc-300 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2)]"><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>تسویه آسان</div>
              </div>
            </div>

            {/* Orbit of Tattoo Styles */}
            <div className="hero-orbit-animate relative flex items-center justify-center w-[min(85vw,300px)] sm:w-[min(80vw,380px)] lg:w-[420px] aspect-square mx-auto mt-4 lg:mt-0">
              <div className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px] rounded-full border border-white/[0.04] glow-pulse" />
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] lg:w-[380px] lg:h-[380px] rounded-full border border-white/[0.06]" />

              {/* Orbital Ring — text-only circular cards orbiting the center */}
              <div className="absolute inset-0 orbit-ring-spin">
                {orbitStyles.map((style, i) => {
                  // equal distance from center (radius in % of orbit size)
                  const n = orbitStyles.length;
                  const rawAngle = (i / n) * 2 * Math.PI - Math.PI / 2;
                  const r = 50;
                  const x = 50 + r * Math.cos(rawAngle);
                  const y = 50 + r * Math.sin(rawAngle);
                  return (
                    <a
                      key={style.slug}
                      href={"/artists?style=" + style.slug}
                      className="absolute group"
                      style={{ left: x + "%", top: y + "%", transform: "translate(-50%, -50%)" }}
                    >
                      {/* counter-spin circular card — text stays upright and readable */}
                      <div className="orbit-counter-spin group/card relative flex items-center justify-center rounded-full bg-zinc-900/70 backdrop-blur-xl border transition-all duration-300"
                        style={{ width: "clamp(60px, 10vw, 88px)", height: "clamp(60px, 10vw, 88px)",
                          borderColor: style.color + "40",
                          boxShadow: "0 0 24px " + style.color + "18, inset 0 0 24px " + style.color + "08",
                        }}
                      >
                        {/* subtle color glow ring inside */}
                        <div className="absolute inset-0 rounded-full opacity-40 group-hover/card:opacity-70 transition-opacity duration-300"
                          style={{ boxShadow: "inset 0 0 18px " + style.color + "30" }} />
                        {/* category text — centered, fills the circle */}
                        <span className="relative z-10 font-bold leading-tight text-center px-1 sm:px-2 whitespace-nowrap transition-all duration-300"
                          style={{ color: style.color }}
                        >
                          <span className="text-[10px] sm:text-xs lg:text-sm">
                            {style.name}
                          </span>
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Nobat Market Logo Center */}
              <div className="relative z-10 flex h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 items-center justify-center rounded-full border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-amber-600/5 backdrop-blur-xl shadow-lg shadow-amber-500/15">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 glow-pulse" />
                <div className="eagle-float-animate"><svg className="relative z-10 h-12 w-12 sm:h-14 sm:w-14 text-amber-400 eagle-breathe-animate" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M35.31 22.3C27.498 42.766 22.138 64.643 20 87.378l103.705 27.79l-4.838 18.052l-99.873-26.763c-.012.954-.035 1.905-.035 2.86a245 245 0 0 0 3.48 41.23h94.146v18.687H26.393a241.5 241.5 0 0 0 13.29 38.547l79.184-21.216l4.838 18.05l-75.64 20.27a243 243 0 0 0 20.396 31.636l61.933-35.756l9.343 16.183l-59.22 34.192a243 243 0 0 0 25.132 24.4l44.73-44.726l13.214 13.215l-43.055 43.052a240 240 0 0 0 28.186 17.357l28.734-49.772l16.186 9.346l-27.987 48.472a237.3 237.3 0 0 0 39.156 12.87c.99 3.566 2.08 7.103 3.25 10.593c-12.36 9.993-24.163 20.49-35.12 31.728a33.7 33.7 0 0 0-14.75-3.373c-18.707 0-33.874 15.164-33.874 33.873c0 1.715.13 3.402.377 5.05c2.02-11.514 12.06-20.265 24.153-20.265c3.103 0 6.068.582 8.8 1.633c-10.103 12.102-19.193 25.08-26.906 39.23c13.897-7.544 27.684-15.755 41.15-24.764a24.5 24.5 0 0 1 1.485 8.43c0 12.122-8.796 22.184-20.352 24.168a34 34 0 0 0 5.168.393c18.71 0 33.873-15.168 33.873-33.875c0-4.17-.757-8.16-2.134-11.848c10.033-7.467 19.823-15.43 29.26-23.984c2.978 5.705 6.203 11.034 9.65 15.818l-43.53 87.17c48.267 22.47 115.7 22.76 157.872 0l-42.13-84.36c3.722-4.81 7.21-10.25 10.426-16.14c8.577 7.617 17.428 14.77 26.483 21.508a33.8 33.8 0 0 0-2.13 11.836c0 18.707 15.165 33.873 33.874 33.873c1.758 0 3.486-.132 5.172-.39c-11.56-1.983-20.355-12.045-20.355-24.168c0-2.964.525-5.805 1.49-8.435c13.464 9.006 27.247 17.223 41.143 24.767c-7.71-14.148-16.78-27.136-26.877-39.238a24.5 24.5 0 0 1 8.775-1.623c12.09 0 22.13 8.75 24.15 20.262c.246-1.647.377-3.332.377-5.047c0-18.71-15.166-33.873-33.875-33.873a33.76 33.76 0 0 0-14.72 3.355c-10.007-10.27-20.74-19.908-31.946-29.12a209 209 0 0 0 5.132-16.886a238 238 0 0 0 23.2-8.283l-28.497-49.356l16.186-9.346l29.34 50.816c9.98-5.11 19.555-10.9 28.672-17.308l-44.146-44.147l13.215-13.216l45.926 45.922a243 243 0 0 0 25.666-24.6l-60.95-35.19l9.343-16.182l63.748 36.804a243 243 0 0 0 20.87-32.07l-77.93-20.883l4.837-18.05l81.534 21.847a241.7 241.7 0 0 0 13.584-39.178h-92.836v-18.687h96.777a245.4 245.4 0 0 0 3.48-41.23c0-1.19-.025-2.376-.044-3.563L397.652 133.22l-4.836-18.054L499.09 86.69c-2.18-22.49-7.52-44.13-15.254-64.39h-.004c-26.517 41.51-83.592 73.934-154.764 87.02c12.67 15.603 20.442 35.52 20.442 57.233c0 31.196-15.723 58.718-39.604 75c-21.27-12.407-42.907-28.878-45.52-43.814l17.653-3.81l-2.235-10.352c15.67-11.335 33.936-9.138 53.433-.01l-18.302-40.414l-41.903 9.04l-2.846-13.188V139l-80.87 17.453l20.458 30.266c-8.595 19.678-2.717 41.68 5.45 58.56c-27.204-15.57-45.592-44.998-45.592-78.73c0-21.713 7.772-41.63 20.44-57.232C118.904 96.234 61.83 63.81 35.312 22.3zm216.45 132.567c5.244-.056 9.98 3.573 11.13 8.9c1.312 6.085-2.557 12.084-8.644 13.397s-12.085-2.556-13.398-8.643c-1.314-6.085 2.556-12.086 8.642-13.4c.76-.163 1.52-.245 2.27-.253z"/>
                </svg></div>
              </div>

              {/* Outer planet orbit ring — elegant reverse spin */}
              <div className="absolute w-[250px] h-[250px] sm:w-[330px] sm:h-[330px] lg:w-[380px] lg:h-[380px] rounded-full border-2 border-white/[0.06] -z-10"
                style={{ animation: "orbit-spin-reverse 120s linear infinite", borderStyle: "dashed", borderWidth: "2px" }} />
              <div className="absolute w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] lg:w-[350px] lg:h-[350px] rounded-full border border-white/[0.03] -z-10"
                style={{ animation: "orbit-spin 90s linear infinite", borderStyle: "dashed", borderWidth: "1px" }} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
      </section>
    </>
  );
}