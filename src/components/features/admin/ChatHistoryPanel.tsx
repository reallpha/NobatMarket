"use client";

// ============================================================================
// پنل «تاریخچه چت» ادمین - مشاهده و مانیتورینگ همه گفتگوهای مشتری ↔ هنرمند
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { toPersianNumbers, formatJalaliDate } from "@/lib/utils";

type Participant = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

type Conversation = {
  id: string;
  title: string | null;
  isActive: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  messageCount: number;
  createdAt: string;
  bookingId: string | null;
  bookingNumber: string | null;
  bookingStatus: string | null;
  participants: Participant[];
};

type Message = {
  id: string;
  content: string;
  attachments: string[];
  messageType: string;
  isDeleted: boolean;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null; role: string };
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ادمین",
  ARTIST: "هنرمند",
  CLIENT: "مشتری",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "درخواست شده",
  PENDING_ARTIST: "در انتظار تأیید هنرمند",
  CONFIRMED: "تأیید شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "تکمیل شده",
  CANCELLED_BY_CLIENT: "لغو (مشتری)",
  CANCELLED_BY_ARTIST: "لغو (هنرمند)",
};

export function ChatHistoryPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [linkOnly, setLinkOnly] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat-history");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const openConversation = async (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/chat-history?conversationId=${conv.id}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  };

  const filtered = conversations.filter((c) => {
    const nameMatch = c.participants
      .map((p) => p.displayName)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!nameMatch) return false;
    if (linkOnly) {
      const preview = (c.lastMessagePreview || "").toLowerCase();
      const hasLink = /(https?:\/\/|www\.|t\.me\/|instagram\.com|wa\.me\/|@)/.test(preview);
      return hasLink;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">تاریخچه چت‌ها</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            همه گفتگوهای بین هنرمندان و مشتریان برای نظارت — {toPersianNumbers(conversations.length)} مکالمه
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی کاربر..."
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <button
            onClick={() => setLinkOnly(!linkOnly)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              linkOnly
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white"
            }`}
            title="فقط گفتگوهایی که احتمالاً لینک خارجی در آنها رد و بدل شده"
          >
            فقط لینک‌های مشکوک
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        {/* لیست مکالمات */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
          <div className="max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-500">مکالمه‌ای یافت نشد</div>
            ) : (
              filtered.map((c) => {
                const artist = c.participants.find((p) => p.role === "ARTIST");
                const client = c.participants.find((p) => p.role === "CLIENT");
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c)}
                    className={`flex w-full items-start gap-3 border-b border-zinc-800/50 px-4 py-3 text-right transition-colors hover:bg-zinc-800/40 ${
                      selected?.id === c.id ? "bg-zinc-800/60 border-r-2 border-r-rose-500" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {artist?.displayName || "هنرمند"} ↔ {client?.displayName || "مشتری"}
                        </span>
                        {c.bookingNumber && (
                          <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                            {c.bookingNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {c.lastMessagePreview || c.title || "بدون پیام"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
                        <span>{toPersianNumbers(c.messageCount)} پیام</span>
                        {c.lastMessageAt && (
                          <span>{formatJalaliDate(new Date(c.lastMessageAt), "datetime")}</span>
                        )}
                        {c.bookingStatus && (
                          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                            {STATUS_LABELS[c.bookingStatus] || c.bookingStatus}
                          </span>
                        )}
                        {!c.isActive && (
                          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-zinc-500">بسته</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* پنجره پیام‌ها */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80">
          {selected ? (
            <div className="flex h-[560px] flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  {selected.participants
                    .map((p) => `${ROLE_LABELS[p.role] || p.role}: ${p.displayName}`)
                    .join("  •  ")}
                </div>
                {selected.bookingNumber && (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-400">
                    رزرو {selected.bookingNumber}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-zinc-500">پیامی در این گفتگو وجود ندارد</div>
                ) : (
                  messages.map((m) => {
                    const senderRole = m.sender.role;
                    const isSuspicious = /(https?:\/\/|www\.|t\.me\/|instagram\.com|wa\.me\/|@)/i.test(m.content);
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border p-3 ${
                          senderRole === "ADMIN"
                            ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-zinc-700 bg-zinc-800/30"
                        }`}
                      >
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            senderRole === "ARTIST"
                              ? "bg-purple-500/10 text-purple-400"
                              : senderRole === "CLIENT"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {ROLE_LABELS[senderRole] || senderRole}
                          </span>
                          <span className="text-xs font-medium text-white">{m.sender.displayName}</span>
                          <span className="text-[10px] text-zinc-600">
                            {formatJalaliDate(new Date(m.createdAt), "datetime")}
                          </span>
                          {isSuspicious && (
                            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                              ⚠️ لینک/اطلاعات تماس
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                          {m.isDeleted ? <span className="italic opacity-50">پیام حذف شده</span> : m.content}
                        </p>
                        {m.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.attachments.map((url, i) => (
                              <img key={i} src={url} alt="پیوست" className="h-16 w-16 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-[560px] items-center justify-center text-zinc-500">
              <div className="text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">یک گفتگو را انتخاب کنید تا پیام‌ها را ببینید</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}