import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CmsAdminPanel } from "@/components/features/cms/CmsAdminPanel";

export const metadata: Metadata = {
  title: "مدیریت صفحات | پنل مدیریت | نوبت مارکت",
};

export default async function AdminCmsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const pages = await db.cmsPage.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      customHtml: true,
      customCss: true,
      customJs: true,
      isActive: true,
      showHeader: true,
      showFooter: true,
      updatedAt: true,
    },
  });

  const serializedPages = pages.map((p) => ({
    ...p,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <CmsAdminPanel pages={serializedPages} />
    </div>
  );
}
