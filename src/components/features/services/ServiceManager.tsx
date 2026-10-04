"use client";

// ============================================================================
// مدیریتگر سرویس‌ها و قیمت‌گذاری هنرمند
// ============================================================================

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
} from "@/services/service-manager";
import { TATTOO_SIZE_LABELS, formatPrice, toPersianNumbers } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: bigint;
  maxPrice: bigint | null;
  durationMinutes: number;
  supportedSizes: string[];
  isActive: boolean;
  bookingCount: number;
  depositType: string;
  depositValue: bigint;
  createdAt: Date;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  basePrice: "",
  maxPrice: "",
  durationMinutes: "120",
  supportedSizes: [] as string[],
};

// ============================================================================
// کامپوننت
// ============================================================================

export default function ServiceManager() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const result = await getMyServices();
      if (result.success && result.data) {
        setItems(result.data.items as ServiceItem[]);
        setMaxAllowed(result.data.maxAllowed);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // باز کردن فرم ویرایش
  const openEdit = (item: ServiceItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      basePrice: String(item.basePrice),
      maxPrice: item.maxPrice ? String(item.maxPrice) : "",
      durationMinutes: String(item.durationMinutes),
      supportedSizes: [...item.supportedSizes],
    });
  };

  // بستن فرم
  const closeForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  // تغییر سایز انتخابی
  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      supportedSizes: prev.supportedSizes.includes(size)
        ? prev.supportedSizes.filter((s) => s !== size)
        : [...prev.supportedSizes, size],
    }));
  };

  // ذخیره
  const handleSave = async () => {
    if (!form.name || !form.basePrice || !form.durationMinutes) {
      toast.error("فیلدهای الزامی را پر کنید");
      return;
    }
    if (form.supportedSizes.length === 0) {
      toast.error("حداقل یک اندازه انتخاب کنید");
      return;
    }

    setSaving(true);
    try {
      const input = {
        name: form.name,
        description: form.description || undefined,
        basePrice: parseInt(form.basePrice),
        maxPrice: form.maxPrice ? parseInt(form.maxPrice) : undefined,
        durationMinutes: parseInt(form.durationMinutes),
        supportedSizes: form.supportedSizes,
      };

      let result;
      if (editId) {
        result = await updateService(editId, input);
      } else {
        result = await createService(input);
      }

      if (result.success) {
        toast.success(result.message || "موفقیت");
        closeForm();
        fetchServices();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  // حذف
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این سرویس مطمئن هستید؟")) return;
    try {
      const result = await deleteService(id);
      if (result.success) {
        toast.success(result.message || "حذف شد");
        fetchServices();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا در حذف");
    }
  };

  // تغییر وضعیت
  const handleToggle = async (id: string, current: boolean) => {
    try {
      const result = await toggleServiceActive(id, !current);
      if (result.success) {
        toast.success(result.message || "تغییر وضعیت");
        fetchServices();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا");
    }
  };

  const canAdd = items.length < maxAllowed && !editId;

  return (
    <div className="space-y-6">
      {/* نوار ابزار */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {canAdd && (
            <button
              onClick={() => { closeForm(); setEditId(null); }}
              className="btn-primary text-sm"
            >
              + سرویس جدید
            </button>
          )}
          {editId && (
            <button onClick={closeForm} className="btn-ghost text-sm">
              انصراف
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {toPersianNumbers(items.length)} از {toPersianNumbers(maxAllowed)} سرویس
        </p>
      </div>

      {/* فرم ایجاد/ویرایش */}
      {(editId || (!editId && items.length < maxAllowed)) && !editId && items.length < maxAllowed && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="mb-4 text-base font-semibold text-white">
            سرویس جدید
          </h3>
          <ServiceForm form={form} setForm={setForm} toggleSize={toggleSize} onSave={handleSave} saving={saving} />
        </div>
      )}

      {editId && (
        <div className="rounded-xl border border-amber-500/20 bg-zinc-900/80 p-6">
          <h3 className="mb-4 text-base font-semibold text-amber-400">
            ویرایش سرویس
          </h3>
          <ServiceForm form={form} setForm={setForm} toggleSize={toggleSize} onSave={handleSave} saving={saving} />
        </div>
      )}

      {/* لودینگ */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      )}

      {/* لیست سرویس‌ها */}
      {!loading && items.length === 0 && !editId && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 py-16 text-center">
          <span className="text-4xl">💰</span>
          <p className="mt-3 text-sm text-zinc-500">هنوز سرویسی تعریف نشده</p>
          <button onClick={() => {}} className="mt-4 btn-primary text-sm">
            اولین سرویس را اضافه کنید
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border bg-zinc-900/80 p-5 transition-all ${
                item.isActive
                  ? "border-zinc-800 hover:border-zinc-700"
                  : "border-zinc-800/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    {!item.isActive && (
                      <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400">
                        غیرفعال
                      </span>
                    )}
                    {item.bookingCount > 0 && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                        {toPersianNumbers(item.bookingCount)} رزرو
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="font-semibold text-amber-400">{formatPrice(item.basePrice)}</span>
                    {item.maxPrice && (
                      <span>تا {formatPrice(item.maxPrice)}</span>
                    )}
                    <span>{toPersianNumbers(item.durationMinutes)} دقیقه</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.supportedSizes.map((s) => (
                      <span key={s} className="rounded border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                        {TATTOO_SIZE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleToggle(item.id, item.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      item.isActive
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "bg-zinc-700/30 text-zinc-400 hover:bg-zinc-700/50"
                    }`}
                  >
                    {item.isActive ? "فعال" : "غیرفعال"}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20"
                  >
                    ویرایش
                  </button>
                  {item.bookingCount === 0 && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// فرم سرویس (مشترک برای ایجاد و ویرایش)
// ============================================================================

function ServiceForm({
  form,
  setForm,
  toggleSize,
  onSave,
  saving,
}: {
  form: typeof EMPTY_FORM;
  setForm: (fn: (prev: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void;
  toggleSize: (size: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">نام سرویس *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input-field text-sm"
            placeholder="مثال: پرتره رئالیسم"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">مدت زمان (دقیقه) *</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))}
            className="input-field text-sm"
            min={30}
            max={480}
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">قیمت پایه (تومان) *</label>
          <input
            type="number"
            value={form.basePrice}
            onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
            className="input-field text-sm"
            placeholder="5000000"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">حداکثر قیمت (تومان)</label>
          <input
            type="number"
            value={form.maxPrice}
            onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))}
            className="input-field text-sm"
            placeholder="اختیاری"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">توضیحات</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="input-field text-sm"
          rows={2}
          placeholder="توضیحات این سرویس..."
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-zinc-400">اندازه‌های پشتیبانی شده *</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TATTOO_SIZE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSize(key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                form.supportedSizes.includes(key)
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={onSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          {saving ? "در حال ذخیره..." : "ذخیره سرویس"}
        </button>
      </div>
    </div>
  );
}
