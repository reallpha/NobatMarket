"use client";

// ============================================================================
// داشبورد مدیریت - طراحی پریمیوم دارک
// مانیتورینگ کامل پلتفرم نوبت مارکت
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import { formatJalaliDate, formatPrice, toLatinNumbers, toPersianNumbers } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

type Stats = {
  totalUsers: number;
  totalArtists: number;
  totalClients: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  onlineUsers: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  thisWeekBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  revenueGrowth: number;
  pendingPayouts: number;
  platformCommission: number;
  totalPortfolioItems: number;
  totalFlashTattoos: number;
  totalStudios: number;
  totalBlogPosts: number;
  totalReviews: number;
  avgRating: number;
  unreadNotifications: number;
};

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledDate: string;
  createdAt: string;
  agreedPrice: string | null;
  depositAmount: string | null;
  clientName: string;
  clientPhone: string;
  artistName: string;
  serviceName: string | null;
};

type Artist = {
  id: string;
  artistName: string;
  slug: string;
  totalEarnings: string;
  completedBookings: number;
  satisfactionScore: number;
  followerCount: number;
  isVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
};

type Request = {
  id: string;
  status: string;
  createdAt: string;
  clientName: string;
  artistName: string;
};

type DailyData = {
  date: string;
  bookings: number;
  users: number;
};

// ============================================================================
// وضعیت رزرو
// ============================================================================

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  REQUESTED: { label: "در انتظار تأیید ادمین", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  PENDING_ARTIST: { label: "در انتظار تأیید هنرمند", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  CONFIRMED: { label: "تأیید شده", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "در حال انجام", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400" },
  COMPLETED: { label: "تکمیل شده", color: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" },
  CANCELLED_BY_CLIENT: { label: "لغو (مشتری)", color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  CANCELLED_BY_ARTIST: { label: "لغو (هنرمند)", color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  NO_SHOW: { label: "عدم حضور", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", dot: "bg-zinc-400" },
  RESCHEDULE_PENDING: { label: "در انتظار تغییر زمان", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
};

const REQUEST_STATUS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "جدید", color: "bg-amber-500/10 text-amber-400" },
  QUOTED: { label: "قیمت ارسال شده", color: "bg-blue-500/10 text-blue-400" },
  CLIENT_ACCEPTED: { label: "پذیرفته شده", color: "bg-green-500/10 text-green-400" },
  CLIENT_REJECTED: { label: "رد شده", color: "bg-red-500/10 text-red-400" },
  DECLINED: { label: "رد شده", color: "bg-red-500/10 text-red-400" },
};

// ============================================================================
// آیکون‌های SVG
// ============================================================================

function IconUsers() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function IconCalendar() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function IconMoney() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconCheck() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconClock() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconTrend() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function IconTrendDown() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
}
function IconImage() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function IconFlash() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function IconStar() {
  return <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}
function IconActivity() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
}
function IconBell() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}

// ============================================================================
// نمودار میله‌ای پیشرفته - طراحی مدرن و خوانا (Single Y-axis, Tooltip state)
// ============================================================================

function MiniBarChart({ data }: { data: DailyData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => Math.max(d.bookings, d.users)), 1);
  const gridLines = [0.25, 0.5, 0.75, 1];

  // فرمت تاریخ جلالی برای نمایش در نمودار (مثلاً: ۱۴۰۳/۰۷/۱۵ → ۱۵ مهر)
  // نکته: toPersianDate ارقام فارسی برمی‌گرداند، پس اول به لاتین تبدیل می‌کنیم
  const formatChartDate = (dateStr: string) => {
    const latin = toLatinNumbers(dateStr);
    const parts = latin.split("/");
    if (parts.length !== 3) return dateStr;
    const day = toPersianNumbers(parts[2].replace(/^0/, ""));
    const month = parseInt(parts[1], 10);
    const year = toPersianNumbers(parts[0]);
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    if (Number.isNaN(month) || month < 1 || month > 12) return dateStr;
    return `${day} ${monthNames[month - 1]} ${year}`;
  };

  return (
    <div className="relative">
      {/* Chart Area with Grid */}
      <div className="relative h-56 px-2">
        {/* Horizontal Grid Lines & Y-axis Labels */}
        <div className="absolute inset-0 left-10 right-2 top-2 bottom-10">
          {gridLines.map((ratio) => (
            <div key={ratio} className="absolute left-0 right-0 border-t border-zinc-800/40" style={{ bottom: `${ratio * 100}%` }}>
              <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 tabular-nums whitespace-nowrap">
                {toPersianNumbers(Math.round(maxValue * ratio))}
              </span>
            </div>
          ))}
          {/* Baseline */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/60" />
        </div>

        {/* Bars Container */}
        <div className="absolute inset-0 left-10 right-2 top-2 bottom-10 flex items-end justify-between gap-1.5 px-1.5">
          {data.map((d, i) => {
            const bookingHeight = d.bookings > 0 ? Math.max((d.bookings / maxValue) * 100, 3) : 0;
            const userHeight = d.users > 0 ? Math.max((d.users / maxValue) * 100, 3) : 0;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={i}
                className="relative flex flex-1 flex-col items-center"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip - Fixed position above chart */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 transform transition-all duration-200 opacity-100 scale-100 pointer-events-none">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center shadow-2xl shadow-black/40 whitespace-nowrap">
                      <div className="text-[10px] text-zinc-400 mb-1.5 font-medium">{formatChartDate(d.date)}</div>
                      <div className="flex items-center gap-3 justify-center">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-rose-600 to-rose-400" />
                          <span className="text-zinc-300">{toPersianNumbers(d.bookings)} رزرو</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-amber-600 to-amber-400" />
                          <span className="text-zinc-300">{toPersianNumbers(d.users)} کاربر</span>
                        </span>
                      </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-zinc-900" />
                  </div>
                )}

                {/* Dual Bars Container - Side by side with gap */}
                <div className="flex flex-1 items-end justify-center gap-1.5 h-full min-h-0">
                  {/* Booking Bar */}
                  <div
                    className={`relative w-[45%] rounded-t transition-all duration-500 ${
                      isHovered ? "scale-y-105 shadow-[0_-8px_20px_-4px_rgba(244,63,94,0.4)]" : ""
                    }`}
                    style={{ height: `${bookingHeight}%` }}
                  >
                    <div className="absolute inset-0 rounded-t bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400" />
                    <div className="absolute inset-0 rounded-t bg-gradient-to-t from-transparent via-white/10 to-transparent" />
                  </div>

                  {/* User Bar */}
                  <div
                    className={`relative w-[45%] rounded-t transition-all duration-500 ${
                      isHovered ? "scale-y-105 shadow-[0_-8px_20px_-4px_rgba(245,158,11,0.4)]" : ""
                    }`}
                    style={{ height: `${userHeight}%` }}
                  >
                    <div className="absolute inset-0 rounded-t bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400" />
                    <div className="absolute inset-0 rounded-t bg-gradient-to-t from-transparent via-white/10 to-transparent" />
                  </div>
                </div>

                {/* Value labels on top of bars when hovered */}
                {isHovered && d.bookings > 0 && (
                  <div className="absolute bottom-full left-[10%] -translate-x-1/2 mb-1 text-[9px] font-bold text-rose-300 whitespace-nowrap">
                    {toPersianNumbers(d.bookings)}
                  </div>
                )}
                {isHovered && d.users > 0 && (
                  <div className="absolute bottom-full right-[10%] -translate-x-1/2 mb-1 text-[9px] font-bold text-amber-300 whitespace-nowrap">
                    {toPersianNumbers(d.users)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis Labels - Jalali Date Format */}
      <div className="flex gap-1.5 px-2 mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="relative inline-block text-[10px] text-zinc-500 font-medium pb-1 group">
              {formatChartDate(d.date)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend & Stats */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-3 w-3 rounded bg-gradient-to-t from-rose-600 to-rose-400" />
            رزروها
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-3 w-3 rounded bg-gradient-to-t from-amber-600 to-amber-400" />
            کاربران جدید
          </span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500">
          <span>میانگین روزانه: <span className="font-medium text-white">{toPersianNumbers(Math.round(data.reduce((s, d) => s + d.bookings, 0) / data.length))}</span> رزرو</span>
          <span>·</span>
          <span><span className="font-medium text-white">{toPersianNumbers(Math.round(data.reduce((s, d) => s + d.users, 0) / data.length))}</span> کاربر</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// حلقه پیشرفت
// ============================================================================

function ProgressRing({ value, size = 60, stroke = 4, color = "stroke-rose-500" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-800" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${color} transition-all duration-1000`}
      />
    </svg>
  );
}

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export function AdminDashboardClient({
  stats,
  recentBookings,
  topArtists,
  recentRequests,
  dailyData,
}: {
  stats: Stats;
  recentBookings: Booking[];
  topArtists: Artist[];
  recentRequests: Request[];
  dailyData: DailyData[];
}) {
  const [activeTab, setActiveTab] = useState<"bookings" | "artists" | "requests">("bookings");
  const completionRate = stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0;
  const cancelRate = stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0;
  const avgRevenuePerBooking = stats.completedBookings > 0 ? Math.round(stats.totalRevenue / stats.completedBookings) : 0;

  return (
    <div className="space-y-6">
      {/* ─── هدر ─── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">داشبورد مدیریت</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">مانیتورینگ کامل پلتفرم نوبت مارکت</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/users" className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white">
            مدیریت کاربران
          </Link>
          <Link href="/admin/bookings" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500">
            مدیریت رزروها
          </Link>
        </div>
      </div>

      {/* ─── ردیف اول: آمار کلی ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconUsers />}
          label="کل کاربران"
          value={stats.totalUsers.toLocaleString("fa-IR")}
          sub={`${toPersianNumbers(stats.totalArtists)} هنرمند · ${toPersianNumbers(stats.totalClients)} مشتری`}
          trend={stats.newUsersThisWeek > 0 ? `+${toPersianNumbers(stats.newUsersThisWeek)} این هفته` : null}
          trendUp={true}
          iconBg="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={<IconCalendar />}
          label="کل رزروها"
          value={stats.totalBookings.toLocaleString("fa-IR")}
          sub={`${toPersianNumbers(stats.completedBookings)} تکمیل · ${toPersianNumbers(stats.pendingBookings)} در انتظار`}
          trend={stats.todayBookings > 0 ? `${toPersianNumbers(stats.todayBookings)} رزرو امروز` : null}
          trendUp={true}
          iconBg="bg-rose-500/10 text-rose-400"
        />
        <StatCard
          icon={<IconMoney />}
          label="کل درآمد"
          value={formatPrice(stats.totalRevenue)}
          sub={`کمیسیون: ${formatPrice(stats.platformCommission)}`}
          trend={stats.revenueGrowth !== 0 ? `${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth}% ماهانه` : null}
          trendUp={stats.revenueGrowth >= 0}
          iconBg="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          icon={<IconCheck />}
          label="نرخ تکمیل"
          value={`${completionRate}%`}
          sub={`${toPersianNumbers(stats.cancelledBookings)} لغو (${toPersianNumbers(cancelRate)}%)`}
          trend={null}
          trendUp={true}
          iconBg="bg-green-500/10 text-green-400"
        />
      </div>

      {/* ─── ردیف دوم: آمار دقیق‌تر ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniStatCard icon={<IconActivity />} label="آنلاین" value={stats.onlineUsers} color="text-green-400" />
        <MiniStatCard icon={<IconClock />} label="رزروهای این هفته" value={stats.thisWeekBookings} color="text-blue-400" />
        <MiniStatCard icon={<IconMoney />} label="پرداخت در انتظار" value={formatPrice(stats.pendingPayouts)} color="text-amber-400" />
        <MiniStatCard icon={<IconBell />} label="اعلان‌های خوانده نشده" value={stats.unreadNotifications} color="text-rose-400" />
      </div>

      {/* ─── ردیف سوم: نمودار + حلقه پیشرفت ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* نمودار رشد ۷ روز اخیر */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">روند هفت روز اخیر</h3>
              <p className="text-xs text-zinc-500 mt-1">رزروها و کاربران جدید هر روز</p>
            </div>
            <div className="flex items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-rose-600 to-rose-400" />رزرو</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-amber-600 to-amber-400" />کاربر جدید</span>
            </div>
          </div>
          <MiniBarChart data={dailyData} />
        </div>

        {/* حلقه‌های وضعیت */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">وضعیت کلی</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing value={completionRate} color="stroke-green-500" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-400">{completionRate}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">تکمیل شده</p>
                <p className="text-xs text-zinc-500">{toPersianNumbers(stats.completedBookings)} رزرو</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing value={stats.pendingBookings > 0 ? Math.round((stats.pendingBookings / stats.totalBookings) * 100) : 0} color="stroke-amber-500" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-400">{toPersianNumbers(stats.pendingBookings)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">در انتظار</p>
                <p className="text-xs text-zinc-500">رزرو فعال</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing value={cancelRate} color="stroke-red-500" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-400">{cancelRate}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">لغو شده</p>
                <p className="text-xs text-zinc-500">{toPersianNumbers(stats.cancelledBookings)} رزرو</p>
              </div>
            </div>

            {/* میانگین درآمد */}
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">میانگین درآمد هر رزرو</span>
                <span className="text-sm font-bold text-amber-400">{formatPrice(avgRevenuePerBooking)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ردیف چهارم: محتوا و نمره رضایت ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <ContentStat icon={<IconImage />} label="پورتفولیو" value={stats.totalPortfolioItems} href="/admin/studios" />
        <ContentStat icon={<IconFlash />} label="تتوی فلش" value={stats.totalFlashTattoos} href="/admin/studios" />
        <ContentStat icon={<IconUsers />} label="استودیوها" value={stats.totalStudios} href="/admin/studios" />
        <ContentStat icon={<IconStar />} label="میانگین نمره" value={`${stats.avgRating.toFixed(1)}`} href="/admin/users" />
        <ContentStat icon={<IconCheck />} label="نظرات" value={stats.totalReviews} href="/admin/comments" />
      </div>

      {/* ─── ردیف پنجم: جدول‌ها ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
        {/* تب‌ها */}
        <div className="flex border-b border-zinc-800">
          {[
            { key: "bookings" as const, label: "رزروهای اخیر", count: recentBookings.length },
            { key: "artists" as const, label: "هنرمندان برتر", count: topArtists.length },
            { key: "requests" as const, label: "درخواست‌ها", count: recentRequests.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-rose-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === tab.key ? "bg-rose-500/10 text-rose-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ─── جدول رزروها ─── */}
        {activeTab === "bookings" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-6 py-3 text-right font-medium">شماره</th>
                  <th className="px-6 py-3 text-right font-medium">مشتری</th>
                  <th className="px-6 py-3 text-right font-medium">هنرمند</th>
                  <th className="px-6 py-3 text-right font-medium">خدمت</th>
                  <th className="px-6 py-3 text-right font-medium">مبلغ</th>
                  <th className="px-6 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-6 py-3 text-right font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentBookings.map((b) => {
                  const st = STATUS_MAP[b.status] || { label: b.status, color: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-400" };
                  return (
                    <tr key={b.id} className="text-sm transition-colors hover:bg-zinc-800/30">
                      <td className="px-6 py-3 font-mono text-xs text-zinc-400">{b.bookingNumber}</td>
                      <td className="px-6 py-3 text-white">{b.clientName}</td>
                      <td className="px-6 py-3 text-zinc-300">{b.artistName}</td>
                      <td className="px-6 py-3 text-zinc-500">{b.serviceName || "-"}</td>
                      <td className="px-6 py-3 text-amber-400 font-medium">{b.agreedPrice ? formatPrice(Number(b.agreedPrice)) : "-"}</td>
                      <td className="px-6 py-3 text-zinc-500 text-xs">{formatJalaliDate(new Date(b.scheduledDate), "short")}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${st.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── جدول هنرمندان ─── */}
        {activeTab === "artists" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-6 py-3 text-right font-medium">رتبه</th>
                  <th className="px-6 py-3 text-right font-medium">هنرمند</th>
                  <th className="px-6 py-3 text-right font-medium">رزروها</th>
                  <th className="px-6 py-3 text-right font-medium">درآمد</th>
                  <th className="px-6 py-3 text-right font-medium">رضایت</th>
                  <th className="px-6 py-3 text-right font-medium">فالوور</th>
                  <th className="px-6 py-3 text-right font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topArtists.map((a, i) => (
                  <tr key={a.id} className="text-sm transition-colors hover:bg-zinc-800/30">
                    <td className="px-6 py-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-amber-500/10 text-amber-400" : i === 1 ? "bg-zinc-400/10 text-zinc-400" : i === 2 ? "bg-orange-500/10 text-orange-400" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                          {a.avatarUrl ? <img src={a.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : a.artistName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{a.artistName}</span>
                            {a.isVerified && (
                              <svg className="h-3.5 w-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">{a.displayName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-300">{toPersianNumbers(a.completedBookings)}</td>
                    <td className="px-6 py-3 font-medium text-green-400">{formatPrice(Number(a.totalEarnings))}</td>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-1 text-amber-400">
                        <IconStar />
                        {toPersianNumbers(a.satisfactionScore.toFixed(0))}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-400">{a.followerCount.toLocaleString("fa-IR")}</td>
                    <td className="px-6 py-3">
                      {a.lastSeenAt && new Date(a.lastSeenAt).getTime() > Date.now() - 15 * 60 * 1000 ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><span className="h-1.5 w-1.5 rounded-full bg-green-400" />آنلاین</span>
                      ) : (
                        <span className="text-xs text-zinc-600">آفلاین</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── جدول درخواست‌ها ─── */}
        {activeTab === "requests" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-6 py-3 text-right font-medium">مشتری</th>
                  <th className="px-6 py-3 text-right font-medium">هنرمند</th>
                  <th className="px-6 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-6 py-3 text-right font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentRequests.map((r) => {
                  const st = REQUEST_STATUS[r.status] || { label: r.status, color: "bg-zinc-500/10 text-zinc-400" };
                  return (
                    <tr key={r.id} className="text-sm transition-colors hover:bg-zinc-800/30">
                      <td className="px-6 py-3 text-white">{r.clientName}</td>
                      <td className="px-6 py-3 text-zinc-300">{r.artistName}</td>
                      <td className="px-6 py-3 text-zinc-500 text-xs">{formatJalaliDate(new Date(r.createdAt), "datetime")}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ردیف ششم: لینک‌های سریع ─── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <QuickLink href="/admin/users" label="مدیریت کاربران" color="text-blue-400" />
        <QuickLink href="/admin/bookings" label="رزروها" color="text-rose-400" />
        <QuickLink href="/admin/finance" label="مالی" color="text-amber-400" />
        <QuickLink href="/admin/favorites" label="علاقه‌مندی‌ها" color="text-pink-400" />
        <QuickLink href="/admin/settings" label="تنظیمات" color="text-zinc-400" />
      </div>
    </div>
  );
}

// ============================================================================
// کامپوننت‌های کوچک
// ============================================================================

function StatCard({ icon, label, value, sub, trend, trendUp, iconBg }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: string | null;
  trendUp: boolean;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-green-400" : "text-red-400"}`}>
            {trendUp ? <IconTrend /> : <IconTrendDown />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{sub}</p>
    </div>
  );
}

function MiniStatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all hover:border-zinc-700">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-lg font-bold text-white">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ContentStat({ icon, label, value, href }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="text-zinc-500 mb-2">{icon}</div>
      <p className="text-xl font-bold text-white">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </Link>
  );
}

function QuickLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white">
      {label}
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
    </Link>
  );
}
