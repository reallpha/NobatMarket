"use client";

// ============================================================================
// صندوق پیام ادمین (تب واحد)
// شامل: اعلان‌ها و تیکت‌ها + پیام‌های تماس + تاریخچه چت‌های مشتری ↔ هنرمند
// ============================================================================

import { useState } from "react";
import AdminMessagesView from "../messages/page";
import AdminNotificationsView from "../notifications/page";
import { ChatHistoryPanel } from "@/components/features/admin/ChatHistoryPanel";

type TabKey = "notifications" | "contact" | "chat";

export default function AdminInboxPage() {
  const [tab, setTab] = useState<TabKey>("notifications");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "notifications",
      label: "اعلان‌ها و تیکت‌ها",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      ),
    },
    {
      key: "contact",
      label: "پیام‌های تماس",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      ),
    },
    {
      key: "chat",
      label: "تاریخچه چت",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">پیام‌ها و اعلان‌ها</h1>
        <p className="mt-1 text-sm text-zinc-500">
          مدیریت تیکت‌های پشتیبانی، ارسال اعلان به کاربران، پیام‌های تماس و نظارت بر گفتگوهای هنرمند و مشتری
        </p>
      </div>

      {/* نوار برگه‌ها */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-rose-500/15 text-rose-400 shadow-sm"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* بدنه */}
      {tab === "notifications" && <AdminNotificationsView />}
      {tab === "contact" && <AdminMessagesView />}
      {tab === "chat" && <ChatHistoryPanel />}
    </div>
  );
}