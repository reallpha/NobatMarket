"use client";

// ============================================================================
// پنل مدیریت CMS - ادمین
// ============================================================================

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate } from "@/lib/utils";

type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  customHtml: string | null;
  customCss: string | null;
  customJs: string | null;
  isActive: boolean;
  showHeader: boolean;
  showFooter: boolean;
  updatedAt: string;
};

const DEFAULT_PAGES = [
  { slug: "about", title: "درباره ما", content: "# درباره نوبت مارکت\n\nنوبت مارکت، پلتفرم بازار و رزرو تتو در ایران..." },
  { slug: "terms", title: "شرایط استفاده", content: "# شرایط استفاده\n\n## ۱. پذیرش شرایط\n\nبا استفاده از نوبت مارکت..." },
  { slug: "privacy", title: "حریم خصوصی", content: "# حریم خصوصی\n\n## جمع‌آوری اطلاعات\n\nنوبت مارکت اطلاعات زیر را جمع‌آوری می‌کند..." },
  { slug: "faq", title: "سوالات متداول", content: "# سوالات متداول\n\n## چگونه رزرو کنم؟\n\n۱. وارد حساب خود شوید..." },
  { slug: "cancellation", title: "سیاست لغو", content: "# سیاست لغو\n\n## لغو رایگان\n\nلغو رایگان تا ۲۴ ساعت قبل از زمان رزرو..." },
];

const MARKDOWN_SNIPPETS = [
  { label: "عنوان ۱", snippet: "# " },
  { label: "عنوان ۲", snippet: "## " },
  { label: "عنوان ۳", snippet: "### " },
  { label: "پاراگراف", snippet: "\n\n" },
  { label: "لیست", snippet: "\n- " },
  { label: "لیست شماره‌دار", snippet: "\n۱. " },
  { label: "لینک", snippet: "[متن لینک](url)" },
  { label: "تصویر", snippet: "![متن جایگزین](url)" },
  { label: "نقل‌قول", snippet: "\n> " },
  { label: "کد", snippet: "`کد`" },
  { label: "جدول", snippet: "\n| ستون ۱ | ستون ۲ |\n|---|---|\n| مقدار | مقدار |\n" },
  { label: "خط جداکننده", snippet: "\n---\n" },
];

const HTML_BLOCK_TEMPLATES = [
  { label: "بلاک متنی", html: '<div class="my-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">\n  <h3 class="mb-3 text-xl font-bold text-white">عنوان بلاک</h3>\n  <p class="text-zinc-400 leading-relaxed">متن شما اینجا قرار می‌گیرد...</p>\n</div>' },
  { label: "بلاک ویژگی‌ها", html: '<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">\n  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">\n    <div class="mb-3 text-amber-400 text-2xl">✦</div>\n    <h4 class="mb-1 text-sm font-bold text-white">ویژگی ۱</h4>\n    <p class="text-xs text-zinc-500">توضیحات</p>\n  </div>\n  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">\n    <div class="mb-3 text-rose-400 text-2xl">✦</div>\n    <h4 class="mb-1 text-sm font-bold text-white">ویژگی ۲</h4>\n    <p class="text-xs text-zinc-500">توضیحات</p>\n  </div>\n  <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">\n    <div class="mb-3 text-emerald-400 text-2xl">✦</div>\n    <h4 class="mb-1 text-sm font-bold text-white">ویژگی ۳</h4>\n    <p class="text-xs text-zinc-500">توضیحات</p>\n  </div>\n</div>' },
  { label: "بلاک CTA", html: '<div class="my-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-8 text-center backdrop-blur-xl">\n  <h3 class="mb-2 font-lalezar text-2xl text-white">عنوان فراخوان</h3>\n  <p class="mb-5 text-sm text-zinc-400">توضیحات فراخوان</p>\n  <a href="/artists" class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-500">جستجوی هنرمند</a>\n</div>' },
  { label: "بلاک ایمیج", html: '<div class="my-8 overflow-hidden rounded-2xl border border-white/[0.06]">\n  <img src="https://via.placeholder.com/800x400" alt="تصویر" class="h-auto w-full object-cover" />\n  <div class="p-4 text-center text-xs text-zinc-500">توضیح تصویر</div>\n</div>' },
  { label: "بلاک اکordion", html: '<details class="my-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">\n  <summary class="cursor-pointer text-sm font-bold text-white">سوال شما</summary>\n  <p class="mt-2 text-sm text-zinc-400">پاسخ سوال اینجا قرار می‌گیرد...</p>\n</details>' },
];

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export function CmsAdminPanel({ pages: initialPages }: { pages: CmsPage[] }) {
  const [pages, setPages] = useState(initialPages);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"markdown" | "html">("markdown");
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    customHtml: "",
    customCss: "",
    customJs: "",
    isActive: true,
    showHeader: true,
    showFooter: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);

  const openEditor = (page?: CmsPage) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        seoTitle: page.seoTitle || "",
        seoDescription: page.seoDescription || "",
        customHtml: page.customHtml || "",
        customCss: page.customCss || "",
        customJs: page.customJs || "",
        isActive: page.isActive,
        showHeader: page.showHeader,
        showFooter: page.showFooter,
      });
      // Determine which tab to show
      if (page.content && !page.content.startsWith("#") && page.content.trim().startsWith("<")) {
        setActiveTab("html");
      } else {
        setActiveTab("markdown");
      }
    } else {
      setEditingPage(null);
      setFormData({
        slug: "",
        title: "",
        content: "",
        seoTitle: "",
        seoDescription: "",
        customHtml: "",
        customCss: "",
        customJs: "",
        isActive: true,
        showHeader: true,
        showFooter: true,
      });
      setActiveTab("markdown");
    }
    setShowAdvanced(false);
    setEditorOpen(true);
  };

  const insertSnippet = (snippet: string, target: "markdown" | "html") => {
    const ref = target === "markdown" ? contentRef : htmlRef;
    const field = target === "markdown" ? "content" : "customHtml";
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      const text = formData[field];
      const newText = text.substring(0, start) + snippet + text.substring(end);
      setFormData({ ...formData, [field]: newText });
      setTimeout(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 0);
    } else {
      setFormData({ ...formData, [field]: formData[field] + snippet });
    }
  };

  const insertHtmlBlock = (html: string) => {
    setFormData({
      ...formData,
      customHtml: formData.customHtml ? formData.customHtml + "\n\n" + html : html,
    });
    setActiveTab("html");
    toast({ title: "بلاک HTML اضافه شد" });
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.title) {
      toast({ title: "شناسه و عنوان الزامی است", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { upsertCmsPage } = await import("@/services/cms.service");
      const result = await upsertCmsPage({
        id: editingPage?.id,
        slug: formData.slug,
        title: formData.title,
        content: formData.content,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        customHtml: formData.customHtml || undefined,
        customCss: formData.customCss || undefined,
        customJs: formData.customJs || undefined,
        isActive: formData.isActive,
        showHeader: formData.showHeader,
        showFooter: formData.showFooter,
      });

      if (result.success && result.data) {
        toast({ title: "صفحه ذخیره شد" });
        setEditorOpen(false);
        window.location.reload();
      } else {
        toast({ title: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ذخیره", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("آیا از حذف این صفحه اطمینان دارید؟")) return;
    try {
      const { deleteCmsPage } = await import("@/services/cms.service");
      const result = await deleteCmsPage(pageId);
      if (result.success) {
        toast({ title: "صفحه حذف شد" });
        setPages((prev) => prev.filter((p) => p.id !== pageId));
      } else {
        toast({ title: result.message || "خطا در حذف", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در حذف", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت صفحات</h1>
          <p className="mt-1 text-sm text-zinc-500">
            صفحات استاتیک (درباره ما، شرایط و...) را مدیریت کنید. با Markdown یا کد HTML کامل بسازید.
          </p>
        </div>
        <Button onClick={() => openEditor()} className="bg-rose-600 hover:bg-rose-700">
          + صفحه جدید
        </Button>
      </div>

      {/* صفحات پیش‌فرض — همیشه قابل مشاهده است تا ویرایش Help/FAQ/Terms/Privacy/About ممکن بماند */}
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-white mb-2">صفحات پیش‌فرض</p>
          <p className="text-xs text-zinc-500 mb-4">
            صفحات زیر به صورت خودکار ایجاد می‌شوند. روی هر کدام کلیک کنید تا محتوا را ویرایش کنید — حتی اگر قبلاً صفحه‌ای ساخته باشید، این بخش پنهان نمی‌شود.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PAGES.map((dp) => {
              const existing = pages.find((p) => p.slug === dp.slug);
              return (
                <Button
                  key={dp.slug}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => {
                    if (existing) {
                      openEditor(existing);
                    } else {
                      setFormData({
                        slug: dp.slug,
                        title: dp.title,
                        content: dp.content,
                        seoTitle: dp.title,
                        seoDescription: "",
                        customHtml: "",
                        customCss: "",
                        customJs: "",
                        isActive: true,
                        showHeader: true,
                        showFooter: true,
                      });
                      setEditingPage(null);
                      setEditorOpen(true);
                    }
                  }}
                >
                  {dp.title}
                  {existing ? " (ویرایش)" : " (جدید)"}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* لیست صفحات */}
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">شناسه</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">عنوان</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">SEO</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">نوع محتوا</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">آخرین به‌روزرسانی</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      صفحه‌ای وجود ندارد. اولین صفحه خود را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{page.slug}</td>
                      <td className="px-4 py-3 font-medium text-white">{page.title}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{page.seoTitle || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          page.customHtml
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }>
                          {page.customHtml ? "HTML" : "Markdown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge className={
                            page.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-500"
                          }>
                            {page.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                          {page.showHeader && page.showFooter ? null : (
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              بدون هدر/فوتر
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatJalaliDate(new Date(page.updatedAt), "short")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white text-xs"
                            onClick={() => openEditor(page)}
                          >
                            ویرایش
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                            onClick={() => handleDelete(page.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* دیالوگ ویرایشگر */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPage ? "ویرایش صفحه" : "صفحه جدید"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* ردیف اول: شناسه + عنوان + وضعیت */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <label className="mb-1 block text-xs font-medium text-zinc-400">شناسه URL *</label>
                <Input
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="about, terms, ..."
                  disabled={!!editingPage}
                  className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600"
                />
                {!editingPage && (
                  <p className="mt-1 text-[10px] text-zinc-600">
                    فارسی هم می‌توانید بنویسید — خودکار به لاتین تبدیل می‌شود (مثلاً «قوانین» ← «ghavanin»)
                  </p>
                )}
              </div>
              <div className="col-span-5">
                <label className="mb-1 block text-xs font-medium text-zinc-400">عنوان صفحه *</label>
                <Input
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان صفحه"
                  className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-xs font-medium text-zinc-400">وضعیت</label>
                <button
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  dir="ltr"
                  className={`relative inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-all ${
                    formData.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${formData.isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {formData.isActive ? "فعال" : "غیرفعال"}
                </button>
              </div>
            </div>

            {/* پیش‌نمایش آدرس صفحه */}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              <span className="truncate font-mono text-xs text-zinc-400" dir="ltr">
                /page/{formData.slug || "..."}
              </span>
              {editingPage && formData.slug && (
                <a
                  href={`/page/${formData.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-auto shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  مشاهده صفحه
                </a>
              )}
            </div>

            {/* هدر و فوتر پیش‌فرض */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, showHeader: !formData.showHeader })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                  formData.showHeader
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 bg-zinc-800 text-zinc-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                  نمایش هدر پیش‌فرض
                </span>
                <span className={`h-2 w-2 rounded-full ${formData.showHeader ? "bg-rose-400" : "bg-zinc-600"}`} />
              </button>
              <button
                onClick={() => setFormData({ ...formData, showFooter: !formData.showFooter })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                  formData.showFooter
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 bg-zinc-800 text-zinc-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                  نمایش فوتر پیش‌فرض
                </span>
                <span className={`h-2 w-2 rounded-full ${formData.showFooter ? "bg-rose-400" : "bg-zinc-600"}`} />
              </button>
            </div>

            {/* تب‌های نوع محتوا */}
            <div>
              <div className="mb-3 flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/50 p-1">
                <button
                  onClick={() => setActiveTab("markdown")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                    activeTab === "markdown"
                      ? "bg-rose-600 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ✏️ ویرایشگر Markdown
                </button>
                <button
                  onClick={() => setActiveTab("html")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                    activeTab === "html"
                      ? "bg-purple-600 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  &lt;/&gt; ویرایشگر HTML
                </button>
              </div>

              {/* نوار ابزار Markdown */}
              {activeTab === "markdown" && (
                <div className="mb-2 flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-800/30 p-1.5">
                  {MARKDOWN_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => insertSnippet(s.snippet, "markdown")}
                      className="rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-white"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* نوار ابزار HTML */}
              {activeTab === "html" && (
                <div className="mb-2 flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-800/30 p-1.5">
                  {HTML_BLOCK_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => insertHtmlBlock(t.html)}
                      className="rounded-md px-2 py-1 text-[10px] font-medium text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* فیلد محتوا */}
              {activeTab === "markdown" ? (
                <Textarea
                  ref={contentRef}
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                  className="font-mono text-sm border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600 focus-visible:ring-rose-500"
                  placeholder="# عنوان صفحه&#10;&#10;محتوای صفحه با Markdown..."
                />
              ) : (
                <Textarea
                  ref={htmlRef}
                  value={formData.customHtml}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customHtml: e.target.value })}
                  rows={14}
                  className="font-mono text-xs border-zinc-700 bg-zinc-800/50 text-purple-300 placeholder:text-zinc-600 focus-visible:ring-purple-500"
                  placeholder='&lt;div class="..."&gt;&#10;  &lt;h2&gt;عنوان&lt;/h2&gt;&#10;  &lt;p&gt;متن شما&lt;/p&gt;&#10;&lt;/div&gt;'
                />
              )}
              <p className="mt-1.5 text-[10px] text-zinc-600">
                {activeTab === "markdown"
                  ? "از Markdown برای نوشتن محتوای ساده و سریع استفاده کنید."
                  : "کد HTML کامل را اینجا وارد کنید. مثل بلوک‌های المنتور — از قالب‌های بالا استفاده کنید."}
              </p>
            </div>

            {/* SEO */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                بهینه‌سازی موتورهای جستجو (SEO)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">عنوان SEO</label>
                  <Input
                    value={formData.seoTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="عنوان برای گوگل (50-60 کاراکتر)"
                    className="border-zinc-700 bg-zinc-800/50 text-white text-xs placeholder:text-zinc-600"
                  />
                  <p className="mt-0.5 text-[10px] text-zinc-600">{formData.seoTitle.length}/60</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">توضیحات SEO</label>
                  <Input
                    value={formData.seoDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="توضیحات برای نتایج جستجو (150-160 کاراکتر)"
                    className="border-zinc-700 bg-zinc-800/50 text-white text-xs placeholder:text-zinc-600"
                  />
                  <p className="mt-0.5 text-[10px] text-zinc-600">{formData.seoDescription.length}/160</p>
                </div>
              </div>
            </div>

            {/* تنظیمات پیشرفته - دارک */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  تنظیمات پیشرفته
                </span>
                <span className="text-xs text-zinc-600">{showAdvanced ? "▼" : "▶"}</span>
              </button>

              {showAdvanced && (
                <div className="border-t border-zinc-800 px-4 pb-4 pt-3 space-y-4">
                  <p className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    این کدها در صفحه عمومی اجرا می‌شوند. فقط در صورت نیاز استفاده کنید.
                  </p>

                  {/* HTML سفارشی - فقط وقتی تب HTML انتخاب نیست */}
                  {activeTab === "markdown" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-400">HTML سفارشی (اضافی)</label>
                      <Textarea
                        value={formData.customHtml}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customHtml: e.target.value })}
                        rows={4}
                        className="font-mono text-xs border-zinc-700 bg-zinc-800/50 text-purple-300 placeholder:text-zinc-600 focus-visible:ring-purple-500"
                        placeholder="<div>...</div>"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">CSS سفارشی</label>
                    <Textarea
                      value={formData.customCss}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customCss: e.target.value })}
                      rows={3}
                      className="font-mono text-xs border-zinc-700 bg-zinc-800/50 text-cyan-300 placeholder:text-zinc-600 focus-visible:ring-cyan-500"
                      placeholder=".custom-class { color: white; }"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">JavaScript سفارشی</label>
                    <Textarea
                      value={formData.customJs}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customJs: e.target.value })}
                      rows={3}
                      className="font-mono text-xs border-zinc-700 bg-zinc-800/50 text-yellow-300 placeholder:text-zinc-600 focus-visible:ring-yellow-500"
                      placeholder="console.log('page loaded');"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-zinc-800 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-500"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  در حال ذخیره...
                </span>
              ) : (
                "ذخیره صفحه"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
