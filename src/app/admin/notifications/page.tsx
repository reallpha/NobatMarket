"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { formatJalaliDate } from "@/lib/utils";

type User = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isTicket: boolean;
  senderId: string | null;
  data: unknown;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  user: { id: string; displayName: string; email: string; role: string } | null;
  sender: { id: string; displayName: string; avatarUrl: string | null; role: string } | null;
  replies: {
    id: string;
    message: string;
    fileUrl: string | null;
    fileName: string | null;
    createdAt: string;
    sender: { id: string; displayName: string; avatarUrl: string | null; role: string };
  }[];
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ادمین",
  ARTIST: "هنرمند",
  CLIENT: "مشتری",
};

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string } | null>(null);
  const [pendingSendFile, setPendingSendFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "tickets" | "sent">("all");
  const [userSearch, setUserSearch] = useState("");
  const [showUserPicker, setShowUserPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users
  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  // Fetch notifications (admin sees all)
  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedNotification?.replies]);

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) return { url: data.url, name: file.name };
      toast.error(data.error || "خطا در آپلود فایل");
      return null;
    } catch {
      toast.error("خطا در آپلود فایل");
      return null;
    }
  };

  const handleSend = async () => {
    if (!selectedUser || !title.trim() || !message.trim()) {
      toast.error("لطفاً کاربر، عنوان و متن را وارد کنید");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          title: title.trim(),
          message: message.trim(),
          type: "MESSAGE",
          fileUrl: pendingSendFile?.url || null,
          fileName: pendingSendFile?.name || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("اعلان ارسال شد");
        setTitle("");
        setMessage("");
        setPendingSendFile(null);
        setSelectedUser(null);
        setShowUserPicker(false);
        // Refresh
        const refresh = await fetch("/api/admin/notifications");
        const refreshData = await refresh.json();
        if (refreshData.notifications) setNotifications(refreshData.notifications);
      } else {
        toast.error(data.error || "خطا در ارسال");
      }
    } catch {
      toast.error("خطا در ارسال");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedNotification || (!replyText.trim() && !pendingFile)) return;
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyToId: selectedNotification.id,
          message: replyText.trim(),
          fileUrl: pendingFile?.url || null,
          fileName: pendingFile?.name || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id
              ? { ...n, replies: [...n.replies, data.reply], isRead: true }
              : n
          )
        );
        setSelectedNotification((prev) =>
          prev ? { ...prev, replies: [...prev.replies, data.reply] } : null
        );
        setReplyText("");
        setPendingFile(null);
      }
    } catch {
      toast.error("خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "tickets") return n.isTicket;
    return true;
  });

  const filteredUsers = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">اعلان‌ها و پیام‌ها</h1>
          <p className="mt-1 text-sm text-zinc-500">ارسال اعلان به کاربران و مدیریت پاسخ‌ها</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* ─── پنل چپ: ارسال + لیست اعلان‌ها ─── */}
        <div className="space-y-4">
          {/* فرم ارسال */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
            <h3 className="mb-4 text-sm font-bold text-white">ارسال اعلان جدید</h3>

            {/* انتخاب کاربر */}
            <div className="mb-3 relative">
              <label className="mb-1 block text-xs text-zinc-500">کاربر مقصد</label>
              <button
                onClick={() => setShowUserPicker(!showUserPicker)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-right text-sm text-white transition-colors hover:border-zinc-600"
              >
                {selectedUser ? (
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">{ROLE_LABELS[selectedUser.role] || selectedUser.role}</span>
                    {selectedUser.displayName}
                  </span>
                ) : (
                  <span className="text-zinc-500">انتخاب کاربر...</span>
                )}
              </button>
              {showUserPicker && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                  <div className="sticky top-0 border-b border-zinc-700 bg-zinc-800 p-2">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="جستجو..."
                      className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      autoFocus
                    />
                  </div>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setShowUserPicker(false); setUserSearch(""); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-right text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
                    >
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        u.role === "ADMIN" ? "bg-amber-500/10 text-amber-400" :
                        u.role === "ARTIST" ? "bg-purple-500/10 text-purple-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      <span className="truncate text-white">{u.displayName}</span>
                      <span className="mr-auto truncate text-xs text-zinc-500" dir="ltr">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-zinc-500">عنوان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان اعلان..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs text-zinc-500">متن پیام</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="متن اعلان..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {pendingSendFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300">📎 {pendingSendFile.name}</span>
                <button onClick={() => setPendingSendFile(null)} className="text-zinc-500 hover:text-rose-400">✕</button>
              </div>
            )}
            <label className="mb-2 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
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
                  if (uploaded) setPendingSendFile(uploaded);
                }}
              />
            </label>
            <button
              onClick={handleSend}
              disabled={sending || !selectedUser || !title.trim() || !message.trim()}
              className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
            >
              {sending ? "در حال ارسال..." : "ارسال اعلان"}
            </button>
          </div>

          {/* فیلتر + لیست اعلان‌ها */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
            <div className="flex border-b border-zinc-800">
              {[
                { key: "all" as const, label: "همه", count: notifications.length },
                { key: "tickets" as const, label: "تیکت‌ها", count: notifications.filter((n) => n.isTicket).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                    filter === tab.key ? "border-b-2 border-rose-500 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">اعلانی وجود ندارد</div>
              ) : (
                filteredNotifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNotification(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-zinc-800/50 border-b border-zinc-800/50 ${
                      selectedNotification?.id === n.id ? "bg-zinc-800/50" : ""
                    } ${!n.isRead ? "border-r-2 border-r-amber-500" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                        <span className="text-sm font-medium text-white truncate">{n.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">{n.message}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{new Date(n.createdAt).toLocaleDateString("fa-IR")}</span>
                        {n.user && <span className="text-[10px] text-zinc-500">→ {n.user.displayName}</span>}
                        {n.replies.length > 0 && (
                          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{n.replies.length} پاسخ</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── پنل راست: جزئیات + پاسخ ─── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
          {selectedNotification ? (
            <div className="flex h-[700px] flex-col">
              {/* هدر */}
              <div className="border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedNotification.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span>به: <span className="text-white font-medium">{selectedNotification.user?.displayName || "نامشخص"}</span> <span className="text-zinc-600">({ROLE_LABELS[selectedNotification.user?.role || ""] || selectedNotification.user?.role})</span></span>
                      <span>·</span>
                      <span>{new Date(selectedNotification.createdAt).toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* پیام اصلی */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">تیم پشتیبانی نوبت مارکت</span>
                    <span className="text-[10px] text-zinc-600">{new Date(selectedNotification.createdAt).toLocaleString("fa-IR")}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
                  {selectedNotification.fileUrl && (
                    <a href={selectedNotification.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-blue-400 hover:bg-zinc-700 hover:text-blue-300 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                      {selectedNotification.fileName || "فایل پیوست"}
                    </a>
                  )}
                </div>

                {/* پاسخ‌ها */}
                {selectedNotification.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`mb-4 rounded-xl border p-4 ${
                      reply.sender.role === "ADMIN"
                        ? "border-rose-500/20 bg-rose-500/[0.04] ml-8"
                        : "border-zinc-700 bg-zinc-800/30 mr-8"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        reply.sender.role === "ADMIN" ? "bg-rose-500/10 text-rose-400" :
                        reply.sender.role === "ARTIST" ? "bg-purple-500/10 text-purple-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {reply.sender.role === "ADMIN" ? "تیم پشتیبانی نوبت مارکت" : ROLE_LABELS[reply.sender.role] || reply.sender.role}
                      </span>
                      <span className="text-xs font-medium text-white">{reply.sender.role === "ADMIN" ? "" : reply.sender.displayName}</span>
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
              <div className="border-t border-zinc-800 px-6 py-4">
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
                    ارسال
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[700px] items-center justify-center text-zinc-500">
              <div className="text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-sm">یک اعلان را انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
