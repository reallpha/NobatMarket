import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FinanceDashboard } from "@/components/features/finance/FinanceDashboard";

export const metadata: Metadata = {
  title: "داشبورد مالی | پنل مدیریت | نوبت مارکت",
};

export default async function AdminFinancePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  // ─── دریافت آمار مالی ───
  const [
    totalPayments,
    completedPayments,
    pendingWithdrawals,
    approvedWithdrawals,
    allTransactions,
    recentBookings,
  ] = await Promise.all([
    // کل پرداخت‌ها
    db.payment.aggregate({
      _sum: { amount: true },
      where: {},
    }),
    // پرداخت‌های موفق
    db.payment.aggregate({
      _sum: { amount: true, platformFee: true, artistNetAmount: true },
      where: { status: "PAID" },
    }),
    // درخواست‌های برداشت در انتظار
    db.withdrawalRequest.findMany({
      where: { isApproved: null },
      include: {
        wallet: {
          include: {
            owner: {
              select: { id: true, displayName: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // درخواست‌های برداشت تأیید شده
    db.withdrawalRequest.aggregate({
      _sum: { amount: true },
      where: { isApproved: true },
    }),
    // تراکنش‌های اخیر
    db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { displayName: true },
        },
      },
    }),
    // رزروهای اخیر (برای آمار)
    db.booking.findMany({
      where: { status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
      select: { id: true, status: true, agreedPrice: true },
    }),
  ]);

  // ─── سریال‌سازی داده‌ها ───
  const stats = {
    totalRevenue: totalPayments._sum.amount?.toString() || "0",
    totalPlatformFee: completedPayments._sum.platformFee?.toString() || "0",
    totalArtistEarnings: completedPayments._sum.artistNetAmount?.toString() || "0",
    totalCompletedPayments: completedPayments._sum.amount?.toString() || "0",
    pendingWithdrawalTotal: pendingWithdrawals
      .reduce((sum, w) => sum + Number(w.amount), 0)
      .toString(),
    approvedWithdrawalTotal: approvedWithdrawals._sum.amount?.toString() || "0",
    activeBookings: recentBookings.filter((b) =>
      ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
    ).length,
    completedBookings: recentBookings.filter((b) => b.status === "COMPLETED").length,
  };

  const serializedWithdrawals = pendingWithdrawals.map((w) => ({
    id: w.id,
    amount: w.amount.toString(),
    destinationIban: w.destinationIban,
    cardNumber: (w as { cardNumber?: string | null }).cardNumber ?? null,
    accountHolderName: w.accountHolderName,
    bankName: w.bankName,
    createdAt: w.createdAt.toISOString(),
    owner: {
      displayName: w.wallet.owner.displayName,
      phone: w.wallet.owner.phone,
    },
  }));

  const serializedTransactions = allTransactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toString(),
    balanceBefore: t.balanceBefore.toString(),
    balanceAfter: t.balanceAfter.toString(),
    description: t.description,
    isCompleted: t.isCompleted,
    createdAt: t.createdAt.toISOString(),
    userName: t.user.displayName,
  }));

  return (
    <div className="space-y-6">
      <FinanceDashboard
        stats={stats}
        pendingWithdrawals={serializedWithdrawals}
        transactions={serializedTransactions}
      />
    </div>
  );
}
