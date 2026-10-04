import { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "استودیوهای تتو",
  description: "لیست استودیوهای تتو در سراسر ایران. استودیوی مورد نظر خود را پیدا کنید.",
};

async function getStudios() {
  try {
    const studios = await db.studio.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        artistCount: true,
        coverImage: true,
      },
      orderBy: { name: "asc" },
    });
    return studios;
  } catch {
    return [];
  }
}

export default async function StudiosPage() {
  const studios = await getStudios();

  // Studios ItemList JSON-LD
  const studiosListJsonLd = {
    "@type": "ItemList",
    "@id": "https://nobat-market.com/studios#itemlist",
    name: "استودیوهای تتو نوبت مارکت",
    url: "https://nobat-market.com/studios",
    numberOfItems: studios.length,
    itemListElement: studios.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://nobat-market.com/studios/${s.slug}`,
      name: s.name,
      ...(s.coverImage ? { image: s.coverImage } : {}),
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <JsonLd graph={[websiteSchema(), organizationSchema(), studiosListJsonLd]} />
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,68,68,0.06)_0%,_rgba(234,179,8,0.04)_30%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              استودیوهای معتبر
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              استودیوهای{" "}
              <span className="bg-gradient-to-l from-amber-500 to-rose-500 bg-clip-text text-transparent">
                تتو
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              استودیوی حرفه‌ای مورد نظرتان را در سراسر ایران پیدا کنید.
            </p>
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{studios.length}+</div>
                <div className="text-xs text-zinc-500">استودیو فعال</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">۳۰+</div>
                <div className="text-xs text-zinc-500">شهر</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">۵۰۰+</div>
                <div className="text-xs text-zinc-500">هنرمند</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {studios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/50 py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/50">
              <svg className="h-10 w-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">هنوز استودیویی ثبت نشده</h3>
            <p className="mt-3 max-w-sm text-sm text-zinc-500">استودیوهای تتو به زودی اینجا نمایش داده خواهند شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((studio, i) => (
              <Link
                href={`/studios/${studio.slug}`}
                key={studio.id}
                className="group relative block overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_40px_-10px_rgba(234,179,8,0.15)]"
              >
                {/* Top accent */}
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                {/* Cover area with gradient */}
                <div className="relative h-32 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 overflow-hidden">
                  {studio.coverImage ? (
                    <img src={studio.coverImage} alt={studio.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(234,179,8,0.08)_0%,_transparent_60%)]" />
                  )}
                  <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-md">
                    <svg className="h-7 w-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{studio.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {studio.city}
                  </div>
                  {studio.address && (
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{studio.address}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 border-t border-zinc-800/50 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <svg className="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      {studio.artistCount} هنرمند
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      فعال
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
