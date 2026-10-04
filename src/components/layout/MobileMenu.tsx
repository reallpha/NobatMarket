"use client";

// ============================================================================
// منوی موبایل - همبرگری حرفه‌ای نوبت مارکت
// ============================================================================

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

const NAV_ITEMS = [
  { href: "/artists", label: "هنرمندان", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", color: "text-rose-400" },
  { href: "/studios", label: "استودیوها", icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z", color: "text-amber-400" },
  { href: "/flash", label: "پیشنهادهای ویژه", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", color: "text-emerald-400" },
  { href: "/inspiration", label: "الهام‌بخش", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", color: "text-purple-400" },
  { href: "/magazine", label: "مجله", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25", color: "text-sky-400" },
];

export default function MobileMenu({ isLoggedIn, userRole, userName }: { isLoggedIn?: boolean; userRole?: string; userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // ایجاد container برای portal
    const el = document.createElement("div");
    el.id = "mobile-menu-portal";
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // بستن با تغییر مسیر
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = useCallback(() => setIsOpen((p) => !p), []);
  const close = useCallback(() => setIsOpen(false), []);

  // قفل اسکرول
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !portalEl) return null;

  return (
    <>
      {/* ─── دکمه همبرگری ─── */}
      <button
        onClick={toggle}
        className="relative z-[60] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white md:hidden"
        aria-label={isOpen ? "بستن منو" : "باز کردن منو"}
      >
        <div className="relative h-5 w-5">
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "top-2 rotate-45" : "top-[3px] rotate-0"
            }`}
          />
          <span
            className={`absolute left-0 top-[9px] block h-0.5 w-5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "top-2 -rotate-45" : "top-[17px] rotate-0"
            }`}
          />
        </div>
      </button>

      {/* ─── بک‌دراپ + پنل (از طریق portal در body رندر می‌شود) ─── */}
      {createPortal(
        <>
          {/* بک‌دراپ */}
          <div
            className={`fixed inset-0 z-[9998] bg-black/70 transition-opacity duration-300 md:hidden ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={close}
          />

          {/* پنل منو */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-[9999] rounded-t-3xl border-t border-zinc-800 bg-zinc-950 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
              isOpen
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-full opacity-0"
            }`}
            style={{ maxHeight: "80vh" }}
          >
            {/* هندل */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            {/* لینک‌ها */}
            <nav className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "calc(80vh - 20px)" }}>
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`group flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors duration-200 hover:bg-white/[0.04] ${
                        isActive
                          ? "bg-rose-600/15 text-rose-400"
                          : "text-zinc-200 active:bg-zinc-800/60"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? "bg-rose-500/20" : "bg-white/[0.05]"}`}><svg
                          className={`h-[18px] w-[18px] transition-colors duration-300 ${isActive ? "text-rose-400" : (item.color || "text-zinc-400")}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={item.icon}
                          />
                        </svg></span>
                      {item.label}
                      {isActive && (
                        <div className="mr-auto h-1.5 w-1.5 rounded-full bg-rose-500" />
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="my-5 h-px bg-zinc-800" />

              <div className="space-y-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      href={userRole === "ADMIN" ? "/admin/dashboard" : userRole === "ARTIST" ? "/artist/dashboard" : "/client/dashboard"}
                      onClick={close}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-zinc-900 transition-colors active:bg-amber-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      پنل کاربری
                    </Link>
                    <Link
                      href={userRole === "ADMIN" ? "/admin/profile" : userRole === "ARTIST" ? "/artist/profile" : "/client/profile"}
                      onClick={close}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-bold text-white transition-colors active:bg-rose-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      پروفایل ({userName || "کاربر"})
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={close}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-zinc-900 transition-colors active:bg-amber-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                      ورود
                    </Link>
                    <Link
                      href="/register"
                      onClick={close}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-bold text-white transition-colors active:bg-rose-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                      ثبت‌نام
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </>,
        portalEl
      )}
    </>
  );
}
