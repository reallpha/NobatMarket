import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CustomRequestForm } from "@/components/features/booking/CustomRequestForm";

type Props = {
  params: Promise<{ artistSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artistSlug } = await params;
  const artist = await db.artistProfile.findUnique({
    where: { slug: artistSlug },
    include: { user: { select: { displayName: true } } },
  });

  if (!artist) return { title: "هنرمند یافت نشد" };

  return {
    title: `درخواست طراحی سفارشی از ${artist.artistName} | نوبت مارکت`,
    description: `درخواست طراحی تتوی سفارشی از ${artist.artistName} در نوبت مارکت. ایده خود را به ما بگویید تا بهترین طراحی را برایتان بسازیم.`,
  };
}

export default async function CustomRequestPage({ params }: Props) {
  const { artistSlug } = await params;
  const artist = await db.artistProfile.findUnique({
    where: { slug: artistSlug },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!artist) notFound();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Header */}
      <div className="relative border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,68,68,0.06)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            درخواست طراحی سفارشی
          </div>
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            ایده‌تان را با{" "}
            <span className="bg-gradient-to-r from-rose-400 to-rose-600 bg-clip-text text-transparent">
              {artist.artistName}
            </span>{" "}
            در میان بگذارید
          </h1>
          <p className="text-lg text-zinc-400">
            ایده، سبک و جزئیات تتوی مورد نظرتان را توضیح دهید تا هنرمند بهترین طراحی را برایتان پیشنهاد دهد.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <CustomRequestForm
          artistId={artist.userId}
          artistName={artist.artistName}
          artistSlug={artistSlug}
        />
      </div>
    </div>
  );
}
