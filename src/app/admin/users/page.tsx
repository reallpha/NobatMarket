import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminUsersTable } from "@/components/features/admin/AdminUsersTable";

export const metadata: Metadata = {
  title: "مدیریت کاربران | پنل مدیریت | نوبت مارکت",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      displayName: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      city: true,
      province: true,
      bio: true,
      avatarUrl: true,
      firstName: true,
      lastName: true,
      totalBookings: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      artistProfile: {
        select: {
          id: true,
          artistName: true,
          plan: true,
          totalEarnings: true,
          isVerified: true,
          city: true,
          shortBio: true,
          instagramUrl: true,
          telegramUrl: true,
          websiteUrl: true,
        },
      },
    },
  });

  const serializedUsers = users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    phone: u.phone,
    email: u.email,
    role: u.role,
    status: u.status,
    city: u.city,
    province: u.province,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    firstName: u.firstName,
    lastName: u.lastName,
    totalBookings: u.totalBookings,
    averageRating: u.averageRating,
    reviewCount: u.reviewCount,
    createdAt: u.createdAt.toISOString(),
    artistProfile: u.artistProfile ? {
      id: u.artistProfile.id,
      artistName: u.artistProfile.artistName,
      plan: u.artistProfile.plan,
      totalEarnings: u.artistProfile.totalEarnings.toString(),
      isVerified: u.artistProfile.isVerified,
      city: u.artistProfile.city,
      shortBio: u.artistProfile.shortBio,
      instagramUrl: u.artistProfile.instagramUrl,
      telegramUrl: u.artistProfile.telegramUrl,
      websiteUrl: u.artistProfile.websiteUrl,
    } : null,
  }));

  return (
    <div className="space-y-6">
      <AdminUsersTable users={serializedUsers} />
    </div>
  );
}
