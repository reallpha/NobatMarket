import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import AboutClient from "@/components/features/about/AboutClient";

export const metadata: Metadata = {
  title: "درباره نوبت مارکت | پلتفرم رزرو نوبت در ایران",
  description:
    "نوبت مارکت پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران. رزرو آنلاین، مقایسه کسب‌وکارها، پرداخت امن و پشتیبانی.",
  keywords: "نوبت مارکت, پلتفرم رزرو نوبت, رزرو آنلاین نوبت, کسب‌وکار, سالن زیبایی, آرایشگر",
  openGraph: {
    title: "درباره نوبت مارکت",
    description: "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران",
    url: "https://nobat-market.com/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <JsonLd graph={[websiteSchema(), organizationSchema()]} />
      <AboutClient />
    </div>
  );
}
