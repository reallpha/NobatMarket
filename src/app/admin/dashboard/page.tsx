// ============================================================================
// داشبورد مدیریت - دارک مود پریمیوم
// ============================================================================

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminDashboardClient } from "@/components/features/admin/AdminDashboardClient";
import { toPersianDate, tehranRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: "داشبورد مدیریت | نوبت مارکت",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const now = new Date();
  // همه بازه‌ها بر اساس روز تهران (Asia/Tehran) — پلتفرم ایرانی، تقویم شمسی
  const { start: today } = tehranRange("day", now);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { start: thisMonth } = tehranRange("month", now);
  const { start: lastMonth } = tehranRange("month", new Date(thisMonth.getTime() - 1));

  // ─── آمار کاربران و رزروها ───
  const [
    totalUsers, totalArtists, totalClients,
    newUsersThisWeek, newUsersThisMonth,
    onlineUsers,
    totalBookings, completedBookings, cancelledBookings,
    todayBookings, thisWeekBookings, pendingBookings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ARTIST" } }),
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { createdAt: { gte: thisWeek } } }),
    db.user.count({ where: { createdAt: { gte: thisMonth } } }),
    db.user.count({ where: { lastSeenAt: { gte: new Date(now.getTime() - 15 * 60 * 1000) } } }),
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: { in: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST"] } } }),
    db.booking.count({ where: { createdAt: { gte: today } } }),
    db.booking.count({ where: { createdAt: { gte: thisWeek } } }),
    db.booking.count({ where: { status: { in: ["REQUESTED", "PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS", "RESCHEDULE_PENDING"] } } }),
  ]);

  // ─── آمار مالی ───
  const [totalRevenue, thisMonthRevenue, lastMonthRevenue, pendingPayouts, platformCommission] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: thisMonth } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: lastMonth, lt: thisMonth } } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "WITHDRAWAL" } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "PLATFORM_FEE" } }),
  ]);

  // ─── آمار محتوا ───
  const [totalPortfolioItems, totalFlashTattoos, totalStudios, totalBlogPosts, totalReviews, avgRating] = await Promise.all([
    db.portfolioItem.count(),
    db.flashTattoo.count(),
    db.studio.count(),
    db.blogPost.count({ where: { isPublished: true } }),
    db.review.count(),
    db.review.aggregate({ _avg: { rating: true } }),
  ]);

  // ─── رزروهای اخیر (با include برای روابط) ───
  const recentBookingsRaw = await db.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      client: { select: { displayName: true, phone: true } },
      artist: { select: { displayName: true } },
      service: { select: { name: true } },
    },
  });

  const serializedBookings = recentBookingsRaw.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    scheduledDate: b.scheduledDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    agreedPrice: b.agreedPrice?.toString() ?? null,
    depositAmount: null,
    clientName: b.client.displayName,
    clientPhone: b.client.phone,
    artistName: b.artist.displayName,
    serviceName: b.service?.name || null,
  }));

  // ─── هنرمندان برتر ───
  const topArtistsRaw = await db.artistProfile.findMany({
    orderBy: { totalEarnings: "desc" },
    take: 8,
    include: {
      user: { select: { displayName: true, avatarUrl: true, lastSeenAt: true } },
    },
  });

  const serializedArtists = topArtistsRaw.map((a) => ({
    id: a.id,
    artistName: a.artistName,
    slug: a.slug,
    totalEarnings: a.totalEarnings.toString(),
    completedBookings: a.completedBookings,
    satisfactionScore: a.satisfactionScore,
    followerCount: a.followerCount,
    isVerified: a.isVerified,
    displayName: a.user.displayName,
    avatarUrl: a.user.avatarUrl,
    lastSeenAt: a.user.lastSeenAt?.toISOString() ?? null,
  }));

  // ─── درخواست‌های اخیر ───
  const recentRequestsRaw = await db.customRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      client: { select: { displayName: true } },
    },
  });

  // Get artist names for requests
  const artistIds = [...new Set(recentRequestsRaw.map((r) => r.artistId))];
  const artistProfiles = await db.artistProfile.findMany({
    where: { userId: { in: artistIds } },
    select: { userId: true, artistName: true },
  });
  const artistNameMap = new Map(artistProfiles.map((a) => [a.userId, a.artistName]));

  const serializedRequests = recentRequestsRaw.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    clientName: r.client.displayName,
    artistName: artistNameMap.get(r.artistId) || "نامشخص",
  }));

  // ─── اعلان‌ها ───
  const unreadNotifications = await db.notification.count({ where: { isRead: false } });

  // ─── رشد روزانه (۷ روز اخیر) ───
  const dailyData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      return Promise.all([
        db.booking.count({ where: { createdAt: { gte: d, lt: next } } }),
        db.user.count({ where: { createdAt: { gte: d, lt: next } } }),
      ]).then(([bookings, users]) => ({
        // تاریخ جلالی شمسی (سال/ماه/روز) — همه چیز به شمسی و فارسی
        date: toPersianDate(d),
        bookings,
        users,
      }));
    })
  );

  const revenue = Number(totalRevenue._sum.amount ?? 0);
  const monthRevenue = Number(thisMonthRevenue._sum.amount ?? 0);
  const lastMonthRev = Number(lastMonthRevenue._sum.amount ?? 0);
  const commission = Number(platformCommission._sum.amount ?? 0);
  const pendingPay = Number(pendingPayouts._sum.amount ?? 0);
  const revenueGrowth = lastMonthRev > 0 ? Math.round(((monthRevenue - lastMonthRev) / lastMonthRev) * 100) : 0;

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        totalArtists,
        totalClients,
        newUsersThisWeek,
        newUsersThisMonth,
        onlineUsers,
        totalBookings,
        completedBookings,
        cancelledBookings,
        todayBookings,
        thisWeekBookings,
        pendingBookings,
        totalRevenue: revenue,
        thisMonthRevenue: monthRevenue,
        revenueGrowth,
        pendingPayouts: pendingPay,
        platformCommission: commission,
        totalPortfolioItems,
        totalFlashTattoos,
        totalStudios,
        totalBlogPosts,
        totalReviews,
        avgRating: avgRating._avg.rating || 0,
        unreadNotifications,
      }}
      recentBookings={serializedBookings}
      topArtists={serializedArtists}
      recentRequests={serializedRequests}
      dailyData={dailyData}
    />
  );
}
