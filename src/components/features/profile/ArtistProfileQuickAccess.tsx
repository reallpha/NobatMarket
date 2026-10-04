"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatJalaliDate, toPersianNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ArtistProfileQuickAccessProps {
  className?: string;
}

type QuickProfile = {
  avatarUrl: string | null;
  displayName: string;
  artistName: string;
  slug: string;
  isVerified: boolean;
  completedBookings: number;
  followerCount: number;
  satisfactionScore: number;
  totalEarnings: string;
  unreadNotifications: number;
  lastSeenAt: string | null;
};

export function ArtistProfileQuickAccess({ className }: ArtistProfileQuickAccessProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<QuickProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const isArtist = session?.user?.role === "ARTIST";
  const userId = session?.user?.id;

  const fetchArtistProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/public/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const nested = data?.artistProfile ?? {};
        setProfile({
          avatarUrl: data?.avatarUrl ?? null,
          displayName: data?.displayName ?? "هنرمند",
          artistName: nested?.artistName || data?.displayName || "هنرمند",
          slug: nested?.slug || "",
          isVerified: Boolean(nested?.isVerified),
          completedBookings: Number(nested?.completedBookings ?? 0),
          followerCount: Number(nested?.followerCount ?? 0),
          satisfactionScore: Number(nested?.satisfactionScore ?? 0),
          totalEarnings: nested?.totalEarnings?.toString() ?? "0",
          unreadNotifications: Number(data?.unreadNotifications ?? 0),
          lastSeenAt: data?.lastSeenAt ?? null,
        });
      }
    } catch (err) {
      console.error("Failed to fetch artist profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isArtist && userId && !profile && !loading) {
      fetchArtistProfile();
    }
  }, [isArtist, userId, profile, loading, fetchArtistProfile]);

  // بستن با کلید Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isArtist || status === "loading") {
    return null;
  }

  const badgeCount = profile?.unreadNotifications ?? 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-20 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full sm:bottom-6 sm:left-6",
          "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_8px_30px_-8px_rgba(231,68,68,0.6)]",
          "transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_-6px_rgba(231,68,68,0.7)]",
          "active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950",
          "animate-bounce-subtle",
          // احترام به کاهش حرکت
          "motion-reduce:animate-none",
          className
        )}
        aria-label="نمایه هنرمند"
        aria-expanded={isOpen}
      >
        {loading ? (
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.artistName}
            className="h-full w-full rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}

        {/* Notification Badge */}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative">{badgeCount > 9 ? "۹+" : toPersianNumbers(badgeCount)}</span>
          </span>
        )}
      </button>

      {/* Profile Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="دسترسی سریع پروفایل هنرمند"
            className="fixed bottom-36 left-4 right-4 z-50 mx-auto w-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 animate-slide-up sm:bottom-24 sm:left-6 sm:right-auto sm:mx-0 sm:w-full"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800 p-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xl font-bold text-rose-400">
                    {(profile?.artistName?.[0] || profile?.displayName?.[0] || "?")}
                  </div>
                )}
                {profile?.isVerified && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-900 bg-emerald-500">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{profile?.artistName || "هنرمند"}</p>
                <p className="truncate text-xs text-zinc-500" dir="ltr">@{profile?.slug || "..."}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="بستن"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-px border-b border-zinc-800 p-1 bg-zinc-800/50">
              <div className="text-center py-3">
                <p className="text-xl font-bold text-white">{toPersianNumbers(profile?.completedBookings ?? 0)}</p>
                <p className="text-[10px] text-zinc-500">تتو انجام‌شده</p>
              </div>
              <div className="text-center py-3 border-x border-zinc-800">
                <p className="text-xl font-bold text-white">{toPersianNumbers(profile?.followerCount ?? 0)}</p>
                <p className="text-[10px] text-zinc-500">فالوور</p>
              </div>
              <div className="text-center py-3">
                <p className="text-xl font-bold text-amber-400">{profile && profile.satisfactionScore > 0 ? toPersianNumbers(profile.satisfactionScore.toFixed(1)) : "—"}</p>
                <p className="text-[10px] text-zinc-500">امتیاز رضایت</p>
              </div>
            </div>

            {/* Quick Actions */}
            <nav className="p-2">
              {profile?.slug ? (
                <Link
                  href={`/artists/${profile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  مشاهده پروفایل عمومی
                </Link>
              ) : null}
              <Link
                href="/artist/dashboard"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                داشبورد هنرمند
              </Link>
              <Link
                href="/artist/dashboard/portfolio"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                مدیریت پورتفولیو
              </Link>
              <Link
                href="/artist/dashboard/bookings"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                رزروهای من
              </Link>
              <Link
                href="/artist/dashboard/flash"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                تتوهای فلش
              </Link>
              <Link
                href="/artist/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                تنظیمات پروفایل
              </Link>
            </nav>

            {/* Divider */}
            <div className="border-t border-zinc-800 my-1" />

            {/* Revenue & Recent Activity */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">درآمد کل</span>
                <span className="font-semibold text-green-400">{profile && Number(profile.totalEarnings) > 0 ? (Number(profile.totalEarnings)).toLocaleString("fa-IR") + " تومان" : "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-500">آخرین فعالیت</span>
                <span className="text-xs text-zinc-500">{profile?.lastSeenAt ? formatJalaliDate(new Date(profile.lastSeenAt), "short") : "—"}</span>
              </div>
            </div>

            {/* Upgrade Prompt (if not verified) */}
            {profile && !profile.isVerified && (
              <div className="mx-3 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-amber-300">پروفایل شما تأیید نشده</p>
                    <p className="text-[10px] text-amber-500">برای نمایش در جستجو و اعتماد بیشتر، درخواست تأیید ارسال کنید.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
