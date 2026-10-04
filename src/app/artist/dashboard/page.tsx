// ============================================================================
// داشبورد هنرمند - دارک مود
// ============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { toPersianNumbers, toPersianDate, formatPrice, tehranRange } from "@/lib/utils";

export const metadata = {
  title: "داشبورد | پنل هنرمند",
};

// SVG icons
function CalendarIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function ClockIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function MoneyIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function UsersIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function BoltIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}

const STATUS_STYLES: Record<string, { label: string; className: string; dot: string }> = {
  REQUESTED: { label: "درخواست شده", className: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  CONFIRMED: { label: "تأیید شده", className: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "در حال انجام", className: "bg-rose-500/10 text-rose-400", dot: "bg-rose-400" },
  COMPLETED: { label: "تکمیل شده", className: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  CANCELLED_BY_CLIENT: { label: "لغو توسط مشتری", className: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  CANCELLED_BY_ARTIST: { label: "لغو توسط شما", className: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
  NO_SHOW: { label: "عدم حضور", className: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-400" },
  RESCHEDULE_PENDING: { label: "در انتظار تغییر زمان", className: "bg-purple-500/10 text-purple-400", dot: "bg-purple-400" },
};

export default async function ArtistDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/artist/dashboard");
  }

  const userId = session.user.id;

  const [artistProfile, todayRange, monthRange] = await Promise.all([
    db.artistProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        artistName: true,
        slug: true,
        isVerified: true,
        followerCount: true,
        completedBookings: true,
        totalEarnings: true,
      },
    }),
    Promise.resolve(tehranRange("day")),
    Promise.resolve(tehranRange("month")),
  ]);

  const hasProfile = !!artistProfile;

  const [todayBookings, pendingCount, monthIncomeAgg, recentBookings, unreadAgg] = await Promise.all([
    db.booking.count({
      where: {
        artistId: userId,
        scheduledDate: { gte: todayRange.start, lt: todayRange.end },
        status: {
          notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST", "NO_SHOW"],
        },
      },
    }),
    db.booking.count({ where: { artistId: userId, status: "REQUESTED" } }),
    db.booking.aggregate({
      where: {
        artistId: userId,
        status: "COMPLETED",
        completedAt: { gte: monthRange.start, lt: monthRange.end },
      },
      _sum: { agreedPrice: true },
    }),
    db.booking.findMany({
      where: { artistId: userId },
      include: {
        client: {
          select: { id: true, displayName: true, avatarUrl: true, phone: true },
        },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    }),
  ]);

  const monthIncome = monthIncomeAgg._sum.agreedPrice;
  const totalEarnings = Number(artistProfile?.totalEarnings ?? 0);
  const unreadMessages = unreadAgg._sum.unreadCount || 0;

  const userName = session.user.name || "هنرمند عزیز";

  const serializedRecent = recentBookings.map((b) => ({
    id: b.id,
    status: b.status,
    title: b.title,
    scheduledDate: b.scheduledDate,
    startTime: b.startTime,
    endTime: b.endTime,
    agreedPrice: b.agreedPrice,
    serviceName: b.service?.name ?? null,
    client: b.client,
  }));

  return (
    <div className="space-y-6">
      {/* هشدار در انتظار تأیید عضویت */}
      {session.user.status === "PENDING_VERIFICATION" && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.08),transparent_55%)]" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">حساب شما در انتظار تأیید مدیریت است</h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-200/80">
                حساب شما با موفقیت ساخته شده و پس از بررسی و تأیید توسط مدیریت، در فهرست هنرمندان نوبت مارکت نمایش داده خواهد شد.
                تا آن زمان می‌توانید پروفایل هنرمند و نمونه‌کارهای خود را آماده کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* هدر خوش‌آمدگویی */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              خوش آمدید، {userName}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {hasProfile
                ? "وضعیت رزروها، درآمد و فعالیت‌های خود را مشاهده کنید."
                : "برای شروع فعالیت، پروفایل هنرمند خود را تکمیل کنید."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {unreadMessages > 0 && (
              <Link
                href="/artist/inbox?tab=chat"
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {toPersianNumbers(unreadMessages)} پیام جدید
              </Link>
            )}
            {hasProfile && artistProfile?.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                تأیید شده
              </span>
            )}
          </div>
        </div>
      </div>

      {/* پیام تکمیل پروفایل */}
      {!hasProfile && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 text-amber-400"><BoltIcon /></span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white">
                پروفایل هنرمند خود را تکمیل کنید
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                با تکمیل پروفایل، مشتریان بیشتری شما را پیدا می‌کنند و می‌توانید رزرو دریافت کنید.
              </p>
              <Link
                href="/artist/onboarding"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                تکمیل پروفایل
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">رزروهای امروز</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400"><CalendarIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{toPersianNumbers(todayBookings)}</p>
          <p className="mt-1 text-xs text-zinc-500">جلسه امروز</p>
        </div>

        <Link href="/artist/dashboard/bookings" className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-colors hover:border-amber-500/30 hover:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">در انتظار تأیید</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"><ClockIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-400">{toPersianNumbers(pendingCount)}</p>
          <p className="mt-1 text-xs text-zinc-500">درخواست جدید</p>
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">درآمد این ماه</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400"><MoneyIcon /></span>
          </div>
          <p className="mt-3 text-lg font-bold leading-relaxed text-green-400">
            {monthIncome !== null && Number(monthIncome) > 0
              ? formatPrice(monthIncome)
              : toPersianNumbers(0)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {monthIncome !== null && Number(monthIncome) > 0
              ? "درآمد خالص ماه جاری"
              : `درآمد کل: ${formatPrice(totalEarnings)}`}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">فالوورها</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400"><UsersIcon /></span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {hasProfile ? toPersianNumbers(artistProfile?.followerCount || 0) : "-"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">دنبال‌کننده</p>
        </div>
      </div>

      {/* آخرین رزروها */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">آخرین رزروها</h2>
          <Link href="/artist/dashboard/bookings" className="text-sm text-rose-400 transition-colors hover:text-rose-300">
            مشاهده همه
          </Link>
        </div>

        {serializedRecent.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <svg className="h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="mt-3 text-sm text-zinc-500">
              {hasProfile
                ? "هنوز رزروی ثبت نشده است"
                : "ابتدا پروفایل خود را تکمیل کنید تا رزرو دریافت کنید"}
            </p>
            {!hasProfile && (
              <Link
                href="/artist/onboarding"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                تکمیل پروفایل
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {serializedRecent.map((b) => {
              const st = STATUS_STYLES[b.status] || STATUS_STYLES.REQUESTED;
              return (
                <Link
                  key={b.id}
                  href="/artist/dashboard/bookings"
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                >
                  {b.client.avatarUrl ? (
                    <img src={b.client.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                      {(b.client.displayName || "م")[0]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {b.client.displayName}
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/artist/dashboard/portfolio"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">نمونه‌کارها</p>
          <p className="mt-1 text-xs text-zinc-500">مدیریت نمونه‌کارهای پورتفولیو</p>
        </Link>
        <Link
          href="/artist/dashboard/flash"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">تتوی فلش</p>
          <p className="mt-1 text-xs text-zinc-500">افزودن و مدیریت طرح‌های فلش</p>
        </Link>
        <Link
          href="/artist/dashboard/availability"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-rose-500/30 hover:bg-zinc-800/50"
        >
          <p className="text-sm font-semibold text-white group-hover:text-rose-400">نوبت‌دهی</p>
          <p className="mt-1 text-xs text-zinc-500">ساعت کاری و روزهای مرخصی</p>
        </Link>
      </div>
    </div>
  );
}
