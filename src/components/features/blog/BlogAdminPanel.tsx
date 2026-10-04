"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatJalaliDate, slugify } from "@/lib/utils";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  isNotice: boolean;
  views: number;
  createdAt: string;
};

const CATEGORY_OPTIONS = [
  { value: "AFTER_CARE", label: "مراقبت بعد از تتو", color: "bg-emerald-500/10 text-emerald-400" },
  { value: "STYLES", label: "معرفی سبک‌ها", color: "bg-purple-500/10 text-purple-400" },
  { value: "NEWS", label: "اخبار", color: "bg-blue-500/10 text-blue-400" },
  { value: "ANNOUNCEMENT", label: "اطلاعیه‌ها", color: "bg-amber-500/10 text-amber-400" },
  { value: "GUIDES", label: "راهنما", color: "bg-rose-500/10 text-rose-400" },
];

// Markdown toolbar buttons
const TOOLBAR_BUTTONS = [
  { label: "بولد", icon: "B", action: "bold", prefix: "**", suffix: "**" },
  { label: "ایتالیک", icon: "I", action: "italic", prefix: "*", suffix: "*" },
  { label: "Heading 2", icon: "H2", action: "h2", prefix: "\n## ", suffix: "" },
  { label: "Heading 3", icon: "H3", action: "h3", prefix: "\n### ", suffix: "" },
  { label: "لیست", icon: "•", action: "list", prefix: "\n- ", suffix: "" },
  { label: "بلاک‌وت", icon: "❝", action: "quote", prefix: "\n> ", suffix: "" },
  { label: "لینک", icon: "🔗", action: "link", prefix: "[", suffix: "](url)" },
  { label: "خط جداکننده", icon: "—", action: "hr", prefix: "\n---\n", suffix: "" },
];

export function BlogAdminPanel({ posts: initialPosts }: { posts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "NEWS",
    isPublished: false,
    isFeatured: false,
    isNotice: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setForm({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage || "",
        category: post.category,
        isPublished: post.isPublished,
        isFeatured: post.isFeatured || false,
        isNotice: post.isNotice || false,
      });
    } else {
      setEditingPost(null);
      setForm({ slug: "", title: "", excerpt: "", content: "", coverImage: "", category: "NEWS", isPublished: false, isFeatured: false, isNotice: false });
    }
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.title || !form.content) {
      toast({ title: "شناسه، عنوان و محتوا الزامی است", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { upsertPost } = await import("@/services/blog.service");
      const result = await upsertPost({
        id: editingPost?.id,
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || undefined,
        category: form.category,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        isNotice: form.isNotice,
      });
      if (result.success) {
        toast({ title: editingPost ? "مقاله ویرایش شد" : "مقاله جدید ایجاد شد" });
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast({ title: "مقاله حذف شد" });
        setDeleteConfirmId(null);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در حذف", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, coverImage: data.url }));
        toast({ title: "تصویر آپلود شد" });
      } else {
        toast({ title: data.error || "خطا در آپلود", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در آپلود تصویر", variant: "destructive" });
    }
    setUploadingImage(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.content.substring(start, end);
    const newContent = form.content.substring(0, start) + prefix + selected + suffix + form.content.substring(end);
    setForm((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const generateSlug = (title: string) => {
    // تبدیل خودکار فارسی به لاتین تا لینک مقاله در URL به درستی کار کند
    return slugify(title) || `article-${Date.now()}`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت مجله</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {posts.length} مقاله —{" "}
            <span className="text-emerald-400">{posts.filter((p) => p.isPublished).length} منتشر شده</span>
          </p>
        </div>
        <Button onClick={() => openEditor()} className="bg-rose-600 hover:bg-rose-700">
          + مقاله جدید
        </Button>
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">عنوان</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">شناسه</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">دسته</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">بازدید</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                      مقاله‌ای وجود ندارد. اولین مقاله خود را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            </div>
                          )}
                          <span className="font-medium text-white truncate max-w-[200px]">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{post.slug}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${CATEGORY_OPTIONS.find((c) => c.value === post.category)?.color || "bg-zinc-800 text-zinc-500"}`}>
                          {CATEGORY_OPTIONS.find((c) => c.value === post.category)?.label || post.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className={post.isPublished ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}>
                            {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                          </Badge>
                          {post.isFeatured && (
                            <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30">ویژه</Badge>
                          )}
                          {post.isNotice && (
                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">اطلاعیه</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{post.views.toLocaleString("fa-IR")}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{formatJalaliDate(new Date(post.createdAt), "short")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditor(post)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-rose-500/50 hover:text-rose-400">ویرایش</button>
                          <button onClick={() => setDeleteConfirmId(post.id)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400">حذف</button>
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

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{editingPost ? "ویرایش مقاله" : "مقاله جدید"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Row 1: Slug + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">شناسه URL *</label>
                <Input
                  value={form.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, slug: e.target.value })}
                  placeholder="my-article-slug"
                  disabled={!!editingPost}
                  className="bg-zinc-800/50 border-zinc-700"
                />
                {!editingPost && form.title && !form.slug && (
                  <button onClick={() => setForm({ ...form, slug: generateSlug(form.title) })} className="mt-1 text-xs text-rose-400 hover:text-rose-300">
                    ✓ تولید خودکار از عنوان
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">دسته‌بندی</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">عنوان مقاله *</label>
              <Input
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان مقاله را وارد کنید..."
                className="bg-zinc-800/50 border-zinc-700 text-base"
              />
            </div>

            {/* Row 3: Excerpt */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">خلاصه مقاله</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="خلاصه کوتاهی از مقاله برای نمایش در لیست..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Row 4: Cover Image */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">تصویر شاخص</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={form.coverImage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, coverImage: e.target.value })}
                    placeholder="URL تصویر یا آپلود کنید..."
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-rose-500/50 hover:text-rose-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {uploadingImage ? "در حال آپلود..." : "آپلود"}
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {form.coverImage && (
                <div className="mt-3 relative">
                  <img src={form.coverImage} alt="پیش‌نمایش کاور" className="h-32 w-full rounded-lg object-cover" />
                  <button onClick={() => setForm({ ...form, coverImage: "" })} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 hover:text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Row 5: Content with toolbar */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">محتوا (Markdown) *</label>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-zinc-700 bg-zinc-800 px-2 py-1.5">
                {TOOLBAR_BUTTONS.map((btn) => (
                  <button
                    key={btn.action}
                    onClick={() => insertMarkdown(btn.prefix, btn.suffix)}
                    title={btn.label}
                    className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    {btn.icon}
                  </button>
                ))}
                <div className="mx-1 h-4 w-px bg-zinc-700" />
                <span className="text-[10px] text-zinc-600">Markdown</span>
              </div>

              <textarea
                ref={contentRef}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={16}
                placeholder="محتوای مقاله را با Markdown بنویسید...&#10;&#10;## عنوان فصل&#10;&#10;متن پاراگراف...&#10;&#10;- آیتم لیست&#10;- آیتم دوم&#10;&#10;> بلاک‌وت"
                className="w-full rounded-b-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-rose-500 resize-y min-h-[300px]"
                style={{ lineHeight: "1.7" }}
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-600">
                <span>{form.content.split(/\s+/).filter(Boolean).length} کلمه</span>
                <span>{Math.max(1, Math.ceil(form.content.split(/\s+/).filter(Boolean).length / 200))} دقیقه مطالعه</span>
              </div>
            </div>

            {/* Row 6: Featured / Notice flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                className={`flex items-center justify-between rounded-xl border p-4 text-right transition-colors ${form.isFeatured ? "border-rose-500/40 bg-rose-500/10" : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-3 w-3 rounded-full ${form.isFeatured ? "bg-rose-500" : "bg-zinc-600"}`} />
                  <div>
                    <span className="text-sm font-medium text-white">مطلب ویژه</span>
                    <p className="text-xs text-zinc-500">هایلایت قرمز در صفحه مجله</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${form.isFeatured ? "text-rose-400" : "text-zinc-600"}`}>{form.isFeatured ? "فعال" : "غیرفعال"}</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isNotice: !form.isNotice })}
                className={`flex items-center justify-between rounded-xl border p-4 text-right transition-colors ${form.isNotice ? "border-amber-500/40 bg-amber-500/10" : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-3 w-3 rounded-full ${form.isNotice ? "bg-amber-400" : "bg-zinc-600"}`} />
                  <div>
                    <span className="text-sm font-medium text-white">اطلاعیه</span>
                    <p className="text-xs text-zinc-500">هایلایت زرد در صفحه مجله</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${form.isNotice ? "text-amber-400" : "text-zinc-600"}`}>{form.isNotice ? "فعال" : "غیرفعال"}</span>
              </button>
            </div>

            {/* Row 7: Publish status */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-3 w-3 rounded-full ${form.isPublished ? "bg-emerald-500" : "bg-zinc-600"}`} />
                <div>
                  <span className="text-sm font-medium text-white">{form.isPublished ? "منتشر شده" : "پیش‌نویس"}</span>
                  <p className="text-xs text-zinc-500">{form.isPublished ? "مقاله در سایت نمایش داده می‌شود" : "مقاله فقط در پنل مدیریت قابل مشاهده است"}</p>
                </div>
              </div>
              <button
                dir="ltr"
                onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublished ? "bg-emerald-500" : "bg-zinc-700"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${form.isPublished ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button
              onClick={() => { setForm({ ...form, isPublished: false }); handleSave(); }}
              disabled={saving}
              variant="outline"
              className="border-zinc-700 text-zinc-300"
            >
              {saving ? "..." : "ذخیره پیش‌نویس"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? "در حال ذخیره..." : form.isPublished ? "ذخیره و انتشار" : "انتشار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">حذف مقاله</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 py-4">آیا از حذف این مقاله مطمئن هستید? این عمل قابل بازگردانی نیست.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-zinc-700 text-zinc-400">انصراف</Button>
            <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="bg-red-600 hover:bg-red-700 text-white">حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
