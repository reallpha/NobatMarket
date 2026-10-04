"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface StudioArtistMember {
  studioArtistId: string;
  artistProfileId: string;
  name: string;
  avatarUrl: string | null;
  share: number;
}

interface Studio {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string | null;
  coverImage: string | null;
  fullDescription: string | null;
  phone: string;
  email: string | null;
  description: string | null;
  address: string;
  isActive: boolean;
  isVerified: boolean;
  instagramUrl: string | null;
  telegramUrl: string | null;
  websiteUrl: string | null;
  artists: StudioArtistMember[];
  totalBookings: number;
  totalRevenue: number;
}

interface AvailableArtist {
  artistProfileId: string;
  artistName: string;
  avatarUrl: string | null;
  displayName: string;
  status: string;
  studioId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "مسدود",
  INACTIVE: "غیرفعال",
  PENDING: "در انتظار تایید",
};

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [availableArtists, setAvailableArtists] = useState<AvailableArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean;
    studio: Studio | null;
  }>({ open: false, studio: null });
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    city: "",
    province: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    fullDescription: "",
    coverImage: "",
    instagramUrl: "",
    telegramUrl: "",
    websiteUrl: "",
  });
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Member add state
  const [memberArtistId, setMemberArtistId] = useState("");
  const [memberShare, setMemberShare] = useState("30");
  const [memberBusy, setMemberBusy] = useState(false);

  const { toast } = useToast();

  const fetchStudios = useCallback(async (): Promise<{
    studios: Studio[];
    availableArtists: AvailableArtist[];
  } | null> => {
    try {
      const res = await fetch("/api/admin/studios");
      if (res.ok) {
        const data = await res.json();
        const list = (data.studios || []) as Studio[];
        const artists = (data.availableArtists || []) as AvailableArtist[];
        setStudios(list);
        setAvailableArtists(artists);
        setLoading(false);
        return { studios: list, availableArtists: artists };
      }
    } catch {
      // Fallback to empty
    }
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    fetchStudios();
  }, [fetchStudios]);

  const resetForm = () => {
    setForm({
      name: "",
      city: "",
      province: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      fullDescription: "",
      coverImage: "",
      instagramUrl: "",
      telegramUrl: "",
      websiteUrl: "",
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
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
    setCoverUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const renderCoverUpload = () => (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-300">تصویر استودیو (کاور)</label>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            placeholder="URL تصویر یا آپلود کنید..."
            dir="ltr"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-rose-500/50 hover:text-rose-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
          {coverUploading ? "در حال آپلود..." : "آپلود"}
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
        </label>
      </div>
      {form.coverImage && (
        <div className="relative mt-2">
          <img src={form.coverImage} alt="پیش‌نمایش کاور" className="h-28 w-full rounded-lg object-cover" />
          <button
            onClick={() => setForm({ ...form, coverImage: "" })}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 hover:text-red-400"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
          </button>
        </div>
      )}
    </div>
  );

  const handleCreate = async () => {
    if (!form.name || !form.city || !form.address || !form.phone) {
      toast({ title: "لطفاً تمام فیلدها را پر کنید", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, instagramUrl: null, telegramUrl: null, websiteUrl: null }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "استودیو ساخته شد" });
        resetForm();
        setCreateDialogOpen(false);
        fetchStudios();
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedStudio) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/studios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId: selectedStudio.id, ...form, instagramUrl: null, telegramUrl: null, websiteUrl: null }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "استودیو به‌روزرسانی شد" });
        setEditDialogOpen(false);
        fetchStudios();
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedStudio) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/studios?studioId=${selectedStudio.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "استودیو حذف شد" });
        setDeleteDialogOpen(false);
        fetchStudios();
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleToggleVerified = async (studio: Studio) => {
    try {
      const res = await fetch("/api/admin/studios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId: studio.id, isVerified: !studio.isVerified }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudios();
      }
    } catch {
      // silent
    }
  };

  const handleToggleActive = async (studio: Studio) => {
    try {
      const res = await fetch("/api/admin/studios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId: studio.id, isActive: !studio.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudios();
      }
    } catch {
      // silent
    }
  };

  const handleAddMember = async () => {
    const studio = membersDialog.studio;
    if (!studio || !memberArtistId) {
      toast({ title: "یک هنرمند را انتخاب کنید", variant: "destructive" });
      return;
    }
    const share = Number(memberShare);
    if (Number.isNaN(share) || share < 0 || share > 100) {
      toast({ title: "درصد سهم باید بین ۰ تا ۱۰۰ باشد", variant: "destructive" });
      return;
    }
    setMemberBusy(true);
    try {
      const res = await fetch("/api/admin/studios/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: studio.id,
          artistProfileId: memberArtistId,
          studioSharePercent: share,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "هنرمند به استودیو اضافه شد" });
        setMemberArtistId("");
        setMemberShare("30");
        const fresh = await fetchStudios();
        if (fresh) {
          setMembersDialog((d) => ({ ...d, studio: fresh.studios.find((s) => s.id === studio.id) || studio }));
        }
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setMemberBusy(false);
  };

  const handleRemoveMember = async (artistProfileId: string) => {
    const studio = membersDialog.studio;
    if (!studio) return;
    setMemberBusy(true);
    try {
      const res = await fetch(
        `/api/admin/studios/artists?studioId=${studio.id}&artistProfileId=${artistProfileId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "هنرمند از استودیو حذف شد" });
        const fresh = await fetchStudios();
        if (fresh) {
          setMembersDialog((d) => ({ ...d, studio: fresh.studios.find((s) => s.id === studio.id) || studio }));
        }
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setMemberBusy(false);
  };

  const openMembersDialog = (studio: Studio) => {
    setMembersDialog({ open: true, studio });
    setMemberArtistId("");
    setMemberShare("30");
  };

  // هنرمندانی که هنوز عضو این استودیو نیستند
  const candidates = membersDialog.studio
    ? availableArtists.filter(
        (a) => !membersDialog.studio!.artists.some((m) => m.artistProfileId === a.artistProfileId)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت استودیوها</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {studios.length} استودیو
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-rose-600 hover:bg-rose-700">
          + استودیو جدید
        </Button>
      </div>

      {/* Studios Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-800/30" />
          ))}
        </div>
      ) : studios.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          استودیویی ثبت نشده است.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => (
            <Card key={studio.id} className="overflow-hidden border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700">
              {/* Cover */}
              <div className="relative h-32 w-full overflow-hidden bg-zinc-800">
                {studio.coverImage ? (
                  <img
                    src={studio.coverImage}
                    alt={studio.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <span className="text-3xl font-bold text-zinc-700">{studio.name[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  {studio.isVerified && (
                    <Badge className="bg-blue-500/90 text-white text-[10px]">تأییدشده</Badge>
                  )}
                  {!studio.isActive && (
                    <Badge className="bg-red-500/90 text-white text-[10px]">غیرفعال</Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-white">{studio.name}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {studio.city}
                    {studio.province && studio.province !== studio.city ? `، ${studio.province}` : ""} • {studio.address}
                  </p>
                </div>

                {studio.description && (
                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-zinc-400">{studio.description}</p>
                )}

                {/* Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
                    <p className="text-base font-bold text-white">{studio.artists.length}</p>
                    <p className="text-[10px] text-zinc-500">هنرمند</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
                    <p className="text-base font-bold text-white">{studio.totalBookings}</p>
                    <p className="text-[10px] text-zinc-500">رزرو</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
                    <p className="text-base font-bold text-emerald-400">{studio.totalRevenue.toLocaleString("fa-IR")}</p>
                    <p className="text-[10px] text-zinc-500">تومان درآمد</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="mb-4 space-y-1 text-xs text-zinc-500">
                  <p>تلفن: {studio.phone}</p>
                  {studio.email && <p className="truncate">ایمیل: {studio.email}</p>}
                </div>

                {/* Artists */}
                {studio.artists.length > 0 && (
                  <div className="mb-4 border-t border-zinc-800 pt-3">
                    <p className="mb-1.5 text-[10px] font-medium text-zinc-500">هنرمندان:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {studio.artists.map((a) => (
                        <span key={a.studioArtistId} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 py-0.5 pl-2 pr-0.5 text-[10px] text-zinc-300">
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[8px] font-bold text-zinc-400">
                              {a.name[0]}
                            </span>
                          )}
                          {a.name}
                          <span className="text-zinc-500">({a.share}٪)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-3">
                  {studio.slug && (
                    <a
                      href={`/studios/${studio.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-400 transition-colors hover:bg-amber-500/15"
                    >
                      مشاهده صفحه
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedStudio(studio);
                      setForm({
                        name: studio.name,
                        city: studio.city,
                        province: studio.province || "",
                        address: studio.address,
                        phone: studio.phone,
                        email: studio.email || "",
                        description: studio.description || "",
                        fullDescription: studio.fullDescription || "",
                        coverImage: studio.coverImage || "",
                        instagramUrl: "",
                        telegramUrl: "",
                        websiteUrl: "",
                      });
                      setEditDialogOpen(true);
                    }}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-rose-500/50 hover:text-rose-400"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => openMembersDialog(studio)}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-400 transition-colors hover:bg-amber-500/15"
                  >
                    هنرمندان ({studio.artists.length})
                  </button>
                  <button
                    onClick={() => handleToggleVerified(studio)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                      studio.isVerified
                        ? "border-blue-500/30 bg-blue-500/5 text-blue-400"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-blue-500/50 hover:text-blue-400"
                    }`}
                  >
                    {studio.isVerified ? "تأیید شده" : "تأیید"}
                  </button>
                  <button
                    onClick={() => handleToggleActive(studio)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                      studio.isActive
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-400"
                    }`}
                  >
                    {studio.isActive ? "فعال" : "غیرفعال"}
                  </button>
                  <button
                    onClick={() => { setSelectedStudio(studio); setDeleteDialogOpen(true); }}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                  >
                    حذف
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">استودیو جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {renderCoverUpload()}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">نام استودیو *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="مثل، استودیو نوبت مارکت" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">شهر *</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="تهران" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">استان</label>
                <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="تهران" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">تلفن *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="021-XXXXXXXX" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">آدرس *</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="خیابان اصفهان..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">ایمیل</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="info@studio.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">توضیحات کوتاه</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="درباره استودیو..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">توضیحات کامل</label>
              <textarea value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" placeholder="توضیحات کامل درباره استودیو..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-rose-600 hover:bg-rose-700">
              {submitting ? "در حال..." : "ساختن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">ویرایش استودیو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {renderCoverUpload()}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">نام</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">شهر</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">استان</label>
                <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">تلفن</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">آدرس</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">ایمیل</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">توضیحات کوتاه</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">توضیحات کامل</label>
              <textarea value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleEdit} disabled={submitting} className="bg-rose-600 hover:bg-rose-700">
              {submitting ? "در حال..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Management Dialog */}
      <Dialog
        open={membersDialog.open}
        onOpenChange={(open) => setMembersDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              هنرمندان استودیو: {membersDialog.studio?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-4 overflow-y-auto py-4">
            {/* Current members */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">
                اعضای فعلی ({membersDialog.studio?.artists.length || 0})
              </p>
              {membersDialog.studio && membersDialog.studio.artists.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
                  هنرمندی به این استودیو اضافه نشده است.
                </p>
              ) : (
                <div className="space-y-2">
                  {membersDialog.studio?.artists.map((m) => (
                    <div
                      key={m.studioArtistId}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/40 px-3 py-2"
                    >
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                          {m.name[0]}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{m.name}</p>
                        <p className="text-[10px] text-zinc-500">سهم استودیو: {m.share}٪</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m.artistProfileId)}
                        disabled={memberBusy}
                        className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add member */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="mb-2 text-xs font-medium text-zinc-400">افزودن هنرمند به استودیو</p>
              {candidates.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-800 py-4 text-center text-xs text-zinc-500">
                  همه هنرمندان عضو این استودیو هستند.
                </p>
              ) : (
                <div className="space-y-2.5">
                  <select
                    value={memberArtistId}
                    onChange={(e) => setMemberArtistId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                  >
                    <option value="">انتخاب هنرمند...</option>
                    {candidates.map((a) => (
                      <option key={a.artistProfileId} value={a.artistProfileId}>
                        {a.artistName}
                        {a.studioId ? " (عضو استودیو دیگر)" : ""}
                        {a.status && a.status !== "ACTIVE" ? ` (${STATUS_LABELS[a.status] || a.status})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] text-zinc-500">درصد سهم استودیو</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={memberShare}
                        onChange={(e) => setMemberShare(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <Button
                      onClick={handleAddMember}
                      disabled={memberBusy || !memberArtistId}
                      className="mt-4 bg-rose-600 hover:bg-rose-700"
                    >
                      افزودن
                    </Button>
                  </div>
                  {candidates.some((a) => a.studioId) && (
                    <p className="text-[10px] leading-relaxed text-amber-500/80">
                      در صورت انتخاب هنرمندی که عضو استودیوی دیگری است، او به‌صورت خودکار از استودیوی قبلی به این استودیو منتقل می‌شود.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialog((d) => ({ ...d, open: false }))} className="border-zinc-700 text-zinc-400">
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">حذف استودیو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              آیا از حذف استودیو <strong className="text-white">{selectedStudio?.name}</strong> مطمئن هستید؟
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
              {submitting ? "در حال..." : "حذف شود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
