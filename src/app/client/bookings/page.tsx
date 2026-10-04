import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { toPersianNumbers } from "@/lib/utils";
import { ClientBookingsManager } from "@/components/features/booking/ClientBookingsManager";
import { expireUnpaidBookingRequests, hasPaidDeposit, DEPOSIT_WINDOW_HOURS, depositDeadline, getDepositPercent, depositAmountWithPercent } from "@/lib/booking-rules";

export const metadata: Metadata = {
  title: "رزروهای من | نوبت مارکت",
};

export default async function ClientBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // لغو خودکار درخواست‌هایی که بیعانه‌شان در مهلت مقرر پرداخت نشده است
  await expireUnpaidBookingRequests();

  const bookings = await db.booking.findMany({
    where: { clientId: session.user.id },
    include: {
      artist: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          artistProfile: { select: { slug: true } },
        },
      },
      payments: {
        where: { purpose: "DEPOSIT" },
        select: { status: true, amount: true },
      },
      service: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  // درصد بیعانه از تنظیمات ادمین (DEPOSIT_PERCENT) — یک‌بار خوانده و در map استفاده می‌شود
  const depositPercent = await getDepositPercent();

  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    title: b.title,
    description: b.description,
    scheduledDate: b.scheduledDate.toISOString(),
    startTime: b.startTime,
    endTime: b.endTime,
    agreedPrice: b.agreedPrice?.toString() ?? null,
    bodyPlacement: b.bodyPlacement,
    cancellationReason: b.cancellationReason,
    completedAt: b.completedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    artist: {
      id: b.artist.id,
      displayName: b.artist.displayName,
      avatarUrl: b.artist.avatarUrl,
      slug: b.artist.artistProfile?.slug ?? null,
    },
    serviceId: b.serviceId,
    depositPaid: b.payments.some((p) => p.status === "PAID"),
    depositAmount: b.agreedPrice ? depositAmountWithPercent(b.agreedPrice, depositPercent).toString() : null,
    depositDeadline: depositDeadline(b.createdAt).toISOString(),
    depositWindowHours: DEPOSIT_WINDOW_HOURS,
    service: b.service ? {
      id: b.service.id,
      name: b.service.name,
      basePrice: Number(b.service.basePrice),
      durationMinutes: b.service.durationMinutes,
    } : null,
  }));

  const now = Date.now();
  const upcomingCount = serializedBookings.filter(
    (b) =>
      ["REQUESTED", "PENDING_ARTIST", "CONFIRMED", "RESCHEDULE_PENDING"].includes(b.status) &&
      new Date(b.scheduledDate).getTime() >= now
  ).length;
  const activeCount = serializedBookings.filter((b) => b.status === "IN_PROGRESS").length;
  const pastCount = serializedBookings.filter(
    (b) =>
      ["COMPLETED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_ARTIST", "NO_SHOW"].includes(b.status) ||
      (new Date(b.scheduledDate).getTime() < now && b.status !== "IN_PROGRESS")
  ).length;

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(231,68,68,0.10),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-rose-500/10" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-amber-500/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              رزروهای من
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              مدیریت رزروهای شما
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-zinc-400">
              تمام رزروهای آتی، در حال انجام و گذشته‌تان را در یک نگاه ببینید،
              زمان را مدیریت کنید یا با هنرمند خود گفتگو داشته باشید.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href="/client/inbox?tab=chat"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:border-rose-500/40 hover:text-rose-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              گفتگوها
            </a>
            <a
              href="/artists"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-500"
            >
              رزرو جدید
            </a>
          </div>
        </div>

        {/* خلاصه وضعیت */}
        <div className="relative mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{toPersianNumbers(upcomingCount)}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">آینده</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{toPersianNumbers(activeCount)}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">در حال انجام</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{toPersianNumbers(pastCount)}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">گذشته</p>
          </div>
        </div>
      </div>

      <ClientBookingsManager bookings={serializedBookings} />
    </div>
  );
}
