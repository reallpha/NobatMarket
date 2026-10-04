// ============================================================================
// لایوت صفحات عمومی - دارک مود ثابت + هدر هوشمند
// ============================================================================

import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "نوبت مارکت | پلتفرم رزرو نوبت آنلاین",
    template: "%s | نوبت مارکت",
  },
  description:
    "نوبت مارکت، بزرگترین پلتفرم اتصال هنرمندان تتو با مشتریان در سراسر ایران. پیدا کنید، رزرو کنید، خلق کنید.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white">
      {/* ─── هدر ─── */}
      <SiteHeader />

      {/* ─── محتوای اصلی ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── فوتر ─── */}
      <Footer />
    </div>
  );
}