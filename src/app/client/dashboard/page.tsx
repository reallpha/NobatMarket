// ============================================================================
// داشبورد مشتری - دارک مود
// ============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { toPersianNumbers, toPersianDate, formatPrice } from "@/lib/utils";

export const metadata = {
  title: "داشبورد | پنل مشتری",
};

// SVG icons
function CalendarIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function CheckCircleIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ChatIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function HeartIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}

const STATUS_STYLES: Record<string, { label: string; className: string; dot: string }> = {
  REQUESTED: { label: "درخواست شده", className: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  CONFIRMED: { label: "تأیید شده", className: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "در حال انجام", className: "bg-rose-500/10 text-rose-400", dot: "bg-rose-400" },
  COMPLETED: { label: "تکمیل شده", className: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  CANCELLED_BY_CLIENT: { label: "لغو توسط شما", className: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  CANCELLED_BY_ARTIST: { label: "لغو توسط هنرمند", className: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  NO_SHOW: { label: "عدم حضور", className: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-400" },
  RESCHEDULE_PENDING: { label: "در انتظار تغییر زمان", className: "bg-purple-500/10 text-purple-400", dot: "bg-purple-400" },
};

export default async function ClientDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/client/dashboard");
  }

  const userId = session.user.id;

  const [activeCount, completedCount, unreadAgg, favoritesAgg, recentBookings, notificationAgg] = await Promise.all([
    db.booking.count({
      where: {
        clientId: userId,
        status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
      },
    }),
    db.booking.count({
      where: { clientId: userId, status: "COMPLETED" },
    }),
    db.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    }),
    Promise.all([
      db.portfolioLike.count({ where: { userId } }),
      db.flashLike.count({ where: { userId } }),
    ]),
    db.booking.findMany({
      where: { clientId: userId },
      include: {
        artist: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.count({ where: { userId, isRead: false } }),
  ]);

  const unreadMessages = unreadAgg._sum.unreadCount || 0;
  const favoritesCount = favoritesAgg[0] + favoritesAgg[1];

  const userName = session.user.name || "کاربر عزیز";

  const serializedRecent = recentBookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    title: b.title,
    scheduledDate: b.scheduledDate,
    startTime: b.startTime,
    endTime: b.endTime,
    agreedPrice: b.agreedPrice,
    serviceName: b.service?.name ?? null,
    artist: b.artist,
  }));

  return (
    <div className="space-y-6">
      {/* هدر خوش‌آمدگویی */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(231,68,68,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full border border-rose-500/10" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full border border-amber-500/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_-10px_rgba(245,158,11,0.4)]">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-.553.894L15 16M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                پنل مشتری
              </span>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                خوش آمدید، {userName}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400">
                رزروها، پیام‌ها و فعالیت‌های خود را دنبال کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(unreadMessages > 0 || notificationAgg > 0) && (
              <Link
                href="/client/inbox"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {toPersianNumbers(unreadMessages + notificationAgg)} مورد جدید
              </Link>
            )}
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-500"
            >
              رزرو جدید
            </Link>
          </div>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/client/bookings" className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">رزروهای فعال</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400"><CalendarIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{toPersianNumbers(activeCount)}</p>
          <p className="mt-1 text-xs text-zinc-500">رزرو در حال انجام</p>
        </Link>

        <Link href="/client/bookings" className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">تکمیل شده</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400"><CheckCircleIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{toPersianNumbers(completedCount)}</p>
          <p className="mt-1 text-xs text-zinc-500">رزرو موفق</p>
        </Link>

        <Link href="/client/inbox?tab=chat" className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">پیام‌ها</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"><ChatIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {unreadMessages > 0 ? toPersianNumbers(unreadMessages) : toPersianNumbers(0)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">پیام خوانده نشده</p>
        </Link>

        <Link
          href="/client/dashboard/favorites"
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">علاقه‌مندی‌ها</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400"><HeartIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-400">{toPersianNumbers(favoritesCount)}</p>
          <p className="mt-1 text-xs text-zinc-500">اثر لایک شده</p>
        </Link>
      </div>

      {/* آخرین رزروها */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">آخرین رزروها</h2>
          <Link href="/client/bookings" className="text-sm text-rose-400 transition-colors hover:text-rose-300">
            مشاهده همه
          </Link>
        </div>

        {serializedRecent.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <svg className="h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="mt-3 text-sm text-zinc-500">
              هنوز رزروی ثبت نشده است
            </p>
            <Link
              href="/artists"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
            >
              جستجوی هنرمند
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {serializedRecent.map((b) => {
              const st = STATUS_STYLES[b.status] || STATUS_STYLES.REQUESTED;
              return (
                <Link
                  key={b.id}
                  href="/client/bookings"
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                >
                  {b.artist.avatarUrl ? (
                    <img src={b.artist.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                      {(b.artist.displayName || "ه")[0]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {b.artist.displayName}
                      <span className="mx-1.5 text-zinc-600">•</span>
                      <span className="text-zinc-400">{b.title}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {b.serviceName ? `${b.serviceName} • ` : ""}
                      {toPersianDate(b.scheduledDate)} — {b.startTime} تا {b.endTime}
                      {b.agreedPrice ? ` • ${formatPrice(b.agreedPrice)}` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${st.className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* دسترسی سریع */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/client/inbox?tab=chat"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white group-hover:text-rose-400">پیام‌ها و اعلان‌ها</p>
            {unreadMessages + notificationAgg > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {toPersianNumbers(unreadMessages + notificationAgg)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">گفتگو با هنرمندان و پشتیبانی</p>
        </Link>
        <Link
          href="/artists"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">جستجوی هنرمند</p>
          <p className="mt-1 text-xs text-zinc-500">هنرمندان حرفه‌ای تتو در سراسر ایران</p>
        </Link>
        <Link
          href="/inspiration"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">الهام بگیرید</p>
          <p className="mt-1 text-xs text-zinc-500">جدیدترین نمونه‌کارها در سبک‌های مختلف</p>
        </Link>
        <Link
          href="/flash"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">تتوهای فلش</p>
          <p className="mt-1 text-xs text-zinc-500">طرح‌های آماده برای تتو</p>
        </Link>
      </div>
    </div>
  );
}
