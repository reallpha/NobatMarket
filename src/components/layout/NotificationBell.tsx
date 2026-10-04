"use client";

// ============================================================================
// زنگ اعلان‌ها - کامپوننت قابل استفاده مجدد - دارک مود
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  getNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from "@/services/notification.service";
import { formatJalaliDate } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

// SVG icons for notification types
function NotificationTypeIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "INFO":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "SUCCESS":
      return <svg className={`${cls} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "WARNING":
      return <svg className={`${cls} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
    case "BOOKING":
      return <svg className={`${cls} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case "PAYMENT":
      return <svg className={`${cls} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "MESSAGE":
      return <svg className={`${cls} text-purple-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    default:
      return <svg className={`${cls} text-zinc-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications(1, 5);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* دکمه زنگ */}
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center bg-rose-500 px-1 text-[10px] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* هدر */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">اعلان‌ها</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  همه خوانده شد
                </button>
              )}
            </div>

            {/* لیست */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  اعلانی ندارید
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link || "#"}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      !notif.isRead ? "bg-rose-500/5" : "hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="mt-0.5"><NotificationTypeIcon type={notif.type} /></span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!notif.isRead ? "font-medium text-white" : "text-zinc-400"}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {formatJalaliDate(new Date(notif.createdAt), "datetime")}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </Link>
                ))
              )}
            </div>

            {/* فوتر */}
            <div className="border-t border-zinc-800 px-4 py-2 text-center">
              <Link
                href="/client/inbox?tab=notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                مشاهده همه اعلان‌ها
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
