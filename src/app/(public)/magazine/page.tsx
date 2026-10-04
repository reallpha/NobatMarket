export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { db } from "@/lib/db";
import { formatJalaliDate } from "@/lib/utils";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "مجله | مقالات و نکات مراقبتی",
  description: "جدیدترین مقالات، نکات مراقبتی بعد از تتو، معرفی سبک‌ها و اخبار دنیای تتو در مجله نوبت مارکت.",
};

const CATEGORY_LABELS: Record<string, string> = {
  AFTER_CARE: "مراقبت بعد از تتو",
  STYLES: "معرفی سبک‌ها",
  NEWS: "اخبار",
  ANNOUNCEMENT: "اطلاعیه‌ها",
  GUIDES: "راهنما",
};

const CATEGORY_COLORS: Record<string, string> = {
  AFTER_CARE: "bg-green-500/10 text-green-400 border-green-500/20",
  STYLES: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  NEWS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  GUIDES: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default async function MagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;

  const where: any = { isPublished: true };
  if (category) where.category = category;

  const posts = await db.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      views: true,
      createdAt: true,
      content: true,
      isFeatured: true,
      isNotice: true,
      author: { select: { displayName: true } },
    },
  });

  // Blog listing JSON-LD
  const blogJsonLd = {
    "@type": "Blog",
    "@id": "https://nobat-market.com/magazine#blog",
    name: "مجله نوبت مارکت",
    url: "https://nobat-market.com/magazine",
    description: "مقالات تخصصی، نکات مراقبتی و اخبار دنیای تتو",
    publisher: { "@id": "https://nobat-market.com/#organization" },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://nobat-market.com/magazine/${p.slug}`,
      datePublished: p.createdAt.toISOString(),
      author: { "@type": "Person", name: p.author.displayName },
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <JsonLd graph={[websiteSchema(), organizationSchema(), blogJsonLd]} />
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,68,68,0.06)_0%,_rgba(234,179,8,0.04)_30%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4v4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-sm text-rose-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              مجله نوبت مارکت
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">مجله و مقالات نوبت مارکت</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">مقالات تخصصی، نکات مراقبتی و اخبار دنیای تتو</p>
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{posts.length}+</div>
                <div className="text-xs text-zinc-500">مقاله منتشر شده</div>
              </div>
              <div className="h-8 w-px bg-zinc-800"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">۴</div>
                <div className="text-xs text-zinc-500">دسته‌بندی</div>
              </div>
              <div className="h-8 w-px bg-zinc-800"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">۱۰۰۰+</div>
                <div className="text-xs text-zinc-500">بازدید ماهانه</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلتر دسته‌بندی */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/magazine"
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              !category
                ? "border-rose-500 bg-rose-500/10 text-rose-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            همه
          </Link>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/magazine?category=${key}`}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                category === key
                  ? "border-rose-500 bg-rose-500/10 text-rose-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* گرید مقالات */}
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" /></svg>
            <p className="mt-4 text-zinc-500">هنوز مقاله‌ای منتشر نشده است.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
              const highlightCls = post.isFeatured
                ? "border-rose-500/40 bg-gradient-to-b from-rose-500/[0.08] to-zinc-900/50 shadow-[0_0_30px_-10px_rgba(244,63,94,0.35)] hover:border-rose-500/60"
                : post.isNotice
                ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-zinc-900/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.35)] hover:border-amber-500/60"
                : "border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700";
              return (
                <Link
                  key={post.id}
                  href={`/magazine/${post.slug}`}
                  className={`group overflow-hidden rounded-2xl border backdrop-blur-sm transition-all hover:shadow-lg ${highlightCls}`}
                >
                  {/* تصویر کاور */}
                  <div className="relative h-48 overflow-hidden bg-zinc-800">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                    <span className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs ${CATEGORY_COLORS[post.category] || "border-zinc-700 text-zinc-400"}`}>
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    {post.isFeatured && (
                      <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-rose-500/40">
                        ★ مطلب ویژه
                      </span>
                    )}
                    {post.isNotice && !post.isFeatured && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black shadow-lg shadow-amber-500/40">
                        اطلاعیه
                      </span>
                    )}
                  </div>

                  {/* محتوا */}
                  <div className="p-5">
                    <h3 className="mb-2 text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mb-4 text-sm text-zinc-400 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{post.author.displayName}</span>
                      <div className="flex items-center gap-3">
                        <span>{post.views}</span>
                        <span>{readingTime} دقیقه مطالعه</span>
                        <span>{formatJalaliDate(new Date(post.createdAt), "short")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
