"use client";

// ============================================================================
// مدیریتگر پورتفولیو (Client Component)
// شامل: آپلود تصویر، نمایش شبکه‌ای، حذف دسته‌ای
// ============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  uploadMultipleImages,
  getUploadQuota,
} from "@/services/upload.service";
import {
  getMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/services/portfolio.service";
import { TATTOO_STYLE_LABELS, TATTOO_SIZE_LABELS, toPersianNumbers } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  style: string;
  size: string | null;
  durationMinutes: number | null;
  price: bigint | null;
  tags: string[];
  likeCount: number;
  saveCount: number;
  status: string;
  sortOrder: number;
  createdAt: Date;
}

interface UploadedFile {
  id: string;
  url: string;
  mediumUrl: string;
  thumbnailUrl: string;
  file: File;
}

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export default function PortfolioManager({ userId }: { userId: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [quota, setQuota] = useState({ used: 0, remaining: 50, max: 50 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // فرم جدید
  const [newTitle, setNewTitle] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);

  // حالت ویرایش
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStyle, setEditStyle] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // باز کردن فرم ویرایش
  const openEdit = (item: PortfolioItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditStyle(item.style);
    setEditSize(item.size || "");
    setEditPrice(item.price ? String(item.price) : "");
    setEditDescription(item.description || "");
    setEditTags(item.tags.join(", "));
    setEditImages([...item.images]);
    setShowNewForm(false);
  };

  // بستن فرم ویرایش
  const closeEdit = () => {
    setEditItem(null);
    setEditTitle("");
    setEditStyle("");
    setEditSize("");
    setEditPrice("");
    setEditDescription("");
    setEditTags("");
    setEditImages([]);
  };

  // آپلود تصویر جدید برای ویرایش
  const handleEditUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));
      const result = await uploadMultipleImages(formData);
      if (result.success && result.data) {
        const urls = result.data.map((u) => u.url);
        setEditImages((prev) => [...prev, ...urls]);
        toast.success(`${urls.length} تصویر اضافه شد`);
      } else {
        toast.error(result.message || "خطا در آپلود");
      }
    } catch {
      toast.error("خطا در آپلود تصویر");
    }
  };

  // ذخیره ویرایش
  const handleSaveEdit = async () => {
    if (!editItem || !editTitle) {
      toast.error("عنوان الزامی است");
      return;
    }
    setEditSaving(true);
    try {
      const result = await updatePortfolioItem(editItem.id, {
        title: editTitle,
        style: editStyle || undefined,
        size: editSize || undefined,
        price: editPrice ? parseInt(editPrice) : undefined,
        description: editDescription || undefined,
        tags: editTags ? editTags.split(",").map((t) => t.trim()) : undefined,
        images: editImages,
      });
      if (result.success) {
        toast.success(result.message || "نمونه‌کار ویرایش شد و مجدداً برای تأیید ارسال شد");
        closeEdit();
        fetchPortfolio();
      } else {
        toast.error(result.message || "خطا در ویرایش");
      }
    } catch {
      toast.error("خطا در ویرایش");
    } finally {
      setEditSaving(false);
    }
  };

  // دریافت پورتفولیو
  const fetchPortfolio = useCallback(async () => {
    try {
      const result = await getMyPortfolio();
      if (result.success && result.data) {
        setItems(result.data.items as PortfolioItem[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // بارگذاری اولیه (باید در useEffect باشد؛ صدا زدن Server Function
  // داخل initializer در Next.js خطا می‌دهد)
  useEffect(() => {
    fetchPortfolio();
    getUploadQuota().then((r) => {
      if (r.success && r.data) setQuota(r.data);
    });
  }, [fetchPortfolio]);

  // آپلود فایل‌ها
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));

      const result = await uploadMultipleImages(formData);

      if (result.success && result.data) {
        const newUploads = result.data.map((u, i) => ({
          ...u,
          file: fileArray[i],
        }));
        setUploadedImages((prev) => [...prev, ...newUploads]);
        toast.success(`${result.data.length} تصویر آپلود شد`);

        // بروزرسانی سهمیه
        const q = await getUploadQuota();
        if (q.success && q.data) setQuota(q.data);
      } else {
        toast.error(result.message || "خطا در آپلود");
      }
    } catch {
      toast.error("خطا در آپلود تصاویر");
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // ثبت آیتم جدید
  const handleCreate = async () => {
    if (!newTitle || uploadedImages.length === 0) {
      toast.error("عنوان و حداقل یک تصویر الزامی است");
      return;
    }

    try {
      const result = await createPortfolioItem({
        title: newTitle,
        style: newStyle || "OTHER",
        size: newSize || undefined,
        price: newPrice ? parseInt(newPrice) : undefined,
        description: newDescription || undefined,
        tags: newTags ? newTags.split(",").map((t) => t.trim()) : [],
        images: uploadedImages.map((u) => u.url),
      });

      if (result.success) {
        toast.success(result.message || "نمونه‌کار ثبت شد و در انتظار بررسی است");
        setShowNewForm(false);
        setNewTitle("");
        setNewStyle("");
        setNewSize("");
        setNewPrice("");
        setNewDescription("");
        setNewTags("");
        setUploadedImages([]);
        fetchPortfolio();
      } else {
        toast.error(result.message || "خطا در ایجاد آیتم");
      }
    } catch {
      toast.error("خطا در ایجاد آیتم");
    }
  };

  // حذف آیتم
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این آیتم مطمئن هستید؟")) return;

    try {
      const result = await deletePortfolioItem(id);
      if (result.success) {
        toast.success("آیتم حذف شد");
        fetchPortfolio();
      } else {
        toast.error(result.message || "خطا در حذف");
      }
    } catch {
      toast.error("خطا در حذف آیتم");
    }
  };

  // حذف دسته‌ای
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`آیا از حذف ${selectedIds.size} آیتم مطمئن هستید؟`)) return;

    for (const id of selectedIds) {
      await deletePortfolioItem(id);
    }
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} آیتم حذف شد`);
    fetchPortfolio();
  };

  // حذف تصویر آپلود شده
  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* نوار ابزار */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn-primary text-sm"
          >
            + افزودن نمونه کار
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
            >
              حذف ({selectedIds.size})
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {toPersianNumbers(items.length)} نمونه کار • سهمیه آپلود:{" "}
          {toPersianNumbers(quota.remaining)} باقی‌مانده
        </p>
      </div>

      {/* فرم ایجاد جدید */}
      {showNewForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="mb-4 text-base font-semibold text-white">
            نمونه کار جدید
          </h3>

          {/* ناحیه آپلود */}
          <div
            className={`relative mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-brand bg-rose-600/5"
                : "border-zinc-800 hover:border-content-tertiary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <svg className="mx-auto h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
            <p className="mt-2 text-sm text-zinc-400">
              تصاویر را اینجا رها کنید یا{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-rose-400 hover:text-rose-400-600"
              >
               انتخاب کنید
              </button>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              حداکثر ۱۰ تصویر، هر کدام حداکثر ۱۰ مگابایت — همه فرمت‌های تصویری پشتیبانی می‌شوند
            </p>
          </div>

          {/* تصاویر آپلود شده */}
          {uploadedImages.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-2">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={img.thumbnailUrl}
                    alt={`تصویر ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeUploadedImage(i)}
                    className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* فیلدهای فرم */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                عنوان *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-field text-sm"
                placeholder="مثال: پروانه مینیمال"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                سبک تتو *
              </label>
              <select
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">انتخاب سبک</option>
                {Object.entries(TATTOO_STYLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                اندازه
              </label>
              <select
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">انتخاب اندازه</option>
                {Object.entries(TATTOO_SIZE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                قیمت (تومان)
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="input-field text-sm"
                placeholder="اختیاری"
                dir="ltr"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">
                توضیحات
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="input-field text-sm"
                rows={2}
                placeholder="توضیحات اختیاری..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">
                تگ‌ها (با کاما جدا کنید)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="input-field text-sm"
                placeholder="پروانه, مینیمال, مچ دست"
              />
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={uploading || !newTitle || uploadedImages.length === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {uploading ? "در حال آپلود..." : "ثبت نمونه کار"}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="btn-ghost text-sm"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* فرم ویرایش */}
      {editItem && (
        <div className="rounded-xl border border-amber-500/20 bg-zinc-900/80 p-6">
          <h3 className="mb-4 text-base font-semibold text-amber-400">
            ویرایش نمونه‌کار: {editItem.title}
          </h3>

          {/* تصاویر فعلی */}
          {editImages.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-2">
              {editImages.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={url} alt={`تصویر ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => setEditImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* آپلود تصویر جدید */}
          <div className="mb-4">
            <input ref={editFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleEditUpload(e.target.files)} />
            <button onClick={() => editFileInputRef.current?.click()} className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-amber-500/50 hover:text-amber-400">
              + افزودن تصویر جدید
            </button>
          </div>

          {/* فیلدها */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">عنوان *</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">سبک تتو</label>
              <select value={editStyle} onChange={(e) => setEditStyle(e.target.value)} className="input-field text-sm">
                <option value="">انتخاب سبک</option>
                {Object.entries(TATTOO_STYLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">اندازه</label>
              <select value={editSize} onChange={(e) => setEditSize(e.target.value)} className="input-field text-sm">
                <option value="">انتخاب اندازه</option>
                {Object.entries(TATTOO_SIZE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">قیمت (تومان)</label>
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="input-field text-sm" dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">توضیحات</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="input-field text-sm" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">تگ‌ها (با کاما جدا کنید)</label>
              <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} className="input-field text-sm" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSaveEdit} disabled={editSaving || !editTitle} className="btn-primary text-sm disabled:opacity-50">
              {editSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button onClick={closeEdit} className="btn-ghost text-sm">انصراف</button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">پس از ویرایش، نمونه‌کار مجدداً برای تأیید مدیریت ارسال می‌شود.</p>
        </div>
      )}

      {/* لودینگ */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      )}

      {/* گرید پورتفولیو */}
      {!loading && items.length === 0 && !showNewForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 py-16 text-center">
          <span className="text-4xl">🖼️</span>
          <p className="mt-3 text-sm text-zinc-500">
            هنوز نمونه کاری ثبت نشده
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 btn-primary text-sm"
          >
            اولین نمونه کار را اضافه کنید
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
            >
              {/* تصویر */}
              <div className="relative aspect-square overflow-hidden">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-800/50">
                    <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                )}

                {/* نشان وضعیت (در انتظار تأیید / رد شده) */}
                {item.status !== "PUBLISHED" && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold backdrop-blur-md">
                    {item.status === "ARCHIVED" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-red-300">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        رد شده / آرشیو
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-amber-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        در انتظار بررسی
                      </span>
                    )}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds);
                      if (e.target.checked) newSet.add(item.id);
                      else newSet.delete(item.id);
                      setSelectedIds(newSet);
                    }}
                    className="h-5 w-5 rounded"
                  />
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-xs text-white hover:bg-amber-500"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg bg-red-500/80 px-3 py-1.5 text-xs text-white hover:bg-red-500"
                  >
                    حذف
                  </button>
                </div>
              </div>

              {/* اطلاعات */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-white">
                  {item.title}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {TATTOO_STYLE_LABELS[item.style] || item.style}
                  </span>
                  <span>
                    <svg className="h-3.5 w-3.5 text-rose-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {toPersianNumbers(item.likeCount)} •{" "}
                    {toPersianNumbers(item.saveCount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
