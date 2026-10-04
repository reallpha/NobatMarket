"use client";

import { useEffect } from "react";

/**
 * نگهبان تصاویر بیرونی (Image Source Guard)
 * ----------------------------------------------------------------------------
 * تصاویر نمونه در دامنه‌های بیرونی (pexels/unsplash) میزبانی می‌شوند که از ایران
 * بدون فیلترشکن باز نمی‌شوند و باعث معلق‌ماندن و کندی شدید صفحه می‌شوند.
 *
 * این کامپوننت هر تصویری که به آن دامنه‌ها اشاره کند را (حتی تصاویری که بعداً
 * با جاوااسکریپت اضافه می‌شوند) به مسیر پروکسی خودمان هدایت می‌کند؛ نتیجه:
 * مرورگر کاربر هیچ درخواست بیرونی‌ای نمی‌فرستد و تصاویر از کش لبه می‌آیند.
 */
const REMOTE_IMAGE_HOSTS = /^https:\/\/images\.(pexels|unsplash)\.com\//;
const PROXY_PATH = "/api/image-proxy?url=";

function toProxyPath(url: string): string {
  return `${PROXY_PATH}${encodeURIComponent(url)}`;
}

function rewriteImages(root: ParentNode): void {
  const scope = root as ParentNode & { querySelectorAll?: ParentNode["querySelectorAll"] };
  if (typeof scope.querySelectorAll !== "function") return;
  scope.querySelectorAll('img[src^="https://"]').forEach((node) => {
    const src = node.getAttribute("src") || "";
    if (REMOTE_IMAGE_HOSTS.test(src)) {
      node.setAttribute("src", toProxyPath(src));
    }
  });
}

export default function ImageSourceGuard() {
  useEffect(() => {
    rewriteImages(document);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof HTMLImageElement) {
          const src = record.target.getAttribute("src") || "";
          if (REMOTE_IMAGE_HOSTS.test(src)) {
            record.target.setAttribute("src", toProxyPath(src));
          }
          continue;
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.getAttribute("src") || "";
            if (REMOTE_IMAGE_HOSTS.test(src)) node.setAttribute("src", toProxyPath(src));
            return;
          }
          if (node instanceof Element) rewriteImages(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
