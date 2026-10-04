import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatJalaliDate } from "@/lib/utils";
import { NewsletterAdminTable } from "@/components/features/admin/NewsletterAdminTable";

export const metadata: Metadata = {
  title: "خبرنامه | پنل مدیریت | نوبت مارکت",
};

export default async function AdminNewsletterPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [subscribers, total] = await Promise.all([
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.newsletterSubscriber.count(),
  ]);

  const serialized = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <NewsletterAdminTable subscribers={serialized} total={total} />
    </div>
  );
}
