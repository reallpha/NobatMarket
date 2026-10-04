import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientPaymentsPanel from "@/components/features/finance/ClientPaymentsPanel";
import { getDepositPercent } from "@/lib/booking-rules";

export const metadata: Metadata = {
  title: "پرداخت‌ها | نوبت مارکت",
};

export default async function ClientPaymentsPage({
  searchParams,
}: {
  searchParams: { booking?: string; payment?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/client/payments");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">پرداخت‌ها</h1>
        <p className="mt-1 text-sm text-zinc-400">
          بیعانه و باقی‌مانده رزروهای خود را اینجا مدیریت و پرداخت کنید.
        </p>
      </div>
      <ClientPaymentsPanel
        highlightId={searchParams.booking}
        paymentStatus={searchParams.payment}
        depositPercent={await getDepositPercent()}
      />
    </div>
  );
}
