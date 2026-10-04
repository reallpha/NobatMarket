"use client";

import { useEffect, useState } from "react";

/**
 * پیش‌بارگذار سایت (Site Preloader)
 * ----------------------------------------------------------------------------
 * این کامپوننت سمت سرور رندر می‌شود؛ یعنی همان لحظه‌ای که اولین بایت HTML به
 * مرورگر می‌رسد، لایهٔ پیش‌بارگذار رسم می‌شود (بدون انتظار برای جاوااسکریپت).
 *
 * دو مسیر برای محو شدن دارد تا هیچ‌وقت جلوی دیدن سایت را نگیرد:
 *   ۱. وقتی React بالا آمد، حالت را روی «done» می‌گذارد و با یک fade نرم کنار می‌رود.
 *   ۲. اگر به هر دلیلی جاوااسکریپت اجرا نشد، انیمیشن CSS پس از ۴ ثانیه خودش مخفی می‌کند.
 */
export default function SitePreloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // محو شدن باید «به‌محض آماده شدن» اتفاق بیفتد، نه بعد از یک تأخیر ثابت.
    // اگر صفحه سریع بالا آمده باشد، کاربر فقط یک لحظهٔ کوتاه پیش‌بارگذار را
    // می‌بیند و بلافاصله محتوا را می‌بیند.
    const hide = () => setDone(true);
    // وقتی محتوا کامل بارگذاری شد (تصاویر و فونت‌ها) بلافاصله کنار می‌رود
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });

    // سقف انتظار: پیش‌بارگذار هیچ‌وقت بیشتر از ۱٫۲ ثانیه روی صفحه نمی‌ماند
    const timer = window.setTimeout(hide, 1200);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", hide);
    };
  }, []);

  return (
    <div
      id="nm-preloader"
      className="nm-preloader"
      data-state={done ? "done" : "loading"}
      aria-hidden="true"
    >
      <div className="nm-preloader__brand">
        <span className="nm-preloader__mark">ن</span>
        <span className="nm-preloader__name">نوبت مارکت</span>
      </div>
      <div className="nm-preloader__bar">
        <span />
      </div>
      <p className="nm-preloader__text">در حال آماده‌سازی پیش‌نمایش…</p>
    </div>
  );
}
