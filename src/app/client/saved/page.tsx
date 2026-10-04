// ============================================================================
// صفحه علاقه‌مندی‌ها - پنل مشتری
// ============================================================================

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { toPersianNumbers } from "@/lib/utils";
import SavedItemsGrid from "@/components/features/portfolio/SavedItemsGrid";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها | پنل مشتری",
};

export default async function SavedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/client/saved");
  }

  const savedItems = await db.savedPortfolio.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      portfolioItem: {
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          style: true,
          size: true,
          price: true,
          likeCount: true,
          saveCount: true,
          tags: true,
          artistProfile: {
            select: {
              artistName: true,
              slug: true,
              isVerified: true,
              user: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          علاقه‌مندی‌ها
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {toPersianNumbers(savedItems.length)} اثر ذخیره شده
        </p>
      </div>

      <SavedItemsGrid
        items={savedItems.map((s) => ({
          savedId: s.id,
          ...s.portfolioItem,
          savedAt: s.createdAt.toISOString(),
          artistName: s.portfolioItem.artistProfile.artistName,
          artistSlug: s.portfolioItem.artistProfile.slug,
          artistAvatar: s.portfolioItem.artistProfile.user.avatarUrl,
          isVerified: s.portfolioItem.artistProfile.isVerified,
        }))}
      />
    </div>
  );
}
