"use client";

// ============================================================================
// داشبورد مدیریت - آمار و نمودارها
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDate, formatPrice } from "@/lib/utils";

type Stats = {
  totalUsers: number;
  totalArtists: number;
  totalClients: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: string;
  activeBookings: number;
};

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledDate: string;
  createdAt: string;
  agreedPrice: string | null;
  clientName: string;
  artistName: string;
};

type Artist = {
  id: string;
  artistName: string;
  totalEarnings: string;
  completedBookings: number;
  satisfactionScore: number;
  displayName: string;
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  PENDING_ARTIST: "bg-orange-50 text-orange-700",
  CONFIRMED: "bg-green-50 text-green-700",
  IN_PROGRESS: "bg-purple-50 text-purple-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED_BY_CLIENT: "bg-red-50 text-red-600",
  CANCELLED_BY_ARTIST: "bg-red-50 text-red-600",
  NO_SHOW: "bg-zinc-50 text-zinc-600",
  RESCHEDULE_PENDING: "bg-orange-50 text-orange-700",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "درخواست شده",
  PENDING_ARTIST: "در انتظار تأیید هنرمند",
  CONFIRMED: "تأیید شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "تکمیل شده",
  CANCELLED_BY_CLIENT: "لغو (مشتری)",
  CANCELLED_BY_ARTIST: "لغو (هنرمند)",
  NO_SHOW: "عدم حضور",
  RESCHEDULE_PENDING: "در انتظار تغییر زمان",
};

export function AdminDashboardStats({
  stats,
  recentBookings,
  topArtists,
}: {
  stats: Stats;
  recentBookings: Booking[];
  topArtists: Artist[];
}) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد مدیریت</h1>
        <p className="mt-1 text-sm text-zinc-500">نمای کلی پلتفرم نوبت مارکت</p>
      </div>

      {/* ─── کارت‌های آمار ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کل کاربران</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.totalUsers.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {stats.totalArtists} هنرمند • {stats.totalClients} مشتری
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کل رزروها</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.totalBookings.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {stats.activeBookings} فعال • {stats.completedBookings} تکمیل شده
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کل درآمد</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {Number(stats.totalRevenue).toLocaleString("fa-IR")} تومان
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">نرخ تکمیل</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {stats.totalBookings > 0
                ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── رزروهای اخیر ─── */}
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">رزروهای اخیر</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{b.bookingNumber}</p>
                    <p className="text-xs text-zinc-400">
                      {b.clientName} ← {b.artistName}
                    </p>
                  </div>
                  <div className="text-left">
                    <Badge className={`${STATUS_COLORS[b.status] || "bg-zinc-800 text-zinc-600"} text-xs`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </Badge>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {formatJalaliDate(new Date(b.scheduledDate), "short")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── برترین هنرمندان ─── */}
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">برترین هنرمندان</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {topArtists.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{a.artistName}</p>
                      <p className="text-xs text-zinc-400">{a.completedBookings} رزرو تکمیل شده</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-600">
                      {Number(a.totalEarnings).toLocaleString("fa-IR")} تومان
                    </p>
                    <p className="text-xs text-zinc-400">
                      <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {a.satisfactionScore}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
