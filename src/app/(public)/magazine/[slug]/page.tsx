export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatJalaliDate } from "@/lib/utils";
import Link from "next/link";
import ReadingProgress from "@/components/features/blog/ReadingProgress";
import BlogComments from "@/components/features/blog/BlogComments";
import ShareButtons from "@/components/features/blog/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!post) return { title: "مقاله یافت نشد" };

  return {
    title: `${post.title} | نوبت مارکت`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

// ============================================================================
// Markdown → HTML (improved)
// ============================================================================
function markdownToHtml(md: string): string {
  // 1) Extract tables first so we don't mangle them
  const tableBlocks: string[] = [];
  let html = md.replace(
    /(^\|.+\|\n)+(\|[-: |]+\|\n)(^\|.+\|\n?)+/gm,
    (block) => {
      const lines = block.trim().split('\n');
      if (lines.length < 2) return block;

      const parseRow = (row: string) =>
        row.split('|').filter((c, i, a) => !(i === 0 && c.trim() === '') && !(i === a.length - 1 && c.trim() === '')).map(c => c.trim());

      const headers = parseRow(lines[0]);
      // line index 1 is the separator
      const dataLines = lines.slice(2);

      const thead = headers.map(h => `<th class="px-4 py-3 text-right text-sm font-bold text-white bg-zinc-800/80 border-b border-zinc-700">${h}</th>`).join('');
      const tbody = dataLines.map(row => {
        const cells = parseRow(row);
        return '<tr class="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">' +
          cells.map(c => `<td class="px-4 py-3 text-sm text-zinc-300">${c}</td>`).join('') + '</tr>';
      }).join('');

      const placeholder = `__TABLE_${tableBlocks.length}__`;
      tableBlocks.push(
        `<div class="my-8 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
<table class="w-full">
<thead><tr>${thead}</tr></thead>
<tbody>${tbody}</tbody>
</table>
</div>`
      );
      return placeholder;
    }
  );

  // Helper to generate heading IDs
  const makeId = (t: string) => t.replace(/\*\*/g, '').replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').toLowerCase();

  // Headings with IDs for TOC anchor links
  html = html.replace(/^#### (.+)$/gm, (_, t) => `<h4 id="${makeId(t)}" class="scroll-mt-20 text-base font-bold text-white mt-6 mb-3">${t}</h4>`);
  html = html.replace(/^### (.+)$/gm, (_, t) => `<h3 id="${makeId(t)}" class="scroll-mt-20 text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2 before:content-[''] before:h-6 before:w-1 before:rounded-full before:bg-rose-500">${t}</h3>`);
  html = html.replace(/^## (.+)$/gm, (_, t) => `<h2 id="${makeId(t)}" class="scroll-mt-20 text-2xl font-black text-white mt-12 mb-5 pb-3 border-b border-zinc-800">${t}</h2>`);
  html = html.replace(/^# (.+)$/gm, (_, t) => `<h1 id="${makeId(t)}" class="scroll-mt-20 text-3xl font-black text-white mb-6">${t}</h1>`);

  // Inline formatting
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="text-zinc-300 italic">$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-rose-400 hover:text-rose-300 underline decoration-rose-400/30 hover:decoration-rose-400 transition-colors">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 mb-2.5 text-zinc-300 leading-relaxed"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/60"></span>$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="my-6 border-r-4 border-amber-500 bg-amber-500/5 rounded-l-xl px-5 py-4 text-amber-200 italic">$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-10 border-zinc-800/50" />');

  // Paragraphs (justified for better readability on desktop & mobile)
  html = html.replace(/\n\n/g, '</p><p class="mb-5 text-zinc-300 leading-[1.9] text-[15px] sm:text-base text-justify">');
  html = '<p class="mb-5 text-zinc-300 leading-[1.9] text-[15px] sm:text-base text-justify">' + html + '</p>';

  // 2) Restore tables
  tableBlocks.forEach((t, i) => {
    html = html.replace(`__TABLE_${i}__`, t);
  });

  return html;
}

// ============================================================================
// Extract headings for table of contents
// ============================================================================
function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "");
      const id = text
        .toLowerCase()
        .replace(/[\u0600-\u06FF]+/g, (w) => w)
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

// ============================================================================
// Main Page
// ============================================================================
export default async function MagazineArticlePage({ params }: Props) {
  const { slug } = await params;

  const post = await db.blogPost.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      category: true,
      views: true,
      createdAt: true,
      isFeatured: true,
      isNotice: true,
      author: { select: { displayName: true, avatarUrl: true } },
    },
  });

  if (!post) notFound();

  // مطالب ویژه منتخب ادمین (حداکثر ۵ مقاله از تنظیمات)
  let specialPosts: { slug: string; title: string; excerpt: string; coverImage: string | null; category: string }[] = [];
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "MAGAZINE_FEATURED_POSTS" },
      select: { value: true },
    });
    const slugs: string[] = setting?.value ? JSON.parse(setting.value) : [];
    if (Array.isArray(slugs) && slugs.length > 0) {
      specialPosts = await db.blogPost.findMany({
        where: { slug: { in: slugs.filter((s) => typeof s === "string").slice(0, 5) }, isPublished: true, id: { not: post.id } },
        select: { slug: true, title: true, excerpt: true, coverImage: true, category: true },
        take: 5,
      });
      // حفظ ترتیب انتخاب ادمین
      const order = new Map(slugs.map((s, i) => [s, i]));
      specialPosts.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
    }
  } catch {
    specialPosts = [];
  }

  const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
  const headings = extractHeadings(post.content);

  const CATEGORY_LABELS: Record<string, string> = {
    AFTER_CARE: "مراقبت بعد از تتو",
    STYLES: "معرفی سبک‌ها",
    NEWS: "اخبار",
    ANNOUNCEMENT: "اطلاعیه‌ها",
    GUIDES: "راهنما",
  };

  const CATEGORY_COLORS: Record<string, string> = {
    AFTER_CARE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    STYLES: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    NEWS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    GUIDES: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  // Fetch related articles (random 3, excluding current)
  const allPosts = await db.blogPost.findMany({
    where: { isPublished: true, id: { not: post.id } },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Shuffle and pick 3
  const relatedPosts = allPosts
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Fetch featured artists (random 4)
  const artists = await db.artistProfile.findMany({
    where: { isVerified: true },
    select: {
      slug: true,
      artistName: true,
      city: true,
      specializations: true,
      user: {
        select: {
          displayName: true,
          avatarUrl: true,
          averageRating: true,
        },
      },
      portfolioItems: {
        take: 1,
        select: { images: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { completedBookings: "desc" },
    take: 8,
  });

  // Pick 4 random artists
  const featuredArtists = artists.sort(() => Math.random() - 0.5).slice(0, 4);

  // JSON-LD structured data — improved with @graph and full entity connections
  const articleUrl = `https://nobat-market.com/magazine/${slug}`;

  const jsonLdGraph = [
    {
      "@type": "BlogPosting",
      "@id": `${articleUrl}#blogposting`,
      headline: post.title,
      description: post.excerpt,
      image: post.coverImage || undefined,
      url: articleUrl,
      datePublished: post.createdAt.toISOString(),
      author: { "@type": "Person", name: post.author.displayName },
      publisher: { "@id": "https://nobat-market.com/#organization" },
      isPartOf: {
        "@type": "Blog",
        "@id": "https://nobat-market.com/magazine#blog",
        name: "مجله نوبت مارکت",
        url: "https://nobat-market.com/magazine",
        publisher: { "@id": "https://nobat-market.com/#organization" },
      },
      inLanguage: "fa",
      ...(post.category ? { about: { "@type": "Thing", name: CATEGORY_LABELS[post.category] || post.category } } : {}),
    },
  ];

  const styleLabels: Record<string, string> = {
    REALISM: "رئالیسم", FINE_LINE: "فاین\u200cلاین", MINIMAL: "مینیمال",
    DOTWORK: "داتورک", BLACKWORK: "بلک\u200cورک", WATERCOLOR: "واتروکالر",
    GEOMETRIC: "ژئومتریک", NEO_TRADITIONAL: "نئوتید", OLD_SCHOOL: "اولد اسکول",
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* JSON-LD */}
      <JsonLd graph={jsonLdGraph} />

      {/* Hero Section — Featured Image + Title */}
      <section className="relative overflow-hidden">
        {/* Cover Image */}
        {post.coverImage ? (
          <div className="relative h-[50vh] min-h-[400px] max-h-[600px]">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/40 to-transparent" />
          </div>
        ) : (
          <div className="relative h-[30vh] min-h-[250px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-rose-950/20" />
        )}

        {/* Title Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pb-10 sm:pb-16">
            <div className="space-y-4 sm:space-y-5">
              {/* Category */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm ${CATEGORY_COLORS[post.category] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
                {post.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-500/40">
                    ★ مطلب ویژه
                  </span>
                )}
                {post.isNotice && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-black shadow-lg shadow-amber-500/40">
                    اطلاعیه
                  </span>
                )}
                <span className="text-xs text-zinc-500">{readingTime} دقیقه مطالعه</span>
              </div>

              {/* Title */}
              <h1 className="font-lalezar text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-black leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
          {/* Article Body */}
          <article>
            {/* Table of Contents */}
            {headings.length > 2 && (
              <div className="mb-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 backdrop-blur-xl">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400"><path d="M4 6h16M4 12h10M4 18h14"/></svg>
                  فهرست مطالب
                </h2>
                <nav className="space-y-1.5">
                  {headings.map((h, i) => (
                    <a
                      key={i}
                      href={`#${h.id}`}
                      className={`block rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white ${h.level === 3 ? "mr-4 text-xs" : "font-medium"}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Article Content */}
            <div
              className="prose prose-zinc max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
            />

            {/* Share + Back — همیشه تک‌ردیف حتی در گوشی */}
            <div className="mt-12 flex flex-nowrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:gap-4 sm:p-6">
              <ShareButtons slug={slug} title={post.title} compact />
              <Link
                href="/magazine"
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/5 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:h-4 sm:w-4"><polyline points="15 18 9 12 15 6"/></svg>
                بازگشت به مجله
              </Link>
            </div>

            {/* Author Card — redesigned, below share section */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-l from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
              <div className="pointer-events-none absolute -top-10 left-1/2 h-28 w-56 -translate-x-1/2 rounded-full bg-rose-500/10 blur-2xl sm:hidden" />
              <div className="relative flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-6 sm:text-right">
                <span className="rounded-full bg-gradient-to-l from-rose-500 to-amber-500 p-[2px] shadow-lg shadow-rose-500/20">
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} alt={post.author.displayName} className="block h-16 w-16 rounded-full border-2 border-zinc-950 object-cover sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-2xl" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-950 bg-gradient-to-br from-rose-500/30 to-amber-500/30 text-2xl font-black text-white sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-2xl">
                      {post.author.displayName[0]}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-500">نویسنده این مقاله</p>
                  <p className="mt-0.5 text-lg font-black leading-snug text-white">{post.author.displayName}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    تیم محتوای نوبت مارکت
                  </span>
                </div>
                <Link
                  href="/magazine"
                  className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-white sm:w-auto"
                >
                  سایر مقالات
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:scrollbar-thin lg:scrollbar-thumb-zinc-800 lg:scrollbar-track-transparent">
            {/* Featured Artists */}
            {featuredArtists.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
                <h3 className="mb-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">هنرمندان پیشنهادی</h3>
                <div className="space-y-3">
                  {featuredArtists.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/artists/${a.slug}`}
                      className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-white/[0.04]"
                    >
                      {a.user.avatarUrl ? (
                        <img src={a.user.avatarUrl} alt={a.artistName} className="h-10 w-10 shrink-0 rounded-full border border-white/[0.1] object-cover group-hover:border-rose-500/40 transition-colors" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-zinc-400">{a.artistName[0]}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white group-hover:text-rose-400 transition-colors">{a.artistName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <span>{a.city || "نامشخص"}</span>
                          {a.user.averageRating > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-amber-400">★ {a.user.averageRating.toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/artists"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2.5 text-xs font-medium text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/5"
                >
                  مشاهده همه هنرمندان
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </Link>
              </div>
            )}

            {/* Reading Info */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
              <h3 className="mb-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">اطلاعات مقاله</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">زمان مطالعه</span>
                  <span className="font-medium text-white">{readingTime} دقیقه</span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">تاریخ انتشار</span>
                  <span className="font-medium text-white">{formatJalaliDate(new Date(post.createdAt), "date")}</span>
                </div>
                <div className="h-px bg-zinc-800/50" />
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">بازدیدها</span>
                  <span className="font-medium text-white">{(post.views + 1).toLocaleString("fa-IR")}</span>
                </div>
              </div>
            </div>

            {/* Special Articles — منتخب ادمین از تنظیمات */}
            {specialPosts.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.07] to-transparent backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-amber-500/10 px-5 pb-3 pt-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <h3 className="text-xs font-black tracking-wider text-amber-300">مطالب ویژه</h3>
                </div>
                <ol className="divide-y divide-white/[0.04]">
                  {specialPosts.map((sp, i) => (
                    <li key={sp.slug}>
                      <Link href={`/magazine/${sp.slug}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-amber-500/[0.06]">
                        <span className="font-lalezar text-2xl leading-none text-amber-500/40 transition-colors group-hover:text-amber-400">
                          {(i + 1).toLocaleString("fa-IR")}
                        </span>
                        {sp.coverImage ? (
                          <img src={sp.coverImage} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                            <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z"/></svg>
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-zinc-200 transition-colors group-hover:text-amber-300">
                            {sp.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                            {CATEGORY_LABELS[sp.category] || sp.category}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ─── بخش کامنت‌ها ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mt-12">
          <BlogComments postSlug={slug} />
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-zinc-800/50 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-4 py-1.5 text-xs font-medium text-rose-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                مقالات مرتبط
              </span>
              <h2 className="mt-4 font-lalezar text-3xl sm:text-4xl text-white">خواندنی‌های مشابه</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/magazine/${rp.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                >
                  {rp.coverImage ? (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={rp.coverImage}
                        alt={rp.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-zinc-800 to-zinc-900" />
                  )}
                  <div className="p-4 sm:p-5">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400">
                        {CATEGORY_LABELS[rp.category] || rp.category}
                      </span>
                      <span className="text-[11px] text-zinc-600">
                        {formatJalaliDate(new Date(rp.createdAt), "short")}
                      </span>
                    </div>
                    <h3 className="mb-2 font-bold text-white group-hover:text-rose-400 transition-colors duration-300 line-clamp-2 leading-relaxed">
                      {rp.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                      {rp.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
