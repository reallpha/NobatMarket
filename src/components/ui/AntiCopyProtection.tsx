"use client";

import { useEffect } from "react";

/**
 * نسخهٔ پیش‌نمایش — جلوگیری از کپی ساده، انتخاب متن و دسترسی به View Source.
 * نکته: هیچ محافظت ۱۰۰٪ وجود ندارد — این فقط مانع کپی سطحی می‌شود.
 */
export default function AntiCopyProtection() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // جلوگیری از راست‌کلیک
    const onContext = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", onContext);

    // جلوگیری از کپی با Ctrl/Cmd+C
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("copy", onCopy);

    // جلوگیری از Cut
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("cut", onCut);

    // جلوگیری از Paste
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("paste", onPaste);

    // جلوگیری از Ctrl/Cmd+U (View Source)
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")
      ) {
        e.preventDefault();
        return false;
      }
      // جلوگیری از Ctrl/Cmd+S (Save)
      if (
        (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
        return false;
      }
      // جلوگیری از Ctrl/Cmd+Shift+I (DevTools)
      if (
        (e.ctrlKey || e.metaKey) && e.shiftKey &&
        (e.key === "I" || e.key === "i")
      ) {
        e.preventDefault();
        return false;
      }
      // جلوگیری از Ctrl/Cmd+Shift+J (Console)
      if (
        (e.ctrlKey || e.metaKey) && e.shiftKey &&
        (e.key === "J" || e.key === "j")
      ) {
        e.preventDefault();
        return false;
      }
      // جلوگیری از F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // CSS protection — غیرفعال‌سازی انتخاب متن با CSS
    const style = document.createElement("style");
    style.id = "demo-anti-copy";
    style.textContent = `
      /* جلوگیری از انتخاب متن */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      /* اجازه انتخاب متن در فیلدهای ورودی */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      /* جلوگیری از drag تصاویر */
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", onKeyDown);
      const s = document.getElementById("demo-anti-copy");
      if (s) s.remove();
    };
  }, []);

  return null;
}
