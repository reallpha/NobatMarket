import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const artist = await db.artistProfile.findFirst({
      where: {
        slug: params.slug,
        // هنرمندان تأیید نشده نباید از API عمومی در دسترس باشند
        user: { role: "ARTIST", status: "ACTIVE" },
      },
      select: {
        id: true,
        artistName: true,
        slug: true,
        shortBio: true,
        fullBio: true,
        city: true,
        isVerified: true,
        isAcceptingBookings: true,
        specializations: true,
        user: {
          select: { displayName: true, avatarUrl: true },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const services = await db.service.findMany({
      where: { artistProfileId: artist.id },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        durationMinutes: true,
      },
      orderBy: { basePrice: "asc" },
    });

    return NextResponse.json({
      artist: { ...artist, bio: artist.shortBio || artist.fullBio || null },
      services: services.map((s) => ({
        ...s,
        basePrice: s.basePrice.toString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
