"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  replied: boolean;
  createdAt: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  support: "پشتیبانی فنی",
  booking: "مشکل رزرو",
  payment: "مشکل پرداخت",
  artist: "سؤال درباره هنرمند",
  partnership: "همکاری و شراکت",
  feedback: "پیشنهادات و انتقادات",
  other: "سایر",
};

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "replied">("all");

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch {
      toast.error("خطا در بارگذاری پیام‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    } catch {}
  };

  const markAsReplied = async (id: string) => {
    try {
      await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replied: true }),
      });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, replied: true } : m));
      toast.success("تأیید شد");
    } catch {}
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("از حذف پیام اطمینان دارید؟")) return;
    try {
      await fetch(`/api/contact/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelected(null);
      toast.success("پیام حذف شد");
    } catch {}
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "replied") return m.replied;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">پیام‌های تماس</h1>
          <p className="text-sm text-zinc-500 mt-1">{messages.length} پیام دریافت شده</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={"rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (filter === "all" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
            همه ({messages.length})
          </button>
          <button onClick={() => setFilter("unread")} className={"rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (filter === "unread" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
            خوانده‌نشده ({unreadCount})
          </button>
          <button onClick={() => setFilter("replied")} className={"rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (filter === "replied" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
            پاسخ داده
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">پیامی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              onClick={() => { setSelected(msg); if (!msg.read) markAsRead(msg.id); }}
              className={"rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg " +
                (!msg.read ? "border-amber-500/30 bg-amber-500/[0.05]" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!msg.read && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                    <h3 className="text-sm font-bold text-white">{msg.name}</h3>
                    <span className="text-xs text-zinc-600" dir="ltr">{msg.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {msg.subject && (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                        {SUBJECT_LABELS[msg.subject] || msg.subject}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-600">{new Date(msg.createdAt).toLocaleDateString("fa-IR")}</span>
                    {msg.replied && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">✓ پاسخ داده</span>}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-zinc-400" dir="ltr">{selected.email}</p>
              {selected.subject && (
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                  {SUBJECT_LABELS[selected.subject] || selected.subject}
                </span>
              )}
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <p className="text-xs text-zinc-600">{new Date(selected.createdAt).toLocaleString("fa-IR")}</p>
            </div>
            <div className="flex gap-2">
              {!selected.replied && (
                <button onClick={() => markAsReplied(selected.id)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500">
                  ✓ پاسخ داده
                </button>
              )}
              <button onClick={() => deleteMessage(selected.id)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
