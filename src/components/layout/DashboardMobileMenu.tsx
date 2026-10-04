"use client";

// ============================================================================
// منوی همبرگری موبایل داشبورد — فقط تلفن (lg:hidden)
// دسترسی سریع به همه تب‌های نقش کاربر
// ============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import LogoutButton from "@/components/layout/LogoutButton";
import NavUnreadBadge from "@/components/layout/NavUnreadBadge";
import { EagleLogo, type NavItem } from "@/components/layout/DashboardShell";

export default function DashboardMobileMenu({
  navItems,
  roleLabel,
  dashboardHref,
  profileHref,
}: {
  navItems: NavItem[];
  roleLabel: string;
  dashboardHref: string;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // رندر در body تا backdrop-blur هدر، موقعیت fixed را خراب نکند
  useEffect(() => {
    const el = document.createElement("div");
    el.id = "dashboard-menu-portal";
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // بستن با Escape + قفل اسکرول بدنه
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/60 text-zinc-200 backdrop-blur-sm transition-all active:scale-95 lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      {open && portalEl && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-label="منوی داشبورد">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 flex w-[85vw] max-w-xs flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* سربرگ */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-400"><EagleLogo size={24} /></span>
                <span className="font-lalezar text-base text-white">نوبت مارکت</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">{roleLabel}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* همه تب‌ها */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:bg-zinc-800"
                >
                  <svg className="h-5 w-5 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                  {item.label}
                  {item.badge && <NavUnreadBadge />}
                </Link>
              ))}
            </nav>

            {/* دکمه‌های پایین */}
            <div className="space-y-2 border-t border-zinc-800 p-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                ورود به سایت
              </Link>
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                پروفایل
              </Link>
              <LogoutButton className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400" />
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="block py-1 text-center text-[11px] text-zinc-600"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>,
        portalEl
      )}
    </>
  );
}
