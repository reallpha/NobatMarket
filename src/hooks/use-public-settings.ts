"use client";

import { useEffect, useState } from "react";

let cached: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

async function loadPublicSettings(): Promise<Record<string, string>> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => {
        cached = (d?.settings || {}) as Record<string, string>;
        return cached;
      })
      .catch(() => ({} as Record<string, string>))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** خواندن تنظیمات عمومی سایت (با کش حافظه‌ای مشترک) */
export function usePublicSettings(): Record<string, string> {
  const [settings, setSettings] = useState<Record<string, string>>(cached || {});
  useEffect(() => {
    let active = true;
    loadPublicSettings().then((s) => {
      if (active && s && Object.keys(s).length > 0) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);
  return settings;
}
