"use client";

// ============================================================================
// مدیریتگر تتوهای فلش (Client Component)
// ============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  uploadSingleImage,
  getUploadQuota,
} from "@/services/upload.service";
import {
  getMyFlashTattoos,
  createFlashTattoo,
  updateFlashStatus,
  deleteFlashTattoo,
} from "@/services/flash.service";
import { TATTOO_STYLE_LABELS, TATTOO_SIZE_LABELS, formatPrice, toPersianNumbers } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface FlashItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  alternativeImageUrl: string | null;
  style: string;
  suggestedSize: string;
  price: bigint;
  isAvailable: boolean;
  status: string;
  isExclusive: boolean;
  soldCount: number;
  viewCount: number;
  tags: string[];
  createdAt: Date;
}

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export default function FlashManager({ userId }: { userId: string }) {
  const [items, setItems] = useState<FlashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // فرم جدید
  const [newTitle, setNewTitle] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsExclusive, setNewIsExclusive] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // دریافت لیست
  const fetchItems = useCallback(async () => {
    try {
      const result = await getMyFlashTattoos();
      if (result.success && result.data) {
        setItems(result.data.items as FlashItem[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // آپلود تصویر
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadSingleImage(formData);

      if (result.success && result.data) {
        setNewImageUrl(result.data.url);
        setPreviewUrl(result.data.mediumUrl);
        toast.success("تصویر آپلود شد");
      } else {
        toast.error(result.message || "خطا در آپلود");
      }
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // ایجاد تتوی فلش جدید
  const handleCreate = async () => {
    if (!newTitle || !newImageUrl || !newStyle || !newSize || !newPrice) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    try {
      const result = await createFlashTattoo({
        title: newTitle,
        imageUrl: newImageUrl,
        style: newStyle,
        suggestedSize: newSize,
        price: parseInt(newPrice),
        description: newDescription || undefined,
        isExclusive: newIsExclusive,
      });

      if (result.success) {
        toast.success(result.message || "تتوی فلش ثبت شد و در انتظار بررسی است");
        setShowNewForm(false);
        setNewTitle("");
        setNewStyle("");
        setNewSize("");
        setNewPrice("");
        setNewDescription("");
        setNewIsExclusive(false);
        setNewImageUrl("");
        setPreviewUrl("");
        fetchItems();
      } else {
        toast.error(result.message || "خطا در ایجاد");
      }
    } catch {
      toast.error("خطا در ایجاد تتوی فلش");
    }
  };

  // تغییر وضعیت
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await updateFlashStatus(id, !currentStatus);
      if (result.success) {
        toast.success(result.message || "موفقیت");
        fetchItems();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  // حذف
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این طرح مطمئن هستید؟")) return;

    try {
      const result = await deleteFlashTattoo(id);
      if (result.success) {
        toast.success("طرح حذف شد");
        fetchItems();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا در حذف");
    }
  };

  return (
    <div className="space-y-6">
      {/* نوار ابزار */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="btn-primary text-sm"
        >
          + طرح جدید
        </button>
        <p className="text-xs text-zinc-500">
          {toPersianNumbers(items.length)} طرح فلش
        </p>
      </div>

      {/* فرم جدید */}
      {showNewForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="mb-4 text-base font-semibold text-white">
            تتوی فلش جدید
          </h3>

          {/* آپلود تصویر */}
          <div
            className={`relative mb-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
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
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileUpload(e.target.files[0])
              }
            />
            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="پیش‌نمایش"
                  className="h-40 rounded-lg object-cover"
                />
                <button
                  onClick={() => {
                    setNewImageUrl("");
                    setPreviewUrl("");
                  }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
                <p className="mt-2 text-sm text-zinc-400">
                  تصویر طرح را اینجا رها کنید یا{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-rose-400 hover:text-rose-400-600"
                  >
                    انتخاب کنید
                  </button>
                </p>
              </>
            )}
          </div>

          {/* فیلدها */}
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
                placeholder="مثال: گربه مینیمال"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                قیمت (تومان) *
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="input-field text-sm"
                placeholder="1500000"
                dir="ltr"
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
                اندازه پیشنهادی *
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
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">
                توضیحات
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="input-field text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newIsExclusive}
                  onChange={(e) => setNewIsExclusive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-zinc-400">
                  طرح اختصاصی (فقط یک بار فروخته می‌شود)
                </span>
              </label>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={uploading || !newTitle || !newImageUrl || !newStyle || !newSize || !newPrice}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {uploading ? "در حال آپلود..." : "ثبت طرح"}
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

      {/* لودینگ */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      )}

      {/* لیست خالی */}
      {!loading && items.length === 0 && !showNewForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 py-16 text-center">
          <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <p className="mt-3 text-sm text-zinc-500">
            هنوز تتوی فلشی ثبت نشده
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 btn-primary text-sm"
          >
            اولین طرح را اضافه کنید
          </button>
        </div>
      )}

      {/* گرید طرح‌ها */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
            >
              {/* تصویر */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                {/* وضعیت تأیید و موجودی */}
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
                  {item.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                      در انتظار بررسی
                    </span>
                  )}
                  {item.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 backdrop-blur-md">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      رد شده
                    </span>
                  )}
                  {item.status === "APPROVED" && item.isAvailable && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-300 backdrop-blur-md">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                      تأیید شده
                    </span>
                  )}
                  {item.status === "APPROVED" && !item.isAvailable && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 backdrop-blur-md">
                      فروخته شده
                    </span>
                  )}
                </div>
                {item.isExclusive && (
                  <div className="absolute left-2 top-2">
                    <span className="badge bg-amber-500/10 text-amber-400 text-[10px]">
                      <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> اختصاصی
                    </span>
                  </div>
                )}
              </div>

              {/* اطلاعات */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white">
                  {item.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>{TATTOO_STYLE_LABELS[item.style] || item.style}</span>
                  <span>•</span>
                  <span>{formatPrice(item.price)}</span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> {toPersianNumbers(item.viewCount)} بازدید • {toPersianNumbers(item.soldCount)} فروخته شده
                </div>

                {/* دکمه‌ها */}
                <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
                  <button
                    onClick={() => handleToggleStatus(item.id, item.isAvailable)}
                    disabled={item.status !== "APPROVED"}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      !item.isAvailable
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {item.isAvailable ? "فروخته شد" : "موجود شد"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
