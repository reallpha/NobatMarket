// ============================================================================
// لایوت صفحات ورود / ثبت‌نام — نوبت مارکت
// افکت پس‌زمینه حرفه‌ای با مشبک متحرک + هاله‌های شناور
// ============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-[#08080c] text-white">
      {/* هاله‌های نور گرم — بدون مشبک برای جلوگیری از پیکسلی شدن */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/[0.05] blur-[140px]" />
        <div className="absolute -bottom-32 -left-20 h-[350px] w-[450px] rounded-full bg-rose-500/[0.04] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[350px] rounded-full bg-amber-600/[0.03] blur-[100px]" />
      </div>

      {children}
    </div>
  );
}
