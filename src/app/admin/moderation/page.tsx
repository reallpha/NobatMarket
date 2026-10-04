import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSampleImage } from "@/lib/utils";
import { ModerationPanel } from "@/components/features/admin/ModerationPanel";

export const metadata: Metadata = {
  title: "بازبینی آثار | پنل مدیریت | نوبت مارکت",
};
export default async function AdminModerationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [allPortfolio, allFlash] = await Promise.all([
    db.portfolioItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        style: true,
        price: true,
        status: true,
        createdAt: true,
        artistProfile: {
          select: {
            artistName: true,
            slug: true,
            user: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
    db.flashTattoo.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        style: true,
        price: true,
        status: true,
        createdAt: true,
        artistProfile: {
          select: {
            artistName: true,
            slug: true,
            user: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
  ]);

  const serialized = {
    portfolio: allPortfolio.map((p) => ({
      id: p.id,
      type: "portfolio" as const,
      title: p.title,
      description: p.description,
      // Apply the same sample-image resolution as the inspiration page so
      // the admin sees the exact same image the public sees.
      image: resolveSampleImage(p.artistProfile.slug, p.style, p.title) || p.images[0] || null,
      style: p.style,
      price: p.price ? p.price.toString() : null,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      artistName: p.artistProfile.artistName,
      artistSlug: p.artistProfile.slug,
      artistAvatar: p.artistProfile.user.avatarUrl,
    })),
    flash: allFlash.map((f) => ({
      id: f.id,
      type: "flash" as const,
      title: f.title,
      description: f.description,
      image: f.imageUrl,
      style: f.style,
      price: f.price.toString(),
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      artistName: f.artistProfile.artistName,
      artistSlug: f.artistProfile.slug,
      artistAvatar: f.artistProfile.user.avatarUrl,
    })),
  };

  const items = [...serialized.portfolio, ...serialized.flash];
  const total = items.length;

  return (
    <div className="space-y-6">
      <ModerationPanel initialItems={items} total={total} />
    </div>
  );
}