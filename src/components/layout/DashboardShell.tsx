// ============================================================================
// پوسته مشترک داشبورد (ادمین / هنرمند / مشتری)
// ساختار، لوگو، هدر، دکمه‌های سایت/خروج و ناوبری موبایل برای همه نقش‌ها یکسان است.
// ============================================================================

import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import MobileLogoutButton from "@/components/layout/MobileLogoutButton";
import DashboardMobileMenu from "@/components/layout/DashboardMobileMenu";
import NavUnreadBadge from "@/components/layout/NavUnreadBadge";

export function EagleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
      <path d="M199.3 367.9c3.1 20.2-3.6 36.9-17.6 50.6c-17.3 17.1-43.3 17.6-63.3 6.5c-8.8-4.9-12.9-5.8-20.1-13.5c-2.1-2.1-6.1-9.5-7.4-11.4l-4.3-10.3c-1.1-11.9-1.7-22.9 1.4-34.3c6.1-21.8 30-36.6 50.5-37.1c17.1-.4 31.9 4.7 43.8 16.1c9.3 8.9 15 20.3 17 33.4M512 114.1V398c0 30.5-11.9 59.1-33.4 80.6c-21.6 21.5-50.2 33.4-80.7 33.4H114.1c-30.5 0-59.1-11.9-80.6-33.4C11.9 457.1 0 428.4 0 397.9V114.1C0 83.6 11.9 55 33.4 33.5C55 11.9 83.6 0 114.1 0H398c30.5 0 59.1 11.9 80.6 33.4S512 83.6 512 114.1m-87.2 262.6c-3.4-4.9-6.6-10.2-13.2-11.1c-18.5-2-37-3.5-55.5-5.2-10.3-.9-20.7-1.2-30.9-2.7-10.3-1.5-20.4-4.1-30.6-6.1-13-2.6-26.2-5.3-36.6-14.1-2.9-2.5-5.6-7.1-5.7-10.8-.4-10.3 4.1-19.6 10.2-27.6c7-9.2 14.6-18 22.5-26.4 17.1-18.3 34.5-36.3 51.8-54.4 5.6-5.8 11.7-11.1 16.9-17.2 5.2-6.2 4-12.1-2.4-19.1-5-5.4-9.6-5.7-16.9-.4-11.9 8.7-23.6 17.8-35.4 26.5-25.4 18.7-50.6 37.6-76.3 55.9-8.2 5.8-18 8.7-28.1 6.7-13.2-4.8-15.8-13.3-16.9-25.7-1.7-18.1-3.5-36.2-5.1-54.3-1.4-16.5-2.8-33-3.7-49.6-1.1-19.7-1.7-39.5-2.7-59.3-.2-3.7-1.2-7.5-2.5-11.1-2.1-5.8-9.3-10.8-13.6-10.1-5.2.8-11.2 8.1-11.6 14.3-.5 8.7-.9 17.4-1.3 26.2-.5 11.5-.8 22.9-1.3 34.4-.6 13-4.5 48.5-6.4 61.6-2 13.7-4.1 27.6-7.7 41-6.1 22.5-23.3 29.4-44.8 18.2-9.1-4.7-17.6-10.1-26-15.7v153c0 37.6 30.3 67.9 67.9 67.9h140.4l-1.2-1.5c-.9-1-1.7-2-2.6-3.4c0-.4.1-.4.1-.4c-.8-1-1.7-2-2.6-3.3c0-.4.1-.4.1-.4c-2.5-2.9-10.4-13-10.4-20.4c.7-5.4.2-10.3 2-14.2 3.4-7.7 10.3-11.9 18.2-14.5 20.2-6.7 41.2-7.6 62-8.5 28.4-1.2 56.8-1 85.2-1.5 11.7-.5 17.7-7.6 14.7-16.7" />
    </svg>
  );
}

export type NavItem = {
  href: string;
  label: string;
  icon: string; // path d برای آیکون
  /** نمایش نشان قرمز تعداد پیام/اعلان خوانده‌نشده (فقط برای تب پیام‌ها) */
  badge?: boolean;
};

type DashboardShellProps = {
  children: ReactNode;
  /** برچسب نقش در کنار لوگو (ادمین / هنرمند / مشتری) */
  roleLabel: string;
  /** عنوان صفحه داشبورد (برای کلیک لوگو در موبایل) */
  dashboardHref: string;
  profileHref: string;
  /** آیتم‌های منوی کناری دسکتاپ */
  navItems: NavItem[];
  /** آیتم‌های نوار پایین موبایل (ماکزیمم ۴ آیتم + دکمه خروج) */
  mobileNavItems: NavItem[];
};

export default function DashboardShell({
  children,
  roleLabel,
  dashboardHref,
  profileHref,
  navItems,
  mobileNavItems,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-950">
      {/* نوار کناری - دسکتاپ */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 lg:flex">
        {/* لوگو */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center text-amber-400">
            <EagleLogo size={28} />
          </div>
          <span className="font-lalezar text-lg text-white">نوبت مارکت</span>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">{roleLabel}</span>
        </div>

        {/* منوی اصلی */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
              <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
              {item.label}
              {item.badge && <NavUnreadBadge />}
            </Link>
          ))}
        </nav>

        {/* دکمه‌های پایین */}
        <div className="border-t border-zinc-800 p-3 space-y-1.5">
          <Link href="/" className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            ورود به سایت
          </Link>
          <LogoutButton className="flex w-full items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* هدر */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <DashboardMobileMenu
              navItems={navItems}
              roleLabel={roleLabel}
              dashboardHref={dashboardHref}
              profileHref={profileHref}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <EagleLogo size={26} />
            </div>
            <span className="font-lalezar text-base text-white">نوبت مارکت</span>
          </div>
          <div className="hidden text-sm font-medium text-white lg:block">{roleLabel}</div>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-all duration-300 hover:bg-amber-500/20 hover:text-amber-300 hover:shadow-lg hover:shadow-amber-500/10">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span className="hidden sm:inline">سایت</span>
            </Link>
            <Link href={profileHref} className="flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 transition-all duration-300 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-lg hover:shadow-rose-500/10">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="hidden sm:inline">پروفایل</span>
            </Link>
          </div>
        </header>

        {/* منوی موبایل - نوار پایین */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-800 bg-zinc-900 lg:hidden">
          {mobileNavItems.map((item, idx) => {
            const isDashboard = idx === 0;
            const isProfile = item.href === profileHref;
            const activeCls = isDashboard
              ? "text-amber-400 bg-amber-500/5"
              : isProfile
              ? "text-rose-400 bg-rose-500/5"
              : "text-zinc-500 transition-colors hover:text-white";
            return (
              <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${activeCls}`}>
                <span className="relative">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                  {item.badge && <NavUnreadBadge variant="overlay" />}
                </span>
                {item.label}
              </Link>
            );
          })}
          <MobileLogoutButton />
        </nav>

        <main className="flex-1 overflow-auto p-4 pb-20 sm:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
