// ============================================================================
// لایوت پنل هنرمند - مبتنی بر پوسته مشترک داشبورد (هم‌شکل ادمین)
// ============================================================================

import type { Metadata } from "next";
import DashboardShell, { type NavItem } from "@/components/layout/DashboardShell";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "پنل هنرمند",
  icons: { icon: "/favicon.svg" },
};

const NAV_ITEMS: NavItem[] = [
  { href: "/artist/dashboard", label: "داشبورد", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/artist/dashboard/portfolio", label: "پورتفولیو", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/artist/dashboard/bookings", label: "رزروها", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/artist/dashboard/payments", label: "پرداخت‌ها", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/artist/inbox", label: "پیام‌ها و اعلان‌ها", badge: true, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { href: "/artist/dashboard/availability", label: "نوبت‌دهی", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/artist/dashboard/services", label: "قیمت‌گذاری", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/artist/dashboard/flash", label: "تتوی فلش", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/artist/dashboard/favorites", label: "علاقه‌مندی‌ها", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/artist/dashboard", label: "داشبورد", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/artist/dashboard/bookings", label: "رزروها", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/artist/inbox", label: "پیام‌ها", badge: true, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { href: "/artist/profile", label: "پروفایل", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ARTIST") redirect("/login");

  // دسترسی سریع به پروفایل عمومی از طریق ArtistProfileQuickAccess سراسری انجام می‌شود
  return (
    <DashboardShell
      roleLabel="هنرمند"
      dashboardHref="/artist/dashboard"
      profileHref="/artist/profile"
      navItems={NAV_ITEMS}
      mobileNavItems={MOBILE_NAV}
    >
      {children}
    </DashboardShell>
  );
}
