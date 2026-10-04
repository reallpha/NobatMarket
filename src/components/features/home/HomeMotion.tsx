"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type MotionVariant = "fade-up" | "fade-in" | "scale";

const HIDDEN: Record<MotionVariant, string> = {
  "fade-up": "opacity-0 translate-y-10",
  "fade-in": "opacity-0",
  scale: "opacity-0 scale-[0.98]",
};

const SHOWN = "opacity-100 translate-y-0 scale-100";

export function MotionSection({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: MotionVariant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // احترام به کاهش حرکت: بدون انیمیشن، مستقیم نمایش
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    // چک فوری: اگر المان در viewport است، بلافاصله نمایش بده
    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (isInViewport) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 100px 0px" }
    );
    observer.observe(el);

    // فول‌بک: اگر بعد از ۲ ثانیه باز هم دیده نشد، принуماً نمایش بده (جلوی باگ‌های observer)
    const fallbackTimer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${visible ? SHOWN : HIDDEN[variant]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
