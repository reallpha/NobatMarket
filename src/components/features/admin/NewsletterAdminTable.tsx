"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export function NewsletterAdminTable({ subscribers: initial, total }: { subscribers: Subscriber[]; total: number }) {
  const [subscribers, setSubscribers] = useState(initial);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!searchQuery) return subscribers;
    const q = searchQuery.toLowerCase();
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, searchQuery]);

  const handleDelete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/newsletter?id=${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSubscribers((prev) => prev.filter((s) => s.id !== selected.id));
        toast({ title: "ایمیل حذف شد" });
        setDeleteDialogOpen(false);
      } else {
        toast({ title: "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleExport = () => {
    const csv = subscribers.map((s) => s.email).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${subscribers.length} ایمیل خروجی گرفته شد` });
  };

  const activeCount = subscribers.filter((s) => s.isActive).length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">خبرنامه</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} عضو — <span className="text-emerald-400">{activeCount} فعال</span>
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          خروجی CSV
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی ایمیل..."
          className="w-72 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
        />
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">#</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">ایمیل</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">تاریخ عضویت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                      ایمیلی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{s.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${
                          s.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700 text-zinc-400"
                        }`}>
                          {s.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatJalaliDate(new Date(s.createdAt), "short")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelected(s); setDeleteDialogOpen(true); }}
                          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">حذف از خبرنامه</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              آیا از حذف <strong className="text-white">{selected?.email}</strong> از خبرنامه مطمئن هستید?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "در حال حذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
