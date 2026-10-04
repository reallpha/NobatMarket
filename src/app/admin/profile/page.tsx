import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileView from "@/components/features/profile/ProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "پروفایل | پنل مدیریت" };

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, displayName: true, phone: true, email: true, avatarUrl: true, coverUrl: true, firstName: true, lastName: true, city: true, province: true, gender: true, dateOfBirth: true, address: true, postalCode: true, bio: true, role: true },
  });

  if (!user) redirect("/login");

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
    />
  );
}
