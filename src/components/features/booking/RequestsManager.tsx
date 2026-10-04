"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate } from "@/lib/utils";

type RequestStatus = "NEW" | "UNDER_REVIEW" | "QUOTE_SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

type CustomRequest = {
  id: string;
  title: string;
  description: string;
  preferredStyle: string | null;
  preferredSize: string | null;
  bodyPlacement: string | null;
  budget: string | null;
  preferredStartDate: string | null;
  status: RequestStatus;
  quotedPrice: string | null;
  quoteNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  client: {
    id: string;
    displayName: string;
    phone: string;
    avatarUrl: string | null;
  };
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "جدید", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  UNDER_REVIEW: { label: "در حال بررسی", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  QUOTE_SENT: { label: "قیمت پیشنهادی ارسال شده", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  ACCEPTED: { label: "تایید شده توسط مشتری", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  REJECTED: { label: "رد شده", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  EXPIRED: { label: "منقضی شده", color: "text-zinc-500", bgColor: "bg-zinc-800/50 border-zinc-800" },
};

export function RequestsManager({ requests: initialRequests }: { requests: CustomRequest[] | unknown[] }) {
  const [requests, setRequests] = useState<CustomRequest[]>(initialRequests as CustomRequest[]);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const { toast } = useToast();

  const handleQuoteSubmit = async () => {
    if (!selectedRequest || !quotePrice) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "QUOTE_SENT" as const, quotedPrice: quotePrice, quoteNotes: quoteNotes }
            : r
        )
      );

      toast({ title: "قیمت پیشنهادی ارسال شد" });
      setQuoteDialogOpen(false);
      setSelectedRequest(null);
      setQuotePrice("");
      setQuoteNotes("");
    } catch {
      toast({ title: "خطا در ارسال", variant: "destructive" });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" as const } : r)));
      toast({ title: "درخواست رد شد" });
    } catch {
      toast({ title: "خطا در عملیات", variant: "destructive" });
    }
  };

  const activeRequests = requests.filter((r) => r.status === "NEW" || r.status === "UNDER_REVIEW" || r.status === "QUOTE_SENT" || r.status === "ACCEPTED");
  const closedRequests = requests.filter((r) => r.status === "REJECTED" || r.status === "EXPIRED");

  return (
    <>
      {/* Active Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          درخواست‌های فعال ({activeRequests.length})
        </h2>
        {activeRequests.length === 0 ? (
          <Card className="border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-zinc-800 p-4">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-white">درخواستی نیست</h3>
              <p className="text-sm text-zinc-500">هنوز درخواست سفارشی جدیدی دریافت نکرده‌اید.</p>
            </CardContent>
          </Card>
        ) : (
          activeRequests.map((request) => {
            const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.NEW;
            return (
              <Card key={request.id} className="border-zinc-800 hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-600">
                        {request.client.displayName?.[0] || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{request.client.displayName}</h3>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatJalaliDate(new Date(request.createdAt), "datetime")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    {request.preferredStyle && (
                      <div>
                        <span className="text-zinc-400">سبک</span>
                        <p className="font-medium text-white">{request.preferredStyle}</p>
                      </div>
                    )}
                    {request.preferredSize && (
                      <div>
                        <span className="text-zinc-400">سایز</span>
                        <p className="font-medium text-white">{request.preferredSize}</p>
                      </div>
                    )}
                    {request.bodyPlacement && (
                      <div>
                        <span className="text-zinc-400">ناحیه بدن</span>
                        <p className="font-medium text-white">{request.bodyPlacement}</p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-zinc-600 line-clamp-2">{request.title}</p>

                  {request.budget && (
                    <div className="mt-3 text-sm">
                      <span className="text-zinc-400">بودجه: </span>
                      <span className="font-medium text-white">
                        {Number(request.budget).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  {request.status === "NEW" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => {
                          setSelectedRequest(request);
                          setQuoteDialogOpen(true);
                        }}
                      >
                        ارسال قیمت پیشنهادی
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-300 text-zinc-600"
                        onClick={() => handleDecline(request.id)}
                      >
                        رد درخواست
                      </Button>
                    </div>
                  )}

                  {request.status === "ACCEPTED" && (
                    <div className="mt-4">
                      <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                        ایجاد رزرو
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Closed Requests */}
      {closedRequests.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-500">
            درخواست‌های بسته شده ({closedRequests.length})
          </h2>
          {closedRequests.map((request) => {
            const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.NEW;
            return (
              <Card key={request.id} className="border-zinc-800 opacity-70">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-zinc-700">{request.client.displayName}</span>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {formatJalaliDate(new Date(request.createdAt), "short")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ارسال قیمت پیشنهادی</DialogTitle>
            <DialogDescription>
              قیمت و مدت زمان تقریبی انجام کار را برای {selectedRequest?.client.displayName} وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">قیمت پیشنهادی (تومان) *</label>
              <Input
                type="number"
                value={quotePrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuotePrice(e.target.value)}
                placeholder="مثلاً 2500000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">یادداشت</label>
              <Textarea
                value={quoteNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuoteNotes(e.target.value)}
                placeholder="توضیحات تکمیلی..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleQuoteSubmit} disabled={!quotePrice} className="bg-rose-600 hover:bg-rose-700">
              ارسال قیمت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
