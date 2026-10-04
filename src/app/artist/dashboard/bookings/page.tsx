import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BookingsCalendar } from "@/components/features/booking/BookingsCalendar";
import { RequestsManager } from "@/components/features/booking/RequestsManager";

export const metadata: Metadata = {
  title: "رزروها و درخواست‌ها | پنل هنرمند | نوبت مارکت",
};

export default async function ArtistBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // CustomRequest.artistId به ArtistProfile.id اشاره می‌کند (نه User.id)
  const artistProfile = await db.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // رزروها فقط پس از تأیید ادمین (PENDING_ARTIST و بعدتر) برای هنرمند نمایش داده می‌شوند
  const [bookings, requests] = await Promise.all([
    db.booking.findMany({
      where: {
        artistId: session.user.id,
        status: { notIn: ["REQUESTED"] },
      },
      include: {
        client: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            durationMinutes: true,
            maxPrice: true,
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
    }),
    artistProfile
      ? db.customRequest.findMany({
          where: { artistId: artistProfile.id },
          include: {
            client: {
              select: {
                id: true,
                displayName: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    title: b.title,
    description: b.description,
    scheduledDate: b.scheduledDate.toISOString(),
    startTime: b.startTime,
    endTime: b.endTime,
    agreedPrice: b.agreedPrice?.toString() ?? null,
    estimatedDuration: b.estimatedDuration,
    bodyPlacement: b.bodyPlacement,
    location: b.location,
    cancellationReason: b.cancellationReason,
    artistNotes: b.artistNotes,
    completedAt: b.completedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    client: b.client,
    service: b.service
      ? {
          id: b.service.id,
          name: b.service.name,
          basePrice: Number(b.service.basePrice),
          durationMinutes: b.service.durationMinutes,
        }
      : null,
  }));

  const serializedRequests = requests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    preferredStartDate: r.preferredStartDate?.toISOString() ?? null,
    quoteExpiry: r.quoteExpiry?.toISOString() ?? null,
    budget: r.budget?.toString() ?? null,
    quotedPrice: r.quotedPrice?.toString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">رزروها و درخواست‌ها</h1>
        <p className="mt-1 text-sm text-zinc-500">
          همه رزروها، وضعیت آن‌ها و درخواست‌های سفارشی مشتریان را از همین‌جا مدیریت کنید.
        </p>
      </div>

      <BookingsCalendar bookings={serializedBookings} />

      {artistProfile && (
        <section className="space-y-4 border-t border-zinc-800 pt-8">
          <div>
            <h2 className="text-lg font-bold text-white">درخواست‌های سفارشی</h2>
            <p className="mt-1 text-sm text-zinc-500">
              درخواست‌های طراحی سفارشی و پیش‌فاکتورهای مشتریان.
            </p>
          </div>
          <RequestsManager requests={serializedRequests as unknown[]} />
        </section>
      )}
    </div>
  );
}
