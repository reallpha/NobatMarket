// ============================================================================
// صفحه مدیریت سرویس‌ها و قیمت‌گذاری - پنل هنرمند
// ============================================================================

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ServiceManager from "@/components/features/services/ServiceManager";

export const metadata: Metadata = {
  title: "قیمت‌گذاری | پنل هنرمند",
};

export default async function ServicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/artist/dashboard/services");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">قیمت‌گذاری و سرویس‌ها</h1>
        <p className="mt-1 text-sm text-zinc-400">
          سرویس‌های خود را تعریف کنید، قیمت و مدت زمان هر کدام را مشخص کنید. حداکثر ۳ سرویس.
        </p>
      </div>
      <ServiceManager />
    </div>
  );
}
