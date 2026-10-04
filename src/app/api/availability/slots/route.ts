import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistSlug = searchParams.get("artist");
    const date = searchParams.get("date");
    const duration = parseInt(searchParams.get("duration") || "120");

    if (!artistSlug || !date) {
      return NextResponse.json({ slots: [] });
    }

    const artist = await db.artistProfile.findUnique({
      where: { slug: artistSlug },
      select: { id: true },
    });

    if (!artist) {
      return NextResponse.json({ slots: [] });
    }

    // Get the day of week
    const targetDate = new Date(date + "T00:00:00");
    const dayOfWeekIndex = targetDate.getDay();
    const dayMap: Record<number, string> = {
      0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
      4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
    };

    // Get availability for this day
    const availability = await db.availability.findFirst({
      where: {
        artistProfileId: artist.id,
        dayOfWeek: dayMap[dayOfWeekIndex] as never,
        isActive: true,
      },
    });

    if (!availability) {
      return NextResponse.json({ slots: [] });
    }

    // Get existing bookings for this date
    const existingBookings = await db.booking.findMany({
      where: {
        artistId: artist.id,
        scheduledDate: targetDate,
        status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { startTime: true, endTime: true },
    });

    // Generate time slots
    const startMinutes = timeToMinutes(availability.startTime);
    const endMinutes = timeToMinutes(availability.endTime);
    const slots = [];

    for (let m = startMinutes; m + duration <= endMinutes; m += 60) {
      const slotStart = minutesToTime(m);
      const slotEnd = minutesToTime(m + duration);

      const isBooked = existingBookings.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return m < bEnd && m + duration > bStart;
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !isBooked,
      });
    }

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ slots: [] });
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
