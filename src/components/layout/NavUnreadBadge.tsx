"use client";

// ============================================================================
// نشان قرمز تعداد پیام/اعلان خوانده‌نشده در منوی داشبورد
// هر ۲۰ ثانیه، هنگام بازگشت تمرکز به پنجره و با رویداد «nobat-market:unread-changed»
// تعداد را از /api/inbox/unread تازه می‌کند.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { toPersianNumbers } from "@/lib/utils";

const POLL_MS = 20000;

type Props = {
  /** inline: نشان کنار متن منوی کناری — overlay: نقطه روی آیکون نوار پایین */
  variant?: "inline" | "overlay";
};

export default function NavUnreadBadge({ variant = "inline" }: Props) {
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox/unread", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTotal(Number(data?.total) || 0);
    } catch {
      // قطعی موقت شبکه — تعداد فعلی حفظ می‌شود
    }
  }, []);

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (active) void refresh();
    };

    tick();
    const id = setInterval(tick, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("nobat-market:unread-changed", tick);

    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("nobat-market:unread-changed", tick);
    };
  }, [refresh]);

  if (total <= 0) return null;

  const label = total > 99 ? "۹۹+" : toPersianNumbers(total);

  if (variant === "overlay") {
    return (
      <span
        aria-label={`${toPersianNumbers(total)} پیام خوانده‌نشده`}
        className="absolute -top-1.5 left-1/2 min-w-[16px] -translate-x-1/2 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-zinc-900"
      >
        {label}
      </span>
    );
  }

  return (
    <span
      aria-label={`${toPersianNumbers(total)} پیام خوانده‌نشده`}
      className="ms-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-[18px] text-white"
    >
      {label}
    </span>
  );
}
