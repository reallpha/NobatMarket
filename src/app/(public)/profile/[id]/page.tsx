import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import PublicProfileView from "@/components/features/profile/PublicProfileView";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: { id: params.id },
    select: { displayName: true, bio: true },
  });
  if (!user) return { title: "پروفایل یافت نشد" };
  return {
    title: `${user.displayName} | پروفایل`,
    description: user.bio || `پروفایل ${user.displayName} در نوبت مارکت`,
  };
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
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
      artistProfile: { select: { slug: true } },
    },
  });

  if (!user) notFound();

  const session = await auth();
  const isOwn = session?.user?.id === user.id;

  let completedCount = 0;
  if (user.role === "CLIENT") {
    completedCount = await db.booking.count({
      where: { clientId: user.id, status: "COMPLETED" },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PublicProfileView
        user={{
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          coverUrl: user.coverUrl,
          bio: user.bio,
          city: user.city,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        }}
        isOwn={isOwn}
        artistSlug={user.artistProfile?.slug || null}
        completedCount={completedCount}
      />
    </div>
  );
}
