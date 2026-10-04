// ============================================================================
// صفحه مدیریت در دسترسی - پنل هنرمند
// ============================================================================

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AvailabilityManager from "@/components/features/availability/AvailabilityManager";

export const metadata: Metadata = {
  title: "مدیریت نوبت‌دهی | پنل هنرمند",
};

export default async function AvailabilityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/artist/dashboard/availability");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          مدیریت نوبت‌دهی
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          ساعت کاری هفتگی و روزهای مرخصی خود را تنظیم کنید.
        </p>
      </div>

      <AvailabilityManager />
    </div>
  );
}
