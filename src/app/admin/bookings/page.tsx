import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminBookingsTable } from "@/components/features/booking/AdminBookingsTable";
import { expireUnpaidBookingRequests } from "@/lib/booking-rules";

export const metadata: Metadata = {
  title: "مدیریت رزروها | پنل مدیریت | نوبت مارکت",
};

export default async function AdminBookingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  // لغو خودکار درخواست‌هایی که بیعانه‌شان در مهلت مقرر پرداخت نشده است
  await expireUnpaidBookingRequests();

  const bookings = await db.booking.findMany({
    include: {
      payments: {
        where: { purpose: "DEPOSIT" },
        select: { status: true },
      },
      // (فیلدهای رزرو به‌صورت کامل برای نمایش جزئیات حرفه‌ای)
      client: {
        select: {
          id: true,
          displayName: true,
          phone: true,
          avatarUrl: true,
        },
      },
      artist: {
        select: {
          id: true,
          displayName: true,
          phone: true,
        },
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
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    title: b.title,
    description: b.description,
    bodyPlacement: b.bodyPlacement,
    size: b.size,
    colorType: b.colorType,
    designImageUrl: b.designImageUrl,
    scheduledDate: b.scheduledDate.toISOString(),
    startTime: b.startTime,
    endTime: b.endTime,
    agreedPrice: b.agreedPrice?.toString() ?? null,
    cancellationReason: b.cancellationReason,
    adminNotes: b.adminNotes,
    createdAt: b.createdAt.toISOString(),
    client: {
      id: b.client.id,
      displayName: b.client.displayName,
      phone: b.client.phone,
    },
    artist: {
      id: b.artist.id,
      displayName: b.artist.displayName,
      phone: b.artist.phone,
    },
    service: b.service ? {
      name: b.service.name,
      basePrice: Number(b.service.basePrice),
    } : null,
    depositPaid: b.payments.some((p) => p.status === "PAID"),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت رزروها</h1>
        <p className="mt-1 text-sm text-zinc-500">
          تمام رزروهای پلتفرم را مشاهده و مدیریت کنید.
        </p>
      </div>
      <AdminBookingsTable bookings={serializedBookings} />
    </div>
  );
}
