"use client";

// ============================================================================
// لایوت چت - Split Pane (WhatsApp-style) - دارک مود
// ============================================================================
//
// ⚠️ @todo Stage 8: جایگزینی Polling با WebSocket
//    در حال حاضر از React Query با refetchInterval: 3000ms استفاده می‌شود.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate, toPersianNumbers } from "@/lib/utils";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "@/services/message.service";
import { getBookingRatingState, leaveReview } from "@/services/review.service";

type Conversation = {
  id: string;
  title: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  otherUser: { id: string; displayName: string; avatarUrl: string | null };
  bookingId: string | null;
  requestId: string | null;
};

type Message = {
  id: string;
  content: string;
  attachments: string[];
  messageType: string;
  isDeleted: boolean;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null };
};

export function ChatLayout({ currentUserId, className }: { currentUserId: string; className?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  // امتیاز ۰ تا ۱۰۰ پس از تکمیل پروژه
  const [ratingState, setRatingState] = useState<{ show: boolean; bookingNumber: string } | null>(null);
  const [score, setScore] = useState(80);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      const result = await getConversations();
      if (result.success && result.data) {
        setConversations(result.data.conversations);
      }
    } catch {
      // silent
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // silent = true برای به‌روزرسانی پس‌زمینه (بدون نمایش اسپینر و بدون پرش صفحه)
  const fetchMessages = useCallback(
    async (conversationId: string, silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const result = await getMessages(conversationId);
        if (result.success && result.data) {
          const incoming = result.data.messages as Message[];
          // فقط وقتی تغییر واقعی وجود دارد state را به‌روز کن تا از
          // رندر/اسکرول بی‌مورد و پرش صفحه جلوگیری شود
          setMessages((prev) => {
            const sameCount = prev.length === incoming.length;
            const sameLast = prev.length > 0 && incoming.length > 0 && prev[0]?.id === incoming[0]?.id;
            if (sameCount && sameLast) return prev;
            return incoming;
          });
          if (!silent) await markAsRead(conversationId);
        }
      } catch {
        if (!silent) toast({ title: "خطا در دریافت پیام‌ها", variant: "destructive" });
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [toast]
  );

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessages([]);
    setRatingState(null);
    await fetchMessages(conv.id);
    await markAsRead(conv.id).catch(() => undefined);
    if (conv.bookingId) {
      try {
        const r = await getBookingRatingState(conv.bookingId);
        if (r.success && r.data) setRatingState({ show: r.data.show, bookingNumber: r.data.bookingNumber });
      } catch {
        /* silent */
      }
    }
  };

  const submitReview = async () => {
    if (!selectedConversation?.bookingId) return;
    if (reviewComment.trim().length < 5) {
      toast({ title: "نظر باید حداقل ۵ کاراکتر باشد", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);
    try {
      const r = await leaveReview({
        bookingId: selectedConversation.bookingId,
        rating: 5,
        score100: score,
        comment: reviewComment.trim(),
      });
      if (r.success) {
        toast({ title: "امتیاز شما ثبت شد ✓" });
        setRatingState(null);
        setReviewComment("");
      } else {
        toast({ title: r.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ثبت امتیاز", variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!selectedConversation) return;
    const conversationId = selectedConversation.id;
    const interval = setInterval(() => {
      void fetchMessages(conversationId, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const result = await sendMessage(selectedConversation.id, newMessage);
      if (result.success) {
        setNewMessage("");
        await fetchMessages(selectedConversation.id, true);
      } else {
        toast({ title: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارسال پیام", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── موبایل: نمایش لیست یا چت ───
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const selectConversationMobile = async (conv: Conversation) => {
    await selectConversation(conv);
    setMobileView("chat");
  };

  const goBackToList = () => {
    setMobileView("list");
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 sm:flex-row ${className || "h-[calc(100dvh-12rem)] sm:h-[calc(100vh-4rem)]"}`}>
      {/* ─── پنل لیست مکالمات ─── */}
      <div className={`w-full shrink-0 border-b sm:border-b-0 sm:border-l border-zinc-800 bg-zinc-900 ${
        mobileView === "chat" ? "hidden sm:flex sm:w-80 sm:flex-col" : "flex flex-col"
      }`}>
        <div className="border-b border-zinc-800 px-4 py-3 sm:p-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">پیام‌ها</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-800 sm:h-16" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              مکالمه‌ای ندارید
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversationMobile(conv)}
                className={`flex w-full items-center gap-3 p-3 sm:p-4 text-right transition-colors ${
                  selectedConversation?.id === conv.id
                    ? "bg-zinc-800 sm:border-r-2 border-rose-500"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                  {conv.otherUser.avatarUrl ? (
                    <img src={conv.otherUser.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    conv.otherUser.displayName?.[0] || "?"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {conv.otherUser.displayName}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-zinc-500 sm:text-xs">
                        {formatJalaliDate(new Date(conv.lastMessageAt), "short")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 truncate">
                    {conv.lastMessagePreview || conv.title || "شروع گفتگو"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="shrink-0 bg-rose-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
                    {conv.unreadCount}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── پنجره چت ─── */}
      <div className={`flex flex-1 flex-col min-h-0 ${
        mobileView === "list" ? "hidden sm:flex" : "flex"
      }`}>
        {selectedConversation ? (
          <>
            {/* هدر چت — شامل دکمه بازگشت در موبایل */}
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              <button
                onClick={goBackToList}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white sm:hidden"
                title="بازگشت"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
              </button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                {selectedConversation.otherUser.displayName?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {selectedConversation.otherUser.displayName}
                </p>
                <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                  {selectedConversation.bookingId
                    ? "گفتگو درباره رزرو"
                    : selectedConversation.requestId
                    ? "گفتگو درباره درخواست"
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 sm:p-4 sm:space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  پیامی وجود ندارد. گفتگو را شروع کنید!
                </div>
              ) : (
                [...messages].reverse().map((msg) => {
                  const isMine = msg.sender.id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                          isMine
                            ? "bg-rose-500 text-white rounded-br-md"
                            : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                        }`}
                      >
                        {!isMine && (
                          <p className="mb-1 text-xs font-medium text-zinc-400">
                            {msg.sender.displayName}
                          </p>
                        )}
                        {msg.isDeleted ? (
                          <p className="text-sm italic opacity-50">پیام حذف شده</p>
                        ) : (
                          <p className="text-[13px] sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((url, i) => (
                              <img key={i} src={url} alt="پیوست" className="h-20 w-20 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}
                        <p className={`mt-1 text-[10px] ${isMine ? "text-rose-200" : "text-zinc-500"}`}>
                          {formatJalaliDate(new Date(msg.createdAt), "datetime")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {ratingState?.show && selectedConversation.bookingId && (
              <div className="border-t border-amber-500/20 bg-amber-500/[0.05] p-4">
                <p className="text-xs font-bold text-amber-300">
                  پروژه تکمیل شد ✓ — به هنرمند از ۰ تا ۱۰۰ امتیاز بدهید
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  این امتیاز در پروفایل عمومی هنرمند نمایش داده می‌شود (رزرو {ratingState.bookingNumber})
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1 text-center text-sm font-black text-amber-300">
                    {toPersianNumbers(score)}
                  </span>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  placeholder="تجربه خود را بنویسید (حداقل ۵ کاراکتر)..."
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="mt-2 rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {submittingReview ? "در حال ثبت..." : "ثبت امتیاز و نظر"}
                </button>
              </div>
            )}

            <div className="border-t border-zinc-800 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !selectedConversation) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.url) {
                        const result = await sendMessage(selectedConversation.id, "", [data.url]);
                        if (!result.success) {
                          toast({ title: result.message, variant: "destructive" });
                        } else {
                          await fetchMessages(selectedConversation.id, true);
                        }
                      } else {
                        toast({ title: data.error || "خطا در آپلود", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "خطا در ارسال فایل", variant: "destructive" });
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sendingMessage}
                  className="shrink-0 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white"
                  title="پیوست تصویر"
                >
                  {uploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-rose-500" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21zM9.75 9.75h.008v.008H9.75V9.75z" /></svg>
                  )}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="پیام بنویسید..."
                  className="flex-1"
                  disabled={sendingMessage}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {sendingMessage ? "..." : "ارسال"}
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-zinc-600 sm:mt-2">
                ⚠️ ارسال لینک و اطلاعات تماس خارجی ممنوع است
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center px-4">
            <div>
              <svg className="mx-auto mb-3 h-10 w-10 text-zinc-700 sm:mb-4 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-zinc-500">
                یک مکالمه را انتخاب کنید
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
