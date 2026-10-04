import Link from "next/link";
import MobileMenu from "@/components/layout/MobileMenu";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";

function getDashboardPath(role: string): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "ARTIST") return "/artist/dashboard";
  return "/client/dashboard";
}

export default async function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-[#050507] text-white font-vazirmatn">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-10 w-10">
              <svg width="40" height="40" viewBox="0 0 512 512" fill="currentColor" className="text-white drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                <path d="M199.3 367.9c3.1 20.2-3.6 36.9-17.6 50.6c-17.3 17.1-43.3 17.6-63.3 6.5c-8.8-4.9-12.9-5.8-20.1-13.5c-2.1-2.1-6.1-9.5-7.4-11.4l-4.3-10.3c-1.1-11.9-1.7-22.9 1.4-34.3c6.1-21.8 30-36.6 50.5-37.1c17.1-.4 31.9 4.7 43.8 16.1c9.3 8.9 15 20.3 17 33.4M512 114.1V398c0 30.5-11.9 59.1-33.4 80.6c-21.6 21.5-50.2 33.4-80.7 33.4H114.1c-30.5 0-59.1-11.9-80.6-33.4C11.9 457.1 0 428.4 0 397.9V114.1C0 83.6 11.9 55 33.4 33.5C55 11.9 83.6 0 114.1 0H398c30.5 0 59.1 11.9 80.6 33.4S512 83.6 512 114.1m-87.2 262.6c-3.4-4.9-6.6-10.2-13.2-11.1c-18.5-2-37-3.5-55.5-5.2c-10.3-.9-20.7-1.2-30.9-2.7c-10.3-1.5-20.4-4.1-30.6-6.1c-13-2.6-26.2-5.3-36.6-14.1c-2.9-2.5-5.6-7.1-5.7-10.8c-.4-10.3 4.1-19.6 10.2-27.6c7-9.2 14.6-18 22.5-26.4c17.1-18.3 34.5-36.3 51.8-54.4c5.6-5.8 11.7-11.1 16.9-17.2c5.2-6.2 4-12.1-2.4-19.1c-5-5.4-9.6-5.7-16.9-.4c-11.9 8.7-23.6 17.8-35.4 26.5c-25.4 18.7-50.6 37.6-76.3 55.9c-8.2 5.8-18 8.7-28.1 6.7c-13.2-4.8-15.8-13.3-16.9-25.7c-1.7-18.1-3.5-36.2-5.1-54.3c-1.4-16.5-2.8-33-3.7-49.6c-1.1-19.7-1.7-39.5-2.7-59.3c-.2-3.7-1.2-7.5-2.5-11.1c-2.1-5.8-9.3-10.8-13.6-10.1c-5.2.8-11.2 8.1-11.6 14.3c-.5 8.7-.9 17.4-1.3 26.2c-.5 11.5-.8 22.9-1.3 34.4c-.6 13-4.5 48.5-6.4 61.6c-2 13.7-4.1 27.6-7.7 41c-6.1 22.5-23.3 29.4-44.8 18.2c-9.1-4.7-17.6-10.1-26-15.7v153c0 37.6 30.3 67.9 67.9 67.9h140.4l-1.2-1.5c-.9-1-1.7-2-2.6-3.4c0-.4.1-.4.1-.4c-.8-1-1.7-2-2.6-3.3c0-.4.1-.4.1-.4c-2.5-2.9-10.4-13-10.4-20.4c.7-5.4.2-10.3 2-14.2c3.4-7.7 10.3-11.9 18.2-14.5c20.2-6.7 41.2-7.6 62-8.5c28.4-1.2 56.8-1 85.2-1.5c11.7-.5 17.7-7.6 14.7-16.7" />
              </svg>
            </div>
            <span className="font-lalezar text-xl text-white drop-shadow-sm">نوبت مارکت</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/" className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 transition-all hover:bg-rose-500/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="hidden sm:inline">سایت</span>
            </Link>
            {user ? (
              <Link href={getDashboardPath(user.role)} className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <span className="hidden lg:inline">داشبورد</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" /></svg>
                  <span className="hidden sm:inline">ورود</span>
                </Link>
                <Link href="/register" className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/20">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  <span className="hidden sm:inline">ثبت‌نام</span>
                </Link>
              </>
            )}
          </div>

          <MobileMenu isLoggedIn={!!user} userRole={user?.role} userName={user?.name || ""} />
        </div>
      </header>

      {/* ── Main ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
