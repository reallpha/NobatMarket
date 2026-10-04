import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import xss from "xss";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

// جلوگیری از Static Generation در زمان build (نیاز به اتصال DB)
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

// ============================================================================
// Metadata داینامیک
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.cmsPage.findUnique({
    where: { slug, isActive: true },
    select: { title: true, seoTitle: true, seoDescription: true },
  });

  if (!page) return { title: "صفحه یافت نشد" };

  return {
    title: `${page.seoTitle || page.title} | نوبت مارکت`,
    description: page.seoDescription || undefined,
  };
}

// ============================================================================
// Simple Markdown → HTML converter (بدون وابستگی)
// ============================================================================

function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-zinc-900 mt-8 mb-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-zinc-900 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-zinc-900 mb-6">$1</h1>')
    // Bold & Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-rose-500 hover:underline">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-2 text-zinc-700">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-2 text-zinc-700">$2</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 text-zinc-700 leading-relaxed">')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-zinc-200" />');

  return `<p class="mb-4 text-zinc-700 leading-relaxed">${html}</p>`;
}

// ============================================================================
// صفحه CMS عمومی
// ============================================================================

export default async function CmsPageRenderer({ params }: Props) {
  const { slug } = await params;

  const page = await db.cmsPage.findUnique({
    where: { slug, isActive: true },
    select: {
      title: true,
      content: true,
      customHtml: true,
      customCss: true,
      customJs: true,
      showHeader: true,
      showFooter: true,
    },
  });

  if (!page) notFound();

  const hasCustomHtml = !!page.customHtml;

  // ⚠️ SECURITY: از xss برای جلوگیری از حملات XSS استفاده می‌شود.
  const xssOptions = {
    whiteList: {
      a: ["href", "target", "class", "style", "title"],
      img: ["src", "alt", "class", "style", "width", "height"],
      div: ["class", "style", "id"],
      span: ["class", "style", "id"],
      p: ["class", "style"],
      h1: ["class", "style"],
      h2: ["class", "style"],
      h3: ["class", "style"],
      h4: ["class", "style"],
      h5: ["class", "style"],
      h6: ["class", "style"],
      ul: ["class", "style"],
      ol: ["class", "style"],
      li: ["class", "style"],
      table: ["class", "style"],
      thead: ["class", "style"],
      tbody: ["class", "style"],
      tr: ["class", "style"],
      td: ["class", "style", "colspan", "rowspan"],
      th: ["class", "style", "colspan", "rowspan"],
      blockquote: ["class", "style"],
      pre: ["class", "style"],
      code: ["class", "style"],
      em: ["class", "style"],
      strong: ["class", "style"],
      br: ["class"],
      hr: ["class", "style"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "class", "style"],
      style: ["type"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  } as Record<string, unknown>;

  const cleanHtml = hasCustomHtml ? xss(page.customHtml!, xssOptions) : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white">
      {/* هدر پیش‌فرض (قابل غیرفعال‌سازی از پنل مدیریت) */}
      {page.showHeader && <SiteHeader />}

      <main className="flex-1">
        {/* Custom CSS */}
        {page.customCss && (
          <style dangerouslySetInnerHTML={{ __html: page.customCss }} />
        )}

        {/* محتوا */}
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="mb-8 text-3xl font-bold text-white">{page.title}</h1>

          {/* ⚠️ SECURITY: customHtml sanitized via xss (XSS-safe) */}
          {hasCustomHtml ? (
            <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          ) : (
            <div
              className="prose prose-zinc max-w-none prose-headings:text-white"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(page.content) }}
            />
          )}
        </article>

        {/* Custom JS */}
        {page.customJs && (
          <script dangerouslySetInnerHTML={{ __html: page.customJs }} />
        )}
      </main>

      {/* فوتر پیش‌فرض (قابل غیرفعال‌سازی از پنل مدیریت) */}
      {page.showFooter && <Footer />}
    </div>
  );
}