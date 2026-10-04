import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - List all users OR get single user detail (admin only)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  // Single user detail
  if (userId) {
    return await (async () => {
      const url = new URL(request.url);
      const uid = url.searchParams.get("userId");
      if (!uid) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      let user = await db.user.findUnique({
        where: { id: uid },
        select: {
          id: true, displayName: true, phone: true, email: true,
          role: true, status: true, city: true, province: true,
          bio: true, avatarUrl: true, firstName: true, lastName: true,
          lastSeenAt: true,
          totalBookings: true, averageRating: true, reviewCount: true, createdAt: true,
        },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // Fetch artist profile separately
      const artistProfile = await db.artistProfile.findUnique({
        where: { userId: uid },
        select: {
          id: true, artistName: true, slug: true, plan: true,
          totalEarnings: true, isVerified: true, city: true, shortBio: true,
          instagramUrl: true, telegramUrl: true, websiteUrl: true,
        },
      });

      // ─── مسدودیت موقت ۷۲ ساعته: خواندن آخرین لاگ و انقضای خودکار ───
      let suspension: { isTemp: boolean; until: string | null; reason: string | null; remainingMs: number } = {
        isTemp: false, until: null, reason: null, remainingMs: 0,
      };
      try {
        const recentSuspensions = await db.auditLog.findMany({
          where: { action: "SUSPEND_72H" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { details: true, createdAt: true },
        });
        for (const log of recentSuspensions) {
          const d = log.details as unknown as { userId?: string; until?: string; reason?: string } | null;
          if (d?.userId === uid && d?.until) {
            const untilMs = new Date(d.until).getTime();
            const remaining = untilMs - Date.now();
            if (remaining > 0) {
              suspension = { isTemp: true, until: new Date(untilMs).toISOString(), reason: d.reason || null, remainingMs: remaining };
            } else if (user.status === "SUSPENDED") {
              // انقضای خودکار: رفع مسدودیت
              await db.user.update({ where: { id: uid }, data: { status: "ACTIVE" } });
              user = { ...user, status: "ACTIVE" as typeof user.status };
            }
            break;
          }
        }
      } catch {
        /* audit log lookup is best-effort */
      }

      const [clientBookings, artistBookings, revenue, reviews] = await Promise.all([
        db.booking.findMany({ where: { clientId: uid }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, bookingNumber: true, status: true, createdAt: true, scheduledDate: true, agreedPrice: true, artist: { select: { displayName: true } }, service: { select: { name: true } } } }),
        db.booking.findMany({ where: { artistId: uid }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, bookingNumber: true, status: true, createdAt: true, scheduledDate: true, agreedPrice: true, client: { select: { displayName: true, phone: true } }, service: { select: { name: true } } } }),
        db.booking.aggregate({ where: { artistId: uid, status: "COMPLETED" }, _sum: { agreedPrice: true } }),
        db.review.findMany({ where: { recipientId: uid }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, rating: true, comment: true, isVerified: true, createdAt: true, author: { select: { displayName: true, avatarUrl: true } } } }),
      ]);

      const profileData = artistProfile
        ? { ...artistProfile, totalEarnings: artistProfile.totalEarnings.toString() }
        : null;

      const serialized = {
        id: user.id,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        city: user.city,
        province: (user as { province?: string | null }).province ?? null,
        bio: (user as { bio?: string | null }).bio ?? null,
        avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl ?? null,
        firstName: (user as { firstName?: string | null }).firstName ?? null,
        lastName: (user as { lastName?: string | null }).lastName ?? null,
        lastSeenAt: (user as { lastSeenAt?: Date | null }).lastSeenAt?.toISOString() ?? null,
        totalBookings: user.totalBookings,
        averageRating: user.averageRating,
        reviewCount: user.reviewCount,
        createdAt: user.createdAt.toISOString(),
        suspension,
        artistProfile: profileData,
        bookingsAsClient: clientBookings.map(b => ({ ...b, createdAt: b.createdAt.toISOString(), scheduledDate: b.scheduledDate?.toISOString() ?? null, agreedPrice: b.agreedPrice?.toString() ?? null })),
        bookingsAsArtist: artistBookings.map(b => ({ ...b, createdAt: b.createdAt.toISOString(), scheduledDate: b.scheduledDate?.toISOString() ?? null, agreedPrice: b.agreedPrice?.toString() ?? null })),
        totalRevenue: (Number(revenue._sum.agreedPrice) || 0).toString(),
        reviews: reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
        _count: { bookingsAsClient: clientBookings.length, bookingsAsArtist: artistBookings.length, reviewsReceived: reviews.length },
      };
      return NextResponse.json({ user: serialized });
    })();
  }

  // List all users
  const role = searchParams.get("role");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

// POST - Create a new user with any role (admin only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone, password, displayName, email, role, status, city, artistName } = body;

    // ─── Validation ───
    if (!phone || !password || !displayName || !role) {
      return NextResponse.json(
        { error: "شماره موبایل، رمز عبور، نام و نقش الزامی هستند" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/[\s\-()+]/g, "").trim();
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)" }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد" }, { status: 400 });
    }

    if (!["CLIENT", "ARTIST", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "نقش معتبر نیست" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { phone: cleanPhone }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "کاربری با این شماره موبایل وجود دارد" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const user = await db.user.create({
      data: {
        phone: cleanPhone,
        passwordHash,
        displayName: String(displayName).trim(),
        email: email ? String(email).trim() || null : null,
        role,
        status: status || "ACTIVE",
        city: city ? String(city).trim() || null : null,
        preferredLanguage: "fa",
      },
      select: { id: true, displayName: true, phone: true, role: true, status: true, city: true, createdAt: true },
    });

    // هنرمند: ساخت پروفایل پایه تا در پنل بتواند تکمیلش کند
    if (role === "ARTIST") {
      const baseSlug =
        artistName
          ? String(artistName).trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
            .replace(/^-+|-+$/g, "") || "artist"
          : `artist-${Date.now().toString(36)}`;

      let slug = baseSlug;
      let suffix = 1;
      while (await db.artistProfile.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      await db.artistProfile.create({
        data: {
          userId: user.id,
          artistName: artistName ? String(artistName).trim() : user.displayName,
          slug,
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Admin create user error:", err);
    return NextResponse.json({ error: "خطا در ایجاد کاربر" }, { status: 500 });
  }
}

// PUT - Update user role, status, profile, suspension, or verify artist
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, role, status, verifyArtist, suspend72h, unsuspend, suspendReason, profile } = body as {
    userId?: string;
    role?: string;
    status?: string;
    verifyArtist?: boolean;
    suspend72h?: boolean;
    unsuspend?: boolean;
    suspendReason?: string;
    profile?: {
      displayName?: string; phone?: string; email?: string | null;
      city?: string | null; province?: string | null; bio?: string | null;
      avatarUrl?: string | null; firstName?: string | null; lastName?: string | null;
      artist?: {
        artistName?: string; city?: string | null; shortBio?: string | null;
        instagramUrl?: string | null; telegramUrl?: string | null; websiteUrl?: string | null;
      };
    };
  };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // ─── محافظت از خود ادمین ───
  if (userId === session.user.id && (role || status || suspend72h)) {
    return NextResponse.json({ error: "نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید" }, { status: 400 });
  }

  // ─── مسدودیت موقت ۷۲ ساعته ───
  if (suspend72h) {
    const until = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const reason = typeof suspendReason === "string" ? suspendReason.trim().slice(0, 500) : "";
    await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
    try {
      await db.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "SUSPEND_72H",
          details: { userId, until: until.toISOString(), reason },
        },
      });
    } catch { /* best-effort */ }
    try {
      await db.notification.create({
        data: {
          userId,
          title: "حساب شما به‌مدت ۷۲ ساعت مسدود شد",
          message: `دسترسی شما به نوبت مارکت به‌مدت ۷۲ ساعت محدود شد.${reason ? `\n\nدلیل: ${reason}` : ""}\n\nپس از پایان مهلت، حساب به‌صورت خودکار فعال می‌شود.`,
          type: "WARNING",
        },
      });
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true, suspendedUntil: until.toISOString() });
  }

  // ─── رفع مسدودیت ───
  if (unsuspend) {
    await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    try {
      await db.auditLog.create({
        data: { adminId: session.user.id, action: "UNSUSPEND", details: { userId } },
      });
    } catch { /* best-effort */ }
    try {
      await db.notification.create({
        data: { userId, title: "حساب شما فعال شد", message: "محدودیت حساب شما توسط مدیریت برداشته شد.", type: "SUCCESS" },
      });
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true });
  }

  // ─── ویرایش کامل پروفایل کاربر ───
  if (profile) {
    const data: Record<string, unknown> = {};
    if (typeof profile.displayName === "string" && profile.displayName.trim().length >= 2) {
      data.displayName = profile.displayName.trim();
    }
    if (typeof profile.phone === "string") {
      const cleanPhone = profile.phone.replace(/[\s\-()+]/g, "").trim();
      if (!/^09\d{9}$/.test(cleanPhone)) {
        return NextResponse.json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)" }, { status: 400 });
      }
      const existing = await db.user.findUnique({ where: { phone: cleanPhone }, select: { id: true } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "کاربری با این شماره موبایل وجود دارد" }, { status: 409 });
      }
      data.phone = cleanPhone;
    }
    if (profile.email !== undefined) {
      const email = typeof profile.email === "string" ? profile.email.trim() || null : null;
      if (email) {
        const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
        if (existing && existing.id !== userId) {
          return NextResponse.json({ error: "کاربری با این ایمیل وجود دارد" }, { status: 409 });
        }
      }
      data.email = email;
    }
    if (profile.city !== undefined) data.city = typeof profile.city === "string" ? profile.city.trim() || null : null;
    if (profile.province !== undefined) data.province = typeof profile.province === "string" ? profile.province.trim() || null : null;
    if (profile.bio !== undefined) data.bio = typeof profile.bio === "string" ? profile.bio.trim() || null : null;
    if (profile.avatarUrl !== undefined) data.avatarUrl = typeof profile.avatarUrl === "string" ? profile.avatarUrl.trim() || null : null;
    if (profile.firstName !== undefined) data.firstName = typeof profile.firstName === "string" ? profile.firstName.trim() || null : null;
    if (profile.lastName !== undefined) data.lastName = typeof profile.lastName === "string" ? profile.lastName.trim() || null : null;

    if (Object.keys(data).length > 0) {
      await db.user.update({ where: { id: userId }, data });
    }

    if (profile.artist) {
      const existingArtist = await db.artistProfile.findUnique({ where: { userId }, select: { id: true } });
      if (existingArtist) {
        const a: Record<string, unknown> = {};
        if (typeof profile.artist.artistName === "string" && profile.artist.artistName.trim()) {
          a.artistName = profile.artist.artistName.trim();
        }
        if (profile.artist.city !== undefined) a.city = typeof profile.artist.city === "string" ? profile.artist.city.trim() || null : null;
        if (profile.artist.shortBio !== undefined) a.shortBio = typeof profile.artist.shortBio === "string" ? profile.artist.shortBio.trim() || null : null;
        if (profile.artist.instagramUrl !== undefined) a.instagramUrl = typeof profile.artist.instagramUrl === "string" ? profile.artist.instagramUrl.trim() || null : null;
        if (profile.artist.telegramUrl !== undefined) a.telegramUrl = typeof profile.artist.telegramUrl === "string" ? profile.artist.telegramUrl.trim() || null : null;
        if (profile.artist.websiteUrl !== undefined) a.websiteUrl = typeof profile.artist.websiteUrl === "string" ? profile.artist.websiteUrl.trim() || null : null;
        if (Object.keys(a).length > 0) {
          await db.artistProfile.update({ where: { id: existingArtist.id }, data: a });
        }
      }
    }

    try {
      await db.auditLog.create({
        data: { adminId: session.user.id, action: "UPDATE_USER_PROFILE", details: { userId } },
      });
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true });
  }

  const updateData: Record<string, string> = {};
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // Verify/unverify artist profile
  if (typeof verifyArtist === "boolean") {
    const artistProfile = await db.artistProfile.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (artistProfile) {
      await db.artistProfile.update({
        where: { id: artistProfile.id },
        data: { isVerified: verifyArtist },
      });
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      artistProfile: { select: { isVerified: true } },
    },
  });

  return NextResponse.json({ success: true, user });
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent deleting self
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Check if user has active bookings
  const activeBookings = await db.booking.count({
    where: {
      OR: [
        { clientId: userId },
        { artistId: userId },
      ],
      status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json({ error: "User has active bookings" }, { status: 400 });
  }

  // Delete user and related data
  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
