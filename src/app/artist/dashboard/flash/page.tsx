// ============================================================================
// صفحه مدیریت تتوهای فلش - پنل هنرمند
// ============================================================================

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FlashManager from "@/components/features/flash/FlashManager";

export const metadata: Metadata = {
  title: "مدیریت تتوهای فلش | پنل هنرمند",
};

export default async function FlashPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/artist/dashboard/flash");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          مدیریت تتوهای فلش
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          طرح‌های آماده خود را مدیریت کنید. طرح‌های فلش برای فروش مستقیم هستند.
        </p>
      </div>

      <FlashManager userId={session.user.id} />
    </div>
  );
}
