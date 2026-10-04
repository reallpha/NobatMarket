import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ArtistOnboarding } from "@/components/features/onboarding/ArtistOnboarding";

export const metadata: Metadata = {
  title: "تکمیل پروفایل | نوبت مارکت",
};

export default async function ArtistOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // بررسی وجود پروفایل هنرمند
  const profile = await db.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, shortBio: true, city: true, specializations: true },
  });

  // اگر پروفایل کامل است، به داشبورد برو
  if (profile?.shortBio && profile?.city && profile.specializations.length > 0) {
    redirect("/artist/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <ArtistOnboarding
        userId={session.user.id}
        existingProfile={profile ? {
          shortBio: profile.shortBio || "",
          city: profile.city || "",
          styles: profile.specializations,
        } : null}
      />
    </div>
  );
}
