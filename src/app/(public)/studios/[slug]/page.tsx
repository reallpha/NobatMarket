export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { studioSchema, organizationSchema, websiteSchema } from "@/lib/schema";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const studio = await db.studio.findUnique({
    where: { slug, isActive: true },
    select: { name: true, description: true, city: true, coverImage: true },
  });
  if (!studio) return { title: "استودیو یافت نشد" };
  return {
    title: `${studio.name} | استودیو تتو ${studio.city}`,
    description: studio.description || `استودیو تتو ${studio.name} در ${studio.city}`,
    openGraph: {
      title: studio.name,
      description: studio.description || "",
      images: studio.coverImage ? [{ url: studio.coverImage }] : undefined,
    },
  };
}

const styleLabels: Record<string, string> = {
  REALISM: "رئالیسم", FINE_LINE: "فاین\u200cلاین", MINIMAL: "مینیمال",
  DOTWORK: "داتورک", BLACKWORK: "بلک\u200cورک", WATERCOLOR: "واتروکالر",
  GEOMETRIC: "ژئومتریک", NEO_TRADITIONAL: "نئوتید", OLD_SCHOOL: "اولد اسکول",
  JAPANESE: "ژاپنی", TRIBAL: "ترایبال", LINE_ART: "لاین آرت",
};

export default async function StudioDetailPage({ params }: Props) {
  const { slug } = await params;

  const studio = await db.studio.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      fullDescription: true,
      address: true,
      city: true,
      province: true,
      phone: true,
      email: true,
      coverImage: true,
      images: true,
      isVerified: true,
      workingHours: true,
      averageRating: true,
      reviewCount: true,
      studioArtists: {
        where: { isActive: true },
        select: {
          artistProfile: {
            select: {
              id: true,
              artistName: true,
              slug: true,
              specializations: true,
              completedBookings: true,
              user: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  averageRating: true,
                  city: true,
                },
              },
            },
          },
          studioSharePercent: true,
        },
      },
    },
  });

  if (!studio) notFound();

  interface Member {
    id: string; artistName: string; slug: string | null;
    specializations: string[]; completedBookings: number;
    share: number; avatar: string | null; rating: number; city: string | null;
  }
  const members: Member[] = studio.studioArtists
    .map((a) => ({
      ...a.artistProfile,
      share: a.studioSharePercent,
      avatar: a.artistProfile.user.avatarUrl,
      rating: a.artistProfile.user.averageRating,
      city: a.artistProfile.user.city,
    }))
    .filter(Boolean) as Member[];

  // Parse working hours
  let workingHours: Record<string, string> = {};
  if (studio.workingHours) {
    try {
      workingHours = typeof studio.workingHours === "string"
        ? JSON.parse(studio.workingHours)
        : studio.workingHours as unknown as Record<string, string>;
    } catch { /* ignore */ }
  }

  // Build structured data
  const studioUrl = `https://nobat-market.com/studios/${studio.slug}`;
  const studioSchemaData = studioSchema({
    name: studio.name,
    slug: studio.slug,
    city: studio.city || null,
    address: studio.address || null,
    description: studio.description || null,
    coverImage: studio.coverImage || null,
    phone: studio.phone || null,
    email: studio.email || null,
    rating: studio.averageRating || undefined,
    reviewCount: studio.reviewCount || undefined,
    artistCount: members.length || undefined,
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <JsonLd graph={[websiteSchema(), organizationSchema(), studioSchemaData]} />
      {/* Cover Image */}
      <section className="relative overflow-hidden">
        {studio.coverImage ? (
          <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
            <img src={studio.coverImage} alt={studio.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/20" />
          </div>
        ) : (
          <div className="relative h-[30vh] min-h-[250px] bg-gradient-to-br from-amber-900/20 via-zinc-900 to-zinc-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.1)_0%,_transparent_60%)]" />
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              {/* Studio Icon */}
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl shadow-lg shadow-amber-500/15">
                <svg className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-lalezar text-3xl sm:text-4xl lg:text-5xl text-white">{studio.name}</h1>
                  {studio.isVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      تأییدشده
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    {studio.city}{studio.province ? `, ${studio.province}` : ""}
                  </span>
                  <span>·</span>
                  <span>{members.length} هنرمند</span>
                  {studio.averageRating > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-400">★ {studio.averageRating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-14">
          {/* Main Content */}
          <div className="space-y-10">
            {/* About */}
            {(studio.description || studio.fullDescription) && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">درباره استودیو</h2>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
                  {studio.description && (
                    <p className="text-zinc-300 leading-relaxed mb-4">{studio.description}</p>
                  )}
                  {studio.fullDescription && (
                    <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{studio.fullDescription}</div>
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">هنرمندان استودیو</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map((m) => (
                    <Link
                      key={m.id}
                      href={`/artists/${m.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.artistName} className="h-14 w-14 shrink-0 rounded-full border-2 border-white/[0.1] object-cover group-hover:border-amber-500/40 transition-colors" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg font-bold text-zinc-400">{m.artistName[0]}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">{m.artistName}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {m.specializations.slice(0, 3).map((s: string) => (
                            <span key={s} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-400">{styleLabels[s] || s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                          {m.rating > 0 && <span className="text-amber-400">★ {m.rating.toFixed(1)}</span>}
                          <span>{m.completedBookings} رزرو</span>
                          {m.share > 0 && <span className="text-emerald-400">{m.share}% سهم</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {studio.images.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">گالری</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {studio.images.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                      <img src={img} alt={`${studio.name} - ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Contact Info */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
              <h3 className="mb-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">اطلاعات تماس</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-zinc-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span className="text-zinc-300">{studio.address}</span>
                </div>
                {studio.phone && (
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    <a href={`tel:${studio.phone}`} className="text-amber-400 hover:text-amber-300 transition-colors" dir="ltr">{studio.phone}</a>
                  </div>
                )}
                {studio.email && (
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    <a href={`mailto:${studio.email}`} className="text-amber-400 hover:text-amber-300 transition-colors">{studio.email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            {Object.keys(workingHours).length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
                <h3 className="mb-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">ساعات کاری</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-zinc-400">{day}</span>
                      <span className="font-medium text-white">{hours as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
              <h3 className="mb-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">آمار استودیو</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">هنرمندان فعال</span>
                  <span className="font-bold text-white">{members.length}</span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">امتیاز</span>
                  <span className="font-bold text-amber-400">★ {studio.averageRating.toFixed(1)}</span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">نظرات</span>
                  <span className="font-bold text-white">{studio.reviewCount}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
