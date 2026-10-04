"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

type Stats = {
  totalRevenue: string;
  totalPlatformFee: string;
  totalArtistEarnings: string;
  totalCompletedPayments: string;
  pendingWithdrawalTotal: string;
  approvedWithdrawalTotal: string;
  activeBookings: number;
  completedBookings: number;
};

type Withdrawal = {
  id: string;
  amount: string;
  destinationIban: string;
  cardNumber: string | null;
  accountHolderName: string;
  bankName: string | null;
  createdAt: string;
  owner: { displayName: string; phone: string };
};

type Transaction = {
  id: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
  userName: string;
};

// ============================================================================
// ثابت‌ها
// ============================================================================

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DEPOSIT: { label: "واریز", color: "text-green-600" },
  WITHDRAWAL: { label: "برداشت", color: "text-red-600" },
  BOOKING_INCOME: { label: "درآمد رزرو", color: "text-blue-600" },
  PLATFORM_FEE: { label: "کارمزد پلتفرم", color: "text-amber-600" },
  REFUND: { label: "بازپرداخت", color: "text-orange-600" },
  REFERRAL_BONUS: { label: "جایزه معرفی", color: "text-purple-600" },
};

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export function FinanceDashboard({
  stats,
  pendingWithdrawals: initialWithdrawals,
  transactions: initialTransactions,
}: {
  stats: Stats;
  pendingWithdrawals: Withdrawal[];
  transactions: Transaction[];
}) {
  const [pendingWithdrawals, setPendingWithdrawals] = useState(initialWithdrawals);
  const [transactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState<"payouts" | "ledger">("payouts");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const { toast } = useToast();

  const handleApprove = async (approved: boolean) => {
    if (!selectedWithdrawal) return;
    try {
      const { approvePayout } = await import("@/services/wallet.service");
      const result = await approvePayout(
        selectedWithdrawal.id,
        approved,
        adminNote || undefined,
        approved ? trackingCode || undefined : undefined
      );

      if (result.success) {
        toast({ title: approved ? "درخواست تأیید شد" : "درخواست رد شد" });
        setPendingWithdrawals((prev) => prev.filter((w) => w.id !== selectedWithdrawal.id));
      } else {
        toast({ title: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در عملیات", variant: "destructive" });
    } finally {
      setApproveDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNote("");
      setTrackingCode("");
    }
  };

  const formatToman = (value: string) => {
    return Number(value).toLocaleString("fa-IR") + " تومان";
  };

  return (
    <>
      {/* ─── هدر ─── */}
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد مالی</h1>
        <p className="mt-1 text-sm text-zinc-500">
          آمار مالی، درخواست‌های برداشت و تاریخچه تراکنش‌ها
        </p>
      </div>

      {/* ─── کارت‌های آمار ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کل درآمد</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatToman(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کارمزد پلتفرم</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{formatToman(stats.totalPlatformFee)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">درآمد هنرمندان</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatToman(stats.totalArtistEarnings)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">رزروهای فعال</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.activeBookings}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">رزروهای تکمیل شده</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completedBookings}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">در انتظار برداشت</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{formatToman(stats.pendingWithdrawalTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">برداشت‌های تأیید شده</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{formatToman(stats.approvedWithdrawalTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-6">
            <p className="text-sm text-zinc-500">کل تراکنش‌ها</p>
            <p className="mt-1 text-2xl font-bold text-white">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── تب‌ها ─── */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("payouts")}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "payouts"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          درخواست‌های برداشت ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "ledger"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          دفتر کل تراکنش‌ها
        </button>
      </div>

      {/* ─── درخواست‌های برداشت ─── */}
      {activeTab === "payouts" && (
        <Card className="border-zinc-800">
          <CardContent className="p-0">
            {pendingWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-400">
                درخواست برداشت جدیدی نیست.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-800/50">
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">هنرمند</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">مبلغ</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">شبا / کارت</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">نام صاحب حساب</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">تاریخ</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {pendingWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{w.owner.displayName}</p>
                          <p className="text-xs text-zinc-400">{w.owner.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{formatToman(w.amount)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600" dir="ltr">
                          <p>{w.destinationIban}</p>
                          {w.cardNumber && <p className="mt-0.5 text-zinc-500">کارت: {w.cardNumber}</p>}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{w.accountHolderName}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          {formatJalaliDate(new Date(w.createdAt), "short")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setApproveDialogOpen(true);
                              }}
                            >
                              تأیید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setApproveDialogOpen(true);
                              }}
                            >
                              رد
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── دفتر کل ─── */}
      {activeTab === "ledger" && (
        <Card className="border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50">
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">تاریخ</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">کاربر</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">نوع</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">مبلغ</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">توضیحات</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                        تراکنشی وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const typeConfig = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "text-zinc-600" };
                      const amountNum = Number(tx.amount);
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-800/50">
                          <td className="px-4 py-3 text-zinc-500">
                            {formatJalaliDate(new Date(tx.createdAt), "short")}
                          </td>
                          <td className="px-4 py-3 text-zinc-700">{tx.userName}</td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                          </td>
                          <td className={`px-4 py-3 font-medium ${amountNum >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {amountNum >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString("fa-IR")} ت
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-zinc-500">{tx.description}</td>
                          <td className="px-4 py-3">
                            <Badge className={tx.isCompleted ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}>
                              {tx.isCompleted ? "تکمیل" : "در انتظار"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── دیالوگ تأیید/رد برداشت ─── */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>بررسی درخواست برداشت</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal?.owner.displayName} — {formatToman(selectedWithdrawal?.amount || "0")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-sm">
              <p><span className="text-zinc-400">شبا:</span> {selectedWithdrawal?.destinationIban}</p>
              <p><span className="text-zinc-400">صاحب حساب:</span> {selectedWithdrawal?.accountHolderName}</p>
              {selectedWithdrawal?.bankName && (
                <p><span className="text-zinc-400">بانک:</span> {selectedWithdrawal.bankName}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">شماره پیگیری انتقال (اختیاری)</label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingCode(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 px-3 py-2 text-sm"
                placeholder="شماره پیگیری بانکی"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">یادداشت ادمین</label>
              <Textarea
                value={adminNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                placeholder="یادداشت..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>انصراف</Button>
            <Button variant="destructive" onClick={() => handleApprove(false)}>رد درخواست</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(true)}>
              تأیید و واریز
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
