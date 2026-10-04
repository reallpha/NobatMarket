"use client";

// ============================================================================
// صندوق پیام و اعلان‌های هنرمند/مشتری
// یک برگه واحد شامل دو بخش: «گفتگوها» (چت رزرو) و «اعلان‌ها و تیکت‌ها»
// ============================================================================

import { useState, useCallback, useEffect } from "react";
import { ChatLayout } from "@/components/features/chat/ChatLayout";
import { NotificationsList } from "@/components/features/notifications/NotificationsList";
import { toPersianNumbers } from "@/lib/utils";

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

type InboxViewProps = {
  currentUserId: string;
  role: "artist" | "client";
  initialNotifications: Notification[];
  initialUnreadCount: number;
  initialTab?: "chat" | "notifications";
};

function ChatIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function BellIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function LifeBuoyIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.464 8.464L5.343 5.343m13.314 13.314l-3.121-3.121M4 12a8 8 0 1016 0 8 8 0 10-16 0zm3.464 3.536l-3.121 3.121m13.314-13.314l-3.121 3.121M12 14a2 2 0 100-4 2 2 0 000 4z" /></svg>;
}

export function InboxView({ currentUserId, role, initialNotifications, initialUnreadCount, initialTab = "chat" }: InboxViewProps) {
  const [tab, setTab] = useState<"chat" | "notifications">(initialTab);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [conversationUnread, setConversationUnread] = useState(0);

  // شمارنده خوانده‌نشده گفتگوها برای نشان در تب
  const refreshChatUnread = useCallback(async () => {
    try {
      const { getConversations } = await import("@/services/message.service");
      const result = await getConversations();
      if (result.success && result.data) {
        const total = result.data.conversations.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0);
        setConversationUnread(total);
      }
    } catch {
      // بی‌صدا
    }
  }, []);

  useEffect(() => {
    refreshChatUnread();
    const interval = setInterval(refreshChatUnread, 10000);
    return () => clearInterval(interval);
  }, [refreshChatUnread]);

  const handleNotificationsChange = useCallback((count: number) => setUnreadCount(count), []);

  // هم‌گام‌سازی نشان قرمز منو با تغییر وضعیت خوانده‌شدن در همین صفحه
  const totalUnreadForNav = conversationUnread + unreadCount;
  useEffect(() => {
    window.dispatchEvent(new Event("nobat-market:unread-changed"));
  }, [totalUnreadForNav]);

  const totalUnread = (tab === "chat" ? conversationUnread : 0) + (tab === "notifications" ? unreadCount : 0);

  return (
    <div className="space-y-5">
      {/* هدر */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(231,68,68,0.08),transparent_50%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400 sm:h-11 sm:w-11">
                {tab === "chat" ? <ChatIcon /> : <BellIcon />}
              </span>
              <div>
                <h1 className="text-lg font-bold text-white sm:text-2xl">پیام‌ها و اعلان‌ها</h1>
                <p className="mt-0.5 text-[11px] text-zinc-400 sm:text-sm">
                  گفتگو درباره رزروها و اعلان‌های سیستم
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400 sm:mt-3 sm:px-3 sm:py-1 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {toPersianNumbers(totalUnread)} مورد خوانده‌نشده
              </span>
            )}
          </div>
        </div>
      </div>

      {/* نوار برگه‌ها */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 sm:p-1.5">
        <button
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:flex-none sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
            tab === "chat" ? "bg-rose-500/15 text-rose-400 shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <ChatIcon />
          <span className="hidden sm:inline">گفتگوها</span>
          <span className="sm:hidden">چت</span>
          {conversationUnread > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]">
              {conversationUnread > 99 ? "۹۹+" : toPersianNumbers(conversationUnread)}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:flex-none sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
            tab === "notifications" ? "bg-rose-500/15 text-rose-400 shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <BellIcon />
          <span className="hidden sm:inline">اعلان‌ها و تیکت‌ها</span>
          <span className="sm:hidden">اعلان‌ها</span>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-zinc-900 sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]">
              {unreadCount > 99 ? "۹۹+" : toPersianNumbers(unreadCount)}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("notifications")}
          className="mr-auto hidden items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 md:inline-flex"
          title="ارسال تیکت به پشتیبانی نوبت مارکت"
        >
          <LifeBuoyIcon />
          تماس با پشتیبانی
        </button>
      </div>

      {/* قوانین چت */}
      {tab === "chat" && (
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-l from-amber-500/[0.06] to-transparent p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-amber-300">قوانین چت نوبت مارکت</h3>
              <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-amber-200/70">
                <li>• ارسال لینک و اطلاعات تماس خارجی (اینستاگرام، تلگرام، واتساپ، شماره تلفن، ایمیل و...) در چت و تیکت‌ها <b className="text-amber-300">ممنوع</b> است.</li>
                <li>• تمام هماهنگی‌ها، قیمت‌ها و ارتباطات باید <b className="text-amber-300">داخل همین پلتفرم</b> انجام شود.</li>
                <li>• در صورت مشاهده تلاش برای ارتباط خارج از نوبت مارکت، <b className="text-rose-400">حساب کاربری شما مسدود می‌شود</b>.</li>
                <li>• ارسال محتوای نامناسب، توهین‌آمیز یا مزاحمت‌آمیز نیز ممنوع است.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* بدنه */}
      {tab === "chat" ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 sm:p-3">
          <ChatLayout currentUserId={currentUserId} className="min-h-[360px] sm:min-h-[440px]" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 sm:p-4">
          <NotificationsList
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
            showTicketMode
            role={role}
            onUnreadChange={handleNotificationsChange}
          />
        </div>
      )}
    </div>
  );
}
