// ============================================================================
// صفحه مدیریت پورتفولیو - پنل هنرمند
// ============================================================================

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortfolioManager from "@/components/features/portfolio/PortfolioManager";

export const metadata: Metadata = {
  title: "مدیریت پورتفولیو | پنل هنرمند",
};

export default async function PortfolioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/artist/dashboard/portfolio");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          مدیریت پورتفولیو
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          نمونه کارهای خود را مدیریت کنید. تصاویر با کیفیت بالا بارگذاری می‌شوند.
        </p>
      </div>

      <PortfolioManager userId={session.user.id} />
    </div>
  );
}
