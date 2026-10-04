"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Reply = {
  id: string;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null; role: string };
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isTicket: boolean;
  senderId: string | null;
  link: string | null;
  fileUrl: string | null;
  fileName: string | null;
  data?: unknown;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null; role: string } | null;
  replies: Reply[];
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INFO: { label: "اطلاعات", color: "text-blue-400", bg: "bg-blue-500/10" },
  SUCCESS: { label: "موفقیت", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  WARNING: { label: "هشدار", color: "text-amber-400", bg: "bg-amber-500/10" },
  BOOKING: { label: "رزرو", color: "text-rose-400", bg: "bg-rose-500/10" },
  PAYMENT: { label: "پرداخت", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  MESSAGE: { label: "پیام", color: "text-purple-400", bg: "bg-purple-500/10" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ادمین",
  ARTIST: "هنرمند",
  CLIENT: "مشتری",
};

export function NotificationsList({
  initialNotifications,
  initialUnreadCount,
  showTicketMode = false,
  role = "artist",
  onUnreadChange,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  showTicketMode?: boolean;
  role?: "artist" | "client";
  onUnreadChange?: (count: number) => void;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "tickets">("all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [sendingTicket, setSendingTicket] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string } | null>(null);
  const [pendingTicketFile, setPendingTicketFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // آپلود فایل برای پیوست در پاسخ/تیکت
  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) return { url: data.url, name: file.name };
      toast({ title: data.error || "خطا در آپلود فایل", variant: "destructive" });
      return null;
    } catch {
      toast({ title: "خطا در آپلود فایل", variant: "destructive" });
      return null;
    }
  };
  const { toast } = useToast();

  useEffect(() => {
    onUnreadChange?.(unreadCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.replies]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleReply = async () => {
    if (!selected || (!replyText.trim() && !pendingFile)) return;
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyToId: selected.id,
          message: replyText.trim(),
          fileUrl: pendingFile?.url || null,
          fileName: pendingFile?.name || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        const updatedNotification = { ...selected, replies: [...selected.replies, data.reply], isRead: true };
        setSelected(updatedNotification);
        setNotifications((prev) =>
          prev.map((n) => n.id === selected.id ? updatedNotification : n)
        );
        setReplyText("");
        setPendingFile(null);
      } else {
        toast({ title: data.error || "خطا در ارسال", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارسال پاسخ", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSendTicket = async () => {
    if (!ticketMessage.trim() && !pendingTicketFile) return;
    setSendingTicket(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: ticketMessage.trim(),
          fileUrl: pendingTicketFile?.url || null,
          fileName: pendingTicketFile?.name || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "تیکت ارسال شد" });
        setTicketMessage("");
        setPendingTicketFile(null);
        setShowNewTicket(false);
        window.location.reload();
      } else {
        toast({ title: data.error || "خطا در ارسال", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارسال", variant: "destructive" });
    } finally {
      setSendingTicket(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "tickets") return n.isTicket;
    return true;
  });

  return (
    <div>
      {/* هدر */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">اعلان‌ها</h1>
          <p className="mt-1 text-sm text-zinc-500">{unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : "همه اعلان‌ها خوانده شده"}</p>
        </div>
        <div className="flex items-center gap-2">
          {showTicketMode && (
            <button onClick={() => setShowNewTicket(!showNewTicket)} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-500">
              + تیکت جدید به پشتیبانی
            </button>
          )}
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white">
              همه خوانده شد ✓
            </button>
          )}
        </div>
      </div>

      {/* فرم تیکت جدید */}
      {showNewTicket && showTicketMode && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">تیکت جدید به پشتیبانی نوبت مارکت</h3>
            <button onClick={() => setShowNewTicket(false)} className="text-xs text-zinc-500 hover:text-white">✕</button>
          </div>
          <textarea
            value={ticketMessage}
            onChange={(e) => setTicketMessage(e.target.value)}
            rows={4}
            placeholder="مشکل یا سؤال خود را بنویسید..."
            className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />

          {/* قوانین چت */}
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-[11px] leading-relaxed text-amber-200/80">
            ⚠️ <b className="text-amber-300">قوانین ارتباط در نوبت مارکت:</b> ارسال لینک و اطلاعات تماس (اینستاگرام، تلگرام، شماره تلفن و...) ممنوع است و تمام هماهنگی‌ها باید داخل همین پلتفرم انجام شود. در صورت مشاهده، حساب کاربری مسدود می‌شود.
          </div>

          <div className="mb-3 flex items-center gap-2">
            <label className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
              {uploading ? "در حال آپلود..." : "پیوست فایل"}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploading(true);
                  const uploaded = await uploadFile(file);
                  setUploading(false);
                  if (uploaded) setPendingTicketFile(uploaded);
                }}
              />
            </label>
            {pendingTicketFile && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-300">
                📎 {pendingTicketFile.name}
                <button onClick={() => setPendingTicketFile(null)} className="text-zinc-500 hover:text-rose-400">✕</button>
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendTicket}
              disabled={sendingTicket || (!ticketMessage.trim() && !pendingTicketFile)}
              className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
            >
              {sendingTicket ? "در حال ارسال..." : "ارسال تیکت"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4">
        {/* لیست */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
          {/* فیلترها */}
          <div className="flex border-b border-zinc-800">
            {[
              { key: "all" as const, label: "همه", count: notifications.length },
              { key: "unread" as const, label: "خوانده نشده", count: unreadCount },
              { key: "tickets" as const, label: "تیکت‌ها", count: notifications.filter((n) => n.isTicket).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                  filter === tab.key ? "border-b-2 border-rose-500 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {tab.count > 0 && <span className="ml-1 text-[10px]">({tab.count})</span>}
              </button>
            ))}
          </div>

          {/* آیتم‌ها */}
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">اعلانی وجود ندارد</div>
            ) : (
              filtered.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                return (
                  <button
                    key={n.id}
                    onClick={() => { setSelected(n); if (!n.isRead) handleMarkRead(n.id); }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-right transition-all hover:bg-zinc-800/40 border-b border-zinc-800/30 ${
                      selected?.id === n.id ? "bg-zinc-800/50" : ""
                    } ${!n.isRead ? "border-r-2 border-r-amber-400" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${config.bg} ${config.color}`}>
                      {n.type === "BOOKING" ? "📅" : n.type === "PAYMENT" ? "💰" : n.type === "MESSAGE" ? "💬" : "ℹ️"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                        <span className="text-sm font-medium text-white truncate">{n.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">{n.message}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{new Date(n.createdAt).toLocaleDateString("fa-IR")}</span>
                        {n.replies.length > 0 && (
                          <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                            {n.replies.length} پاسخ
                          </span>
                        )}
                        {n.isTicket && (
                          <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">تیکت</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* جزئیات */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
          {selected ? (
            <div className="flex h-[600px] flex-col">
              {/* هدر */}
              <div className="border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{selected.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{new Date(selected.createdAt).toLocaleString("fa-IR")}</span>
                      {selected.sender && (
                        <>
                          <span>·</span>
                          <span>از {showTicketMode && selected.sender.role === "ADMIN" ? "تیم پشتیبانی نوبت مارکت" : ROLE_LABELS[selected.sender.role] + ": " + selected.sender.displayName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${TYPE_CONFIG[selected.type]?.bg || "bg-zinc-800"} ${TYPE_CONFIG[selected.type]?.color || "text-zinc-400"}`}>
                    {TYPE_CONFIG[selected.type]?.label || selected.type}
                  </span>
                </div>
              </div>

              {/* محتوا */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* پیام اصلی */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                      {selected.sender ? (showTicketMode && selected.sender.role === "ADMIN" ? "تیم پشتیبانی نوبت مارکت" : ROLE_LABELS[selected.sender.role] || "سیستم") : "سیستم"}
                    </span>
                    <span className="text-[10px] text-zinc-600">{new Date(selected.createdAt).toLocaleString("fa-IR")}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  {selected.fileUrl && (
                    <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-blue-400 hover:bg-zinc-700 hover:text-blue-300 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                      {selected.fileName || "فایل پیوست"}
                    </a>
                  )}
                </div>

                {/* پاسخ‌ها */}
                {selected.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        reply.sender.role === "ADMIN" ? "bg-rose-500/10 text-rose-400" :
                        reply.sender.role === "ARTIST" ? "bg-purple-500/10 text-purple-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {showTicketMode && reply.sender.role === "ADMIN" ? "تیم پشتیبانی نوبت مارکت" : ROLE_LABELS[reply.sender.role] || reply.sender.role}
                      </span>
                      <span className="text-xs font-medium text-white">{showTicketMode && reply.sender.role === "ADMIN" ? "" : reply.sender.displayName}</span>
                      <span className="text-[10px] text-zinc-600">{new Date(reply.createdAt).toLocaleString("fa-IR")}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                    {reply.fileUrl && (
                      <a href={reply.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-blue-400 hover:bg-zinc-700 hover:text-blue-300 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                        {reply.fileName || "فایل پیوست"}
                      </a>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* فرم پاسخ */}
              {selected.isTicket && (
                <div className="border-t border-zinc-800 px-5 py-4">
                  {pendingFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300">📎 {pendingFile.name}</span>
                      <button onClick={() => setPendingFile(null)} className="text-zinc-500 hover:text-rose-400">✕</button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                      <input type="file" className="hidden" disabled={uploading || sending} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploading(true);
                        const uploaded = await uploadFile(file);
                        setUploading(false);
                        if (uploaded) setPendingFile(uploaded);
                      }} />
                    </label>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      placeholder="پاسخ دهید..."
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      disabled={sending}
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || (!replyText.trim() && !pendingFile)}
                      className="h-10 rounded-lg bg-rose-600 px-5 text-sm font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
                    >
                      {sending ? "..." : "ارسال"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center text-zinc-500">
              <div className="text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <p className="text-sm">یک اعلان را انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
