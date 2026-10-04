"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import CropModal from "./CropModal";
import JalaliDateInput from "@/components/ui/JalaliDateInput";
import { TATTOO_STYLE_LABELS, toPersianNumbers } from "@/lib/utils";
import { getUserProfile, updateArtistProfile } from "@/services/profile.service";
import { getImageMaxMb } from "@/lib/public-settings-client";

type UserProfile = {
  id: string;
  displayName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  province: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  postalCode: string | null;
  bio: string | null;
  role: string;
};

export default function ProfileSettings({ user }: { user: UserProfile }) {
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
    const [cropOpen, setCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"avatar" | "cover">("avatar");
  const [cropSrc, setCropSrc] = useState("");
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 50 });
  const [coverPos, setCoverPos] = useState({ x: 50, y: 50 });
  const [form, setForm] = useState({
    name: user.displayName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    city: user.city || "",
    province: user.province || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    address: user.address || "",
    postalCode: user.postalCode || "",
    bio: user.bio || "",
  });

  // ─── دسته‌بندی‌های تخصصی هنرمند (حداکثر ۴) ───
  const [specs, setSpecs] = useState<string[]>([]);
  const [specsLoading, setSpecsLoading] = useState(user.role === "ARTIST");
  const [specsSaving, setSpecsSaving] = useState(false);

  useEffect(() => {
    if (user.role !== "ARTIST") return;
    getUserProfile().then((r) => {
      if (r.success && r.data?.artistProfile) {
        setSpecs(r.data.artistProfile.specializations || []);
      }
      setSpecsLoading(false);
    });
  }, [user.role]);

  const toggleSpec = (style: string) => {
    setSpecs((prev) => {
      if (prev.includes(style)) return prev.filter((s) => s !== style);
      if (prev.length >= 4) {
        toast.error("حداکثر ۴ دسته‌بندی می‌توانید انتخاب کنید");
        return prev;
      }
      return [...prev, style];
    });
  };

  const saveSpecs = async () => {
    if (specs.length === 0) {
      toast.error("حداقل یک دسته‌بندی انتخاب کنید");
      return;
    }
    setSpecsSaving(true);
    try {
      const r = await updateArtistProfile({ styles: specs });
      if (r.success) toast.success("دسته‌بندی‌ها ذخیره شد — در پروفایل عمومی و فیلترها اعمال می‌شود");
      else toast.error((r as any).message || "خطا در ذخیره");
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSpecsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // محدودیت حجم از تنظیمات ادمین خوانده می‌شود (پیش‌تر هاردکد ۱۰ مگابایت بود)
      const limitMb = await getImageMaxMb();
      if (file.size > limitMb * 1024 * 1024) {
        toast.error(`حجم فایل بیشتر از ${toPersianNumbers(limitMb)} مگابایت است`);
        e.target.value = "";
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const limitMb = await getImageMaxMb();
      if (file.size > limitMb * 1024 * 1024) {
        toast.error(`حجم فایل بیشتر از ${toPersianNumbers(limitMb)} مگابایت است`);
        e.target.value = "";
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // آپلود یک تصویر و برگرداندن URL آن؛ در صورت خطا پیام مناسب نمایش داده می‌شود
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        toast.error(uploadData.error || "خطا در آپلود تصویر. فرمت یا حجم فایل مجاز نیست");
        return null;
      }
      return uploadData.url as string;
    } catch {
      toast.error("خطا در آپلود تصویر");
      return null;
    }
  };

  
  const handleCropConfirm = (position: { x: number; y: number }) => {
    if (cropTarget === "avatar") {
      setAvatarPos(position);
      setAvatarPreview(cropSrc);
    } else {
      setCoverPos(position);
      setCoverPreview(cropSrc);
    }
    setCropOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl;
      let coverUrl = user.coverUrl;

      // ابتدا تصویر پروفایل (در صورت انتخاب) را آپلود کن؛ اگر ناموفق بود بدون ذخیره متوقف شو
      if (avatarFile) {
        const uploaded = await uploadImage(avatarFile);
        if (!uploaded) {
          setSaving(false);
          return;
        }
        avatarUrl = uploaded;
      }

      // سپس تصویر کاور (در صورت انتخاب) را آپلود کن
      if (coverFile) {
        const uploaded = await uploadImage(coverFile);
        if (!uploaded) {
          setSaving(false);
          return;
        }
        coverUrl = uploaded;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(coverUrl ? { coverUrl } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success(data.message || "پروفایل ذخیره شد");
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.message || "خطا در ذخیره‌سازی");
      }
    } catch {
      toast.error("خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">ویرایش اطلاعات</h1>
        <p className="mt-1 text-sm text-zinc-400">اطلاعات پروفایل خود را ویرایش کنید</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">تصویر پروفایل</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 text-3xl font-bold text-zinc-500">
              {avatarPreview || user.avatarUrl ? (
                <img src={avatarPreview || user.avatarUrl || ""} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${avatarPos.x}% ${avatarPos.y}%` }} />
              ) : (
                user.displayName?.[0] || "?"
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-colors hover:bg-rose-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.displayName}</p>
            <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WebP · حداکثر ۱۰ مگابایت</p>
            {avatarFile && <p className="text-xs text-green-400 mt-1">فایل انتخاب شد: {avatarFile.name}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">تصویر کاور</h3>
        <div className="relative h-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800/50">
          {coverPreview || user.coverUrl ? (
            <img src={coverPreview || user.coverUrl || ""} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${coverPos.x}% ${coverPos.y}%` }} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-600">تصویر کاور اضافه کنید</div>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            تغییر کاور
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">اطلاعات شخصی</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditField label="نام نمایشی" value={form.name} onChange={(v) => handleChange("name", v)} />
          <EditField label="نام" value={form.firstName} onChange={(v) => handleChange("firstName", v)} />
          <EditField label="نام خانوادگی" value={form.lastName} onChange={(v) => handleChange("lastName", v)} />
          <EditField label="ایمیل" value={form.email} onChange={(v) => handleChange("email", v)} dir="ltr" />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">تاریخ تولد (شمسی)</label>
            <JalaliDateInput value={form.dateOfBirth} onChange={(v) => handleChange("dateOfBirth", v)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">جنسیت</label>
            <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50">
              <option value="">انتخاب کنید</option>
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
              <option value="OTHER">سایر</option>
            </select>
          </div>
          <EditField label="شهر"
 value={form.city} onChange={(v) => handleChange("city", v)} />
          <EditField label="استان" value={form.province} onChange={(v) => handleChange("province", v)} />
          <EditField label="آدرس" value={form.address} onChange={(v) => handleChange("address", v)} />
          <EditField label="کد پستی" value={form.postalCode} onChange={(v) => handleChange("postalCode", v)} dir="ltr" />
        </div>
      </div>

      {user.role === "ARTIST" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">دسته‌بندی‌های تخصصی</h3>
            <span className="text-xs text-zinc-500">{toPersianNumbers(specs.length)}/۴</span>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-zinc-500">
            حداکثر ۴ دسته انتخاب کنید. همین‌ها در پروفایل عمومی شما نمایش داده می‌شوند و فیلترهای جستجو بر اساس آن‌ها شما را پیدا می‌کنند.
          </p>
          {specsLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-zinc-800/50" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(TATTOO_STYLE_LABELS).map(([key, label]) => {
                const active = specs.includes(key);
                const full = specs.length >= 4 && !active;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={full}
                    onClick={() => toggleSpec(key)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-40 ${
                      active
                        ? "border-rose-500 bg-rose-500/15 text-rose-300"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={saveSpecs}
            disabled={specsSaving || specsLoading}
            className="mt-4 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          >
            {specsSaving ? "در حال ذخیره..." : "ذخیره دسته‌بندی‌ها"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">درباره من</h3>
        <textarea
          value={form.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50 resize-none"
          placeholder="یک معرفی کوتاه از خودتان بنویسید..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-rose-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-rose-500 disabled:opacity-50"
        >
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    
      <CropModal
        open={cropOpen}
        onClose={() => setCropOpen(false)}
        onConfirm={handleCropConfirm}
        imageSrc={cropSrc}
        aspect={cropTarget === "avatar" ? "1:1" : "16:9"}
        title={cropTarget === "avatar" ? "برش تصویر پروفایل" : "برش تصویر کاور"}
      />
</div>
  );
}

function EditField({ label, value, onChange, type, dir }: { label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50"
      />
    

</div>
  );
}
