"use client";

import { useState, useEffect } from "react";

function TattooIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 512 512" fill="black">
      <path d="M199.3 367.9c3.1 20.2-3.6 36.9-17.6 50.6c-17.3 17.1-43.3 17.6-63.3 6.5c-8.8-4.9-12.9-5.8-20.1-13.5c-2.1-2.1-6.1-9.5-7.4-11.4l-4.3-10.3c-1.1-11.9-1.7-22.9 1.4-34.3c6.1-21.8 30-36.6 50.5-37.1c17.1-.4 31.9 4.7 43.8 16.1c9.3 8.9 15 20.3 17 33.4M512 114.1V398c0 30.5-11.9 59.1-33.4 80.6c-21.6 21.5-50.2 33.4-80.7 33.4H114.1c-30.5 0-59.1-11.9-80.6-33.4C11.9 457.1 0 428.4 0 397.9V114.1C0 83.6 11.9 55 33.4 33.5C55 11.9 83.6 0 114.1 0H398c30.5 0 59.1 11.9 80.6 33.4S512 83.6 512 114.1m-87.2 262.6c-3.4-4.9-6.6-10.2-13.2-11.1c-18.5-2-37-3.5-55.5-5.2c-10.3-.9-20.7-1.2-30.9-2.7c-10.3-1.5-20.4-4.1-30.6-6.1c-13-2.6-26.2-5.3-36.6-14.1c-2.9-2.5-5.6-7.1-5.7-10.8c-.4-10.3 4.1-19.6 10.2-27.6c7-9.2 14.6-18 22.5-26.4c17.1-18.3 34.5-36.3 51.8-54.4c5.6-5.8 11.7-11.1 16.9-17.2c5.2-6.2 4-12.1-2.4-19.1c-5-5.4-9.6-5.7-16.9-.4c-11.9 8.7-23.6 17.8-35.4 26.5c-25.4 18.7-50.6 37.6-76.3 55.9c-8.2 5.8-18 8.7-28.1 6.7c-13.2-4.8-15.8-13.3-16.9-25.7c-1.7-18.1-3.5-36.2-5.1-54.3c-1.4-16.5-2.8-33-3.7-49.6c-1.1-19.7-1.7-39.5-2.7-59.3c-.2-3.7-1.2-7.5-2.5-11.1c-2.1-5.8-9.3-10.8-13.6-10.1c-5.2.8-11.2 8.1-11.6 14.3c-.5 8.7-.9 17.4-1.3 26.2c-.5 11.5-.8 22.9-1.3 34.4c-.6 13-4.5 48.5-6.4 61.6c-2 13.7-4.1 27.6-7.7 41c-6.1 22.5-23.3 29.4-44.8 18.2c-9.1-4.7-17.6-10.1-26-15.7v153c0 37.6 30.3 67.9 67.9 67.9h140.4l-1.2-1.5c-.9-1-1.7-2-2.6-3.4c0-.4.1-.4.1-.4c-.8-1-1.7-2-2.6-3.3c0-.4.1-.4.1-.4c-2.5-2.9-10.4-13-10.4-20.4c.7-5.4.2-10.3 2-14.2c3.4-7.7 10.3-11.9 18.2-14.5c20.2-6.7 41.2-7.6 62-8.5c28.4-1.2 56.8-1 85.2-1.5c11.7-.5 17.7-7.6 14.7-16.7" />
    </svg>
  );
}

export default function DemoPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("nobat-market_demo_seen");
    if (!seen) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem("nobat-market_demo_seen", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 shadow-[0_0_80px_rgba(251,191,36,0.3)] sm:max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "demoPopupIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Close */}
        <button
          onClick={close}
          className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-black/60 transition-colors hover:bg-black/30 hover:text-black"
          aria-label="بستن"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="relative px-5 pb-5 pt-6 text-center sm:px-7 sm:pb-6 sm:pt-7">
          {/* Icon */}
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-black/10 shadow-lg sm:h-20 sm:w-20">
            <TattooIcon />
          </div>

          {/* Title — lalezar bold */}
          <h2 className="font-[family-name:var(--font-lalezar)] text-3xl font-black leading-tight text-black sm:text-[2.4rem]">
            نوبت مارکت
          </h2>
          <p className="mt-2 text-justify text-sm font-bold leading-6 text-black/70 sm:text-[15px]">
            نسخه ی دمو برای کسب و کار تتو است تا امکانات را مشاهده کنید. نسخه ی اصلی برای همه ی
            کسب و کارهاست و هر کسی می‌تواند آن را مناسب کسب و کار خودش شخصی سازی کند؛ مثلاً
            آرایشگری، سالن و غیره.
          </p>

          {/* Features */}
          <div className="mt-3 space-y-1.5 text-right">
            <div className="flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[9px] font-black text-white">۱</span>
              <span className="text-[12px] font-bold leading-5 text-black">تمامی صفحات و داشبوردها قابل بررسی</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[9px] font-black text-white">۲</span>
              <span className="text-[12px] font-bold leading-5 text-black">ورود با ۳ نقش: مشتری، هنرمند، مدیر</span>
            </div>
          </div>

          {/* Credit */}
          <div className="mt-3 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-red-600/30">
            کدنویسی حرفه‌ای آریا پیکسل
          </div>

          {/* CTA */}
          <button
            onClick={close}
            className="mt-3 w-full rounded-xl bg-black px-5 py-2.5 text-sm font-black text-amber-400 shadow-lg transition-all hover:bg-zinc-900 active:scale-[0.98]"
          >
            شروع بررسی
          </button>
        </div>
      </div>

      <style>{`
        @keyframes demoPopupIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}