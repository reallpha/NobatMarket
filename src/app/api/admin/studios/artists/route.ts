import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Add artist to studio
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { studioId, artistProfileId, studioSharePercent } = body;

  if (!studioId || !artistProfileId) {
    return NextResponse.json({ error: "studioId and artistProfileId are required" }, { status: 400 });
  }

  // Check if already assigned
  const existing = await db.studioArtist.findFirst({
    where: { studioId, artistProfileId, isActive: true },
  });

  if (existing) {
    return NextResponse.json({ error: "هنرمند قبلاً به این استودیو اضافه شده" }, { status: 400 });
  }

  // Deactivate any previous studio assignment for this artist
  await db.studioArtist.updateMany({
    where: { artistProfileId, isActive: true },
    data: { isActive: false },
  });

  const studioArtist = await db.studioArtist.create({
    data: {
      studioId,
      artistProfileId,
      studioSharePercent: studioSharePercent || 30.0,
      isActive: true,
      startDate: new Date(),
    },
  });

  // Update studio artist count
  const count = await db.studioArtist.count({ where: { studioId, isActive: true } });
  await db.studio.update({ where: { id: studioId }, data: { artistCount: count } });

  return NextResponse.json({ success: true, studioArtist });
}

// DELETE - Remove artist from studio
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studioId = searchParams.get("studioId");
  const artistProfileId = searchParams.get("artistProfileId");

  if (!studioId || !artistProfileId) {
    return NextResponse.json({ error: "studioId and artistProfileId are required" }, { status: 400 });
  }

  await db.studioArtist.updateMany({
    where: { studioId, artistProfileId },
    data: { isActive: false },
  });

  // Update studio artist count
  const count = await db.studioArtist.count({ where: { studioId, isActive: true } });
  await db.studio.update({ where: { id: studioId }, data: { artistCount: count } });

  return NextResponse.json({ success: true });
}
