import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ProfileView from "@/components/features/profile/ProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "پروفایل | پنل مشتری" };

export default async function ClientProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      displayName: true,
      phone: true,
      email: true,
      avatarUrl: true,
      coverUrl: true,
      firstName: true,
      lastName: true,
      city: true,
      province: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      postalCode: true,
      bio: true,
      role: true,
    },
  });

  if (!user) redirect("/login");

  const completedBookings = await db.booking.findMany({
    where: { clientId: session.user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      scheduledDate: true,
      completedAt: true,
      style: true,
      artist: { select: { displayName: true } },
      studio: { select: { name: true } },
    },
  });

  const bookings = completedBookings.map(b => ({
    id: b.id,
    title: b.title,
    status: b.status,
    scheduledDate: b.scheduledDate.toISOString(),
    artistName: b.artist.displayName,
    studioName: b.studio?.name || null,
    style: b.style,
    images: [] as string[],
    completedAt: b.completedAt?.toISOString() || null,
  }));

  return (
    <ProfileView
      user={{
        id: user.id,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        province: user.province,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        address: user.address,
        postalCode: user.postalCode,
        bio: user.bio,
        role: user.role,
      }}
      bookings={bookings}
    />
  );
}