// ============================================================================
// صفحه رزرو - ویزار مرحله‌ای
// /book/[artistSlug]
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingWizard from "@/components/features/booking/BookingWizard";

export async function generateMetadata({
  params,
}: {
  params: { artistSlug: string };
}): Promise<Metadata> {
  const artist = await db.artistProfile.findUnique({
    where: { slug: params.artistSlug },
    select: { artistName: true },
  });

  if (!artist) return { title: "رزرو" };

  return {
    title: `رزرو وقت با ${artist.artistName} | نوبت مارکت`,
    description: `رزرو وقت تتو با ${artist.artistName} در نوبت مارکت`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: { artistSlug: string };
}) {
  // دریافت اطلاعات هنرمند و سرویس‌ها
  const artist = await db.artistProfile.findUnique({
    where: { slug: params.artistSlug },
    select: {
      id: true,
      userId: true,
      artistName: true,
      slug: true,
      isAcceptingBookings: true,
      user: {
        select: { displayName: true, avatarUrl: true },
      },
      services: {
        where: { isActive: true },
        orderBy: { basePrice: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          maxPrice: true,
          durationMinutes: true,
          supportedSizes: true,
        },
      },
    },
  });

  if (!artist || !artist.isAcceptingBookings) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <BookingWizard
        artist={{
          id: artist.id,
          userId: artist.userId,
          artistName: artist.artistName,
          slug: artist.slug,
          avatarUrl: artist.user.avatarUrl,
          displayName: artist.user.displayName,
          isAcceptingBookings: artist.isAcceptingBookings,
        }}
        services={artist.services.map((s) => ({
          ...s,
          basePrice: Number(s.basePrice),
          maxPrice: s.maxPrice ? Number(s.maxPrice) : null,
        }))}
      />
    </div>
  );
}
