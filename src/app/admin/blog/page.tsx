import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BlogAdminPanel } from "@/components/features/blog/BlogAdminPanel";

export const metadata: Metadata = {
  title: "مدیریت مجله | پنل مدیریت | نوبت مارکت",
};

export default async function AdminBlogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      category: true,
      isPublished: true,
      isFeatured: true,
      isNotice: true,
      views: true,
      createdAt: true,
    },
  });

  const serialized = posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <BlogAdminPanel posts={serialized} />
    </div>
  );
}
