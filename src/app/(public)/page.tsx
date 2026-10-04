import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: { absolute: "نوبت مارکت | رزرو نوبت آنلاین در ایران" },
  description:
    "نوبت مارکت؛ پلتفرم رزرو نوبت آنلاین برای کسب‌وکارهای مختلف در ایران. هنرمند، سالن زیبایی، آرایشگر و خدمات را در شهر خود پیدا کنید، آنلاین وقت رزرو کنید.",
  keywords: [
    "رزرو نوبت", "رزرو آنلاین نوبت", "نوبت آنلاین", "کسب‌وکار", "سالن زیبایی", "آرایشگر",
    "قیمت خدمات", "انواع خدمات", "سبک‌های خدمات", "نوبت در تهران", "نوبت مارکت",
    "نمونه‌کار", "پیشنهادهای ویژه", "booking iran", "appointment iran",
  ],
  alternates: {
    canonical: "/",
  },
  metadataBase: new URL("https://nobat-market.com"),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "نوبت مارکت",
    title: "نوبت مارکت | رزرو نوبت آنلاین در ایران",
    description:
      "هنرمند، سالن زیبایی و خدمات را در شهر خود پیدا کنید؛ آنلاین رزرو کنید و تجربه دلخواه خود را بسازید.",
    url: "https://nobat-market.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "نوبت مارکت | رزرو نوبت آنلاین در ایران",
    description: "پیدا کردن خدمات، رزرو آنلاین و مشاهده نمونه‌کارهای واقعی در سراسر ایران.",
  },
};

import { MotionSection } from "@/components/features/home/HomeMotion";
import ArtistSearchSection from "@/components/features/home/ArtistSearchSection";
import PopularArtistsSection from "@/components/features/home/PopularArtistsSection";

const HeroSection = dynamic(() => import("@/components/features/home/HeroSection"), { loading: () => <Skeleton minH="min-h-[90vh]" /> });
const HomeExplore = dynamic(() => import("@/components/features/home/HomeExplore"), { ssr: false, loading: () => <Skeleton /> });
const FeaturedArtists = dynamic(() => import("@/components/features/home/FeaturedArtists"), { ssr: false, loading: () => <Skeleton /> });
const TrustIndicators = dynamic(() => import("@/components/features/home/TrustIndicators"), { ssr: false, loading: () => <Skeleton /> });

function Skeleton({ minH }: { minH?: string }) {
  return (
    <section className={`${minH || "py-32"} bg-zinc-950`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 animate-pulse space-y-6 text-center">
        <div className="h-4 w-40 mx-auto rounded bg-zinc-800" />
        <div className="h-14 w-3/4 mx-auto rounded bg-zinc-800" />
        <div className="h-6 w-1/2 mx-auto rounded bg-zinc-800" />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <MotionSection variant="fade-in">
        <Suspense fallback={<Skeleton minH="min-h-[90vh]" />}>
          <HeroSection />
        </Suspense>
      </MotionSection>
      <MotionSection variant="fade-up">
        <ArtistSearchSection />
      </MotionSection>

      <MotionSection variant="fade-up">
        <PopularArtistsSection />
      </MotionSection>
      <MotionSection variant="fade-up">
        <Suspense fallback={<Skeleton />}>
          <HomeExplore />
        </Suspense>
      </MotionSection>
      <MotionSection variant="fade-up" delay={80}>
        <Suspense fallback={<Skeleton />}>
          <FeaturedArtists />
        </Suspense>
      </MotionSection>
      <MotionSection variant="fade-up" delay={120}>
        <Suspense fallback={<Skeleton />}>
          <TrustIndicators />
        </Suspense>
      </MotionSection>

    </div>
  );
}
