import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArtistPaymentsPanel from "@/components/features/finance/ArtistPaymentsPanel";

export const metadata: Metadata = {
  title: "پرداخت‌ها | پنل هنرمند",
};

export default async function ArtistPaymentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ARTIST") {
    redirect("/login?callbackUrl=/artist/dashboard/payments");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">پرداخت‌ها</h1>
        <p className="mt-1 text-sm text-zinc-400">
          دریافتی‌ها، باقی‌مانده‌ها، یادآوری پرداخت و برداشت وجه.
        </p>
      </div>
      <ArtistPaymentsPanel />
    </div>
  );
}
