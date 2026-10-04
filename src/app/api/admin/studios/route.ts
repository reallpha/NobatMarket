import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

// تولید slug یکتا بر اساس نام (با پسوند عددی در صورت تکراری بودن)
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "studio";
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.studio.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${i}`;
    i++;
  }
}

// GET - List all studios
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [studios, artistProfiles] = await Promise.all([
    db.studio.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studioArtists: {
          where: { isActive: true },
          include: {
            artistProfile: {
              include: {
                user: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        bookings: {
          select: { id: true, agreedPrice: true },
        },
      },
    }),
    // همه پروفایل‌های هنرمند برای افزودن به استودیو از سمت ادمین
    db.artistProfile.findMany({
      orderBy: { artistName: "asc" },
      select: {
        id: true,
        artistName: true,
        slug: true,
        user: { select: { displayName: true, avatarUrl: true, status: true } },
      },
    }),
  ]);

  // نقشه پروفایل‌های هنرمند به استودیوی فعال فعلی‌شان
  const activeAssignments = await db.studioArtist.findMany({
    where: { isActive: true },
    select: { artistProfileId: true, studioId: true },
  });
  const studioOfArtist = new Map(activeAssignments.map((a) => [a.artistProfileId, a.studioId]));

  const serialized = studios.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    city: s.city,
    province: s.province,
    coverImage: s.coverImage,
    fullDescription: s.fullDescription,
    phone: s.phone,
    email: s.email,
    description: s.description,
    address: s.address,
    isActive: s.isActive,
    isVerified: s.isVerified,
    instagramUrl: s.instagramUrl,
    telegramUrl: s.telegramUrl,
    websiteUrl: s.websiteUrl,
    artists: s.studioArtists.map((sa) => ({
      studioArtistId: sa.id,
      artistProfileId: sa.artistProfileId,
      name: sa.artistProfile.artistName,
      avatarUrl: sa.artistProfile.user.avatarUrl,
      share: sa.studioSharePercent,
    })),
    totalBookings: s.bookings.length,
    totalRevenue: s.bookings.reduce((sum, b) => sum + Number(b.agreedPrice ?? 0), 0),
  }));

  const availableArtists = artistProfiles.map((ap) => ({
    artistProfileId: ap.id,
    artistName: ap.artistName,
    avatarUrl: ap.user.avatarUrl,
    displayName: ap.user.displayName,
    status: ap.user.status,
    studioId: studioOfArtist.get(ap.id) ?? null,
  }));

  return NextResponse.json({ studios: serialized, availableArtists });
}

// POST - Create a new studio
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    city,
    province,
    address,
    phone,
    email,
    description,
    fullDescription,
    coverImage,
    instagramUrl,
    telegramUrl,
    websiteUrl,
  } = body;

  if (!name || !city || !address || !phone) {
    return NextResponse.json({ error: "Name, city, address, and phone are required" }, { status: 400 });
  }

  // Generate unique latin slug from name (Persian names transliterated)
  const slug = await generateUniqueSlug(name);

  const studio = await db.studio.create({
    data: {
      name,
      slug,
      city,
      province: province || city,
      address,
      phone,
      email: email || null,
      description: description || null,
      fullDescription: fullDescription || null,
      coverImage: coverImage || null,
      instagramUrl: instagramUrl || null,
      telegramUrl: telegramUrl || null,
      websiteUrl: websiteUrl || null,
      images: coverImage ? [coverImage] : [],
    },
  });

  return NextResponse.json({ success: true, studio });
}

// PUT - Update a studio
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { studioId, ...updateData } = body;

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 });
  }

  // Remove undefined values
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined && value !== null) {
      cleanData[key] = value;
    }
  }

  if (Object.keys(cleanData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...cleanData };

  // اگر نام تغییر کرد، slug را نیز بازتولید کن (با حفظ یکتایی)
  if (typeof data.name === "string" && data.name.trim()) {
    data.slug = await generateUniqueSlug(data.name.trim(), studioId);
  }

  // پاکسازی فیلدهای خالی شبکه اجتماعی
  for (const key of ["instagramUrl", "telegramUrl", "websiteUrl"]) {
    if (data[key] === "") data[key] = null;
  }

  const studio = await db.studio.update({
    where: { id: studioId },
    data,
  });

  return NextResponse.json({ success: true, studio });
}

// DELETE - Delete a studio
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studioId = searchParams.get("studioId");

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 });
  }

  // Check if studio has artists
  const artistCount = await db.studioArtist.count({ where: { studioId } });
  if (artistCount > 0) {
    return NextResponse.json({ error: "Studio has artists assigned. Remove them first." }, { status: 400 });
  }

  await db.studio.delete({ where: { id: studioId } });

  return NextResponse.json({ success: true });
}
