import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        city: true,
        role: true,
        createdAt: true,
        lastSeenAt: true,
        artistProfile: {
          select: {
            slug: true,
            artistName: true,
            isVerified: true,
            totalEarnings: true,
            completedBookings: true,
            followerCount: true,
            satisfactionScore: true,
            userId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let completedCount = 0;
    if (user.role === "CLIENT") {
      completedCount = await db.booking.count({
        where: { clientId: user.id, status: "COMPLETED" },
      });
    }

    // Get unread notifications count for artist
    let unreadNotifications = 0;
    if (user.role === "ARTIST" && user.artistProfile) {
      unreadNotifications = await db.notification.count({
        where: { userId: user.id, isRead: false },
      });
    }

    return NextResponse.json({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      city: user.city,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
      artistProfile: user.artistProfile
        ? {
            slug: user.artistProfile.slug,
            artistName: user.artistProfile.artistName,
            isVerified: user.artistProfile.isVerified,
            totalEarnings: user.artistProfile.totalEarnings?.toString() || "0",
            completedBookings: user.artistProfile.completedBookings,
            followerCount: user.artistProfile.followerCount,
            satisfactionScore: user.artistProfile.satisfactionScore,
            userId: user.artistProfile.userId,
          }
        : null,
      completedCount,
      unreadNotifications,
    });
  } catch (err) {
    console.error("Public profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
