"use client";

import { useState, useMemo } from "react";
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
import { formatJalaliDate, toPersianNumbers, formatPrice, BOOKING_STATUS_LABELS } from "@/lib/utils";

type SerializedUser = {
  id: string;
  displayName: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  city: string | null;
  province: string | null;
  bio: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  totalBookings: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  artistProfile: {
    id: string;
    artistName: string;
    plan: string;
    totalEarnings: string;
    isVerified: boolean;
    city: string | null;
    shortBio: string | null;
    instagramUrl: string | null;
    telegramUrl: string | null;
    websiteUrl: string | null;
  } | null;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "مشتری",
  ARTIST: "هنرمند",
  ADMIN: "ادمین",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "فعال",
  INACTIVE: "غیرفعال",
  SUSPENDED: "مسدود",
  PENDING_VERIFICATION: "در انتظار تأیید",
};

const ROLE_OPTIONS = [
  { value: "CLIENT", label: "مشتری" },
  { value: "ARTIST", label: "هنرمند" },
  { value: "ADMIN", label: "ادمین" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "فعال" },
  { value: "INACTIVE", label: "غیرفعال" },
  { value: "SUSPENDED", label: "مسدود" },
  { value: "PENDING_VERIFICATION", label: "در انتظار تأیید" },
];

export function AdminUsersTable({ users: initialUsers }: { users: SerializedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialogs
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);

  // Form state
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Full-edit form (name, photo, city, ...)
  const [editForm, setEditForm] = useState({
    displayName: "",
    phone: "",
    email: "",
    city: "",
    province: "",
    bio: "",
    avatarUrl: "",
    firstName: "",
    lastName: "",
    artistName: "",
    artistCity: "",
    shortBio: "",
    instagramUrl: "",
    telegramUrl: "",
    websiteUrl: "",
  });

      // Create-user form
  const [createForm, setCreateForm] = useState({
    displayName: "",
    phone: "",
    email: "",
    password: "",
    role: "CLIENT",
    status: "ACTIVE",
    city: "",
    artistName: "",
  });

  const { toast } = useToast();

  const pendingArtistCount = useMemo(
    () => users.filter((u) => u.status === "PENDING_VERIFICATION" && u.role === "ARTIST").length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.artistProfile?.artistName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
        );
        toast({ title: "نقش تغییر کرد" });
        setRoleDialogOpen(false);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleStatusChange = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u))
        );
        toast({ title: "وضعیت تأیید کرد" });
        setStatusDialogOpen(false);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleApproveMembership = async (user: SerializedUser) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: "ACTIVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "ACTIVE" } : u))
        );
        toast({
          title: user.role === "ARTIST"
            ? `عضویت هنرمند "${user.displayName}" تأیید شد — اکنون در فهرست هنرمندان نمایش داده می‌شود`
            : "حساب کاربر فعال شد",
        });
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyArtist = async (user: SerializedUser) => {
    if (!user.artistProfile) return;
    setLoading(true);
    try {
      const newVerified = !user.artistProfile.isVerified;
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, verifyArtist: newVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id && u.artistProfile
              ? { ...u, artistProfile: { ...u.artistProfile, isVerified: newVerified } }
              : u
          )
        );
        toast({
          title: newVerified
            ? `هنرمند "${user.artistProfile.artistName}" تأیید شد`
            : `تأیید هنرمند "${user.artistProfile.artistName}" لغو شد`,
        });
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => [
          {
            id: data.user.id,
            displayName: data.user.displayName,
            phone: data.user.phone,
            email: null,
            role: data.user.role,
            status: data.user.status,
            city: data.user.city,
            province: null,
            bio: null,
            avatarUrl: null,
            firstName: null,
            lastName: null,
            totalBookings: 0,
            averageRating: 0,
            reviewCount: 0,
            createdAt: data.user.createdAt,
            artistProfile: data.user.role === "ARTIST" ? { id: "", artistName: createForm.artistName || data.user.displayName, plan: "FREE", totalEarnings: "0", isVerified: false, city: null, shortBio: null, instagramUrl: null, telegramUrl: null, websiteUrl: null } : null,
          },
          ...prev,
        ]);
        toast({ title: `کاربر ${data.user.displayName} با موفقیت ساخته شد` });
        setCreateDialogOpen(false);
        setCreateForm({ displayName: "", phone: "", email: "", password: "", role: "CLIENT", status: "ACTIVE", city: "", artistName: "" });
      } else {
        toast({ title: data.error || "خطا در ایجاد کاربر", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleFetchDetail = async (user: SerializedUser) => {
    setSelectedUser(user);
    setUserDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`);
      const data = await res.json();
      if (data.user) {
        setUserDetail(data.user);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setDetailLoading(false);
  };

  const handleSuspend72h = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, suspend72h: true, suspendReason }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, status: "SUSPENDED" } : u))
        );
        toast({ title: "کاربر به‌مدت ۷۲ ساعت مسدود شد" });
        setSuspendDialogOpen(false);
        setSuspendReason("");
        if (detailOpen) handleFetchDetail(selectedUser);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleUnsuspend = async (user: SerializedUser) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, unsuspend: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "ACTIVE" } : u))
        );
        toast({ title: "مسدودیت کاربر برداشته شد" });
        if (detailOpen) handleFetchDetail(user);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const openEditDialog = (user: SerializedUser) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || "",
      phone: user.phone || "",
      email: user.email || "",
      city: user.city || "",
      province: user.province || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      artistName: user.artistProfile?.artistName || "",
      artistCity: user.artistProfile?.city || "",
      shortBio: user.artistProfile?.shortBio || "",
      instagramUrl: "",
      telegramUrl: "",
      websiteUrl: "",
    });
    setEditDialogOpen(true);
  };

  const handleFullEdit = async () => {
    if (!selectedUser) return;
    if (editForm.displayName.trim().length < 2) {
      toast({ title: "نام نمایشی معتبر نیست", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          profile: {
            displayName: editForm.displayName,
            phone: editForm.phone,
            email: editForm.email || null,
            city: editForm.city || null,
            province: editForm.province || null,
            bio: editForm.bio || null,
            avatarUrl: editForm.avatarUrl || null,
            firstName: editForm.firstName || null,
            lastName: editForm.lastName || null,
            artist: selectedUser.artistProfile || editForm.artistName
              ? {
                  artistName: editForm.artistName || undefined,
                  city: editForm.artistCity || null,
                  shortBio: editForm.shortBio || null,
                  // شبکه‌های اجتماعی حذف شده‌اند؛ با هر ویرایش، مقادیر قدیمی پاک می‌شوند
                  instagramUrl: null,
                  telegramUrl: null,
                  websiteUrl: null,
                }
              : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  displayName: editForm.displayName,
                  phone: editForm.phone,
                  email: editForm.email || null,
                  city: editForm.city || null,
                  province: editForm.province || null,
                  bio: editForm.bio || null,
                  avatarUrl: editForm.avatarUrl || null,
                  firstName: editForm.firstName || null,
                  lastName: editForm.lastName || null,
                  artistProfile: u.artistProfile
                    ? { ...u.artistProfile, artistName: editForm.artistName || u.artistProfile.artistName }
                    : u.artistProfile,
                }
              : u
          )
        );
        toast({ title: "اطلاعات کاربر به‌روزرسانی شد" });
        setEditDialogOpen(false);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        toast({ title: "کاربر حذف شد" });
        setDeleteDialogOpen(false);
      } else {
        toast({ title: data.error || "خطا", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ارتباط", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filteredUsers.length} کاربر
          </p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-rose-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_-6px_rgba(231,68,68,0.5)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          کاربر جدید
        </button>
        {pendingArtistCount > 0 && (
          <button
            onClick={() => { setRoleFilter("ARTIST"); setStatusFilter("PENDING_VERIFICATION"); }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {toPersianNumbers(pendingArtistCount)} هنرمند در انتظار تأیید — مشاهده
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو (نام, تلفن, ایمیل)..."
          className="w-64 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          <option value="ALL">همه نقش‌ها</option>
          <option value="CLIENT">مشتری</option>
          <option value="ARTIST">هنرمند</option>
          <option value="ADMIN">ادمین</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="ACTIVE">فعال</option>
          <option value="INACTIVE">غیرفعال</option>
          <option value="SUSPENDED">مسدود</option>
          <option value="PENDING_VERIFICATION">در انتظار تأیید</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">نام</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">تلفن</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">نقش</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">شهر</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">رزروها</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">تاریخ عضویت</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-400">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                      کاربری یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{user.displayName}</p>
                        {user.artistProfile && (
                          <p className="text-xs text-zinc-400">@{user.artistProfile.artistName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{user.phone}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${
                          user.role === "ADMIN" ? "bg-amber-500/10 text-amber-400" :
                          user.role === "ARTIST" ? "bg-rose-500/10 text-rose-400" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${
                          user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                          user.status === "SUSPENDED" ? "bg-red-500/10 text-red-400" :
                          user.status === "INACTIVE" ? "bg-zinc-700 text-zinc-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {STATUS_LABELS[user.status] || user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{user.city || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400">{user.totalBookings}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatJalaliDate(new Date(user.createdAt), "short")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* تأیید عضویت (برای کاربران در انتظار تأیید) */}
                          {user.status === "PENDING_VERIFICATION" && (
                            <button
                              onClick={() => handleApproveMembership(user)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                              تأیید عضویت
                            </button>
                          )}
                          {/* Verify Artist button */}
                          {user.artistProfile && (
                            <button
                              onClick={() => handleVerifyArtist(user)}
                              disabled={loading}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                                user.artistProfile.isVerified
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                              }`}
                            >
                              {user.artistProfile.isVerified ? "✓ تأییدشده" : "تأیید هنرمند"}
                            </button>
                          )}
                          {/* Role change */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}
                            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-amber-500/50 hover:text-amber-400"
                          >
                            نقش
                          </button>
                          {/* Status toggle */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewStatus(user.status);
                              setStatusDialogOpen(true);
                            }}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                              user.status === "ACTIVE"
                                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            {user.status === "ACTIVE" ? "مسدود" : "فعال"}
                          </button>
                          {/* View detail */}
                          <button
                            onClick={() => handleFetchDetail(user)}
                            className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-400 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15"
                          >
                            جزئیات
                          </button>
                          {/* Full edit */}
                          <button
                            onClick={() => openEditDialog(user)}
                            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-400 transition-colors hover:bg-blue-500/20"
                          >
                            ویرایش
                          </button>
                          {/* 72h suspend / unsuspend */}
                          {user.status === "SUSPENDED" ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              disabled={loading}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            >
                              رفع مسدودیت
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setSuspendReason("");
                                setSuspendDialogOpen(true);
                              }}
                              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] text-orange-400 transition-colors hover:bg-orange-500/20"
                            >
                              مسدود ۷۲ ساعته
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                          >
                            حذف
                          </button>
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

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setUserDetail(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-white">
              جزئیات کاربر: {userDetail?.displayName || selectedUser?.displayName || ""}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <span className="text-sm">در حال بارگذاری...</span>
            </div>
          ) : userDetail ? (
            <div className="space-y-6">
              {/* اطلاعات کلی */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-400">
                    {userDetail.avatarUrl ? <img src={userDetail.avatarUrl} alt="" className="h-full w-full object-cover" /> : (userDetail.displayName?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{userDetail.displayName}</p>
                    <p className="text-[11px] text-zinc-500">عضویت: {formatJalaliDate(new Date(userDetail.createdAt), "full")}</p>
                  </div>
                  <div className="mr-auto flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs" onClick={() => { const u = users.find((x) => x.id === userDetail.id); if (u) { setDetailOpen(false); openEditDialog(u); } }}>
                      ویرایش اطلاعات
                    </Button>
                  </div>
                </div>
                {userDetail.suspension?.isTemp && userDetail.suspension.until && (
                  <div className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
                    مسدود موقت تا {formatJalaliDate(new Date(userDetail.suspension.until), "datetime")}
                    {userDetail.suspension.reason ? ` — دلیل: ${userDetail.suspension.reason}` : ""}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">نقش</span>
                    <p className="font-medium text-white">{ROLE_LABELS[userDetail.role] || userDetail.role}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">وضعیت</span>
                    <p className="font-medium text-white">
                      <Badge className={`text-xs ${userDetail.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : userDetail.status === "SUSPENDED" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {STATUS_LABELS[userDetail.status] || userDetail.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">تلفن</span>
                    <p className="font-medium text-white font-mono" dir="ltr">{userDetail.phone}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">ایمیل</span>
                    <p className="font-medium text-white">{userDetail.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">نام / نام خانوادگی</span>
                    <p className="font-medium text-white">{[userDetail.firstName, userDetail.lastName].filter(Boolean).join(" ") || "—"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">شهر / استان</span>
                    <p className="font-medium text-white">{[userDetail.city, userDetail.province].filter(Boolean).join("، ") || "—"}</p>
                  </div>
                  {userDetail.bio && (
                    <div className="col-span-2">
                      <span className="text-zinc-500">بیوگرافی</span>
                      <p className="font-medium text-white leading-relaxed">{userDetail.bio}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">تاریخ عضویت</span>
                    <p className="font-medium text-white">{formatJalaliDate(new Date(userDetail.createdAt), "full")}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">آخرین فعالیت</span>
                    <p className="font-medium text-white">{userDetail.lastSeenAt ? formatJalaliDate(new Date(userDetail.lastSeenAt), "datetime") : "—"}</p>
                  </div>
                </div>
              </div>

              {/* آمار이었다면 هنرمند */}
              {userDetail.role === "ARTIST" && userDetail.artistProfile ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-white">پروفایل هنرمند</h3>
                    {userDetail.artistProfile.isVerified && (
                      <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">اسم هنرمند</span>
                      <p className="font-medium text-white">{userDetail.artistProfile.artistName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">طرح</span>
                      <p className="font-medium text-white">{userDetail.artistProfile.plan}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">کل درآمد</span>
                      <p className="font-medium text-green-400">{formatPrice(Number(userDetail.artistProfile.totalEarnings))}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">رزروهای تکمیل‌شده</span>
                      <p className="font-medium text-white">{userDetail.totalBookings}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">امتیاز میانگین</span>
                      <p className="font-medium text-amber-400">{userDetail.averageRating.toFixed(1)} ★ ({userDetail.reviewCount} نظر)</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">درآمد از رزروها (تکمیل‌شده)</span>
                      <p className="font-medium text-emerald-400">{formatPrice(Number(userDetail.totalRevenue))}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* خلاصه مالی و نتیجه رزروها */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                  <p className="text-lg font-bold text-white">{toPersianNumbers(userDetail._count.bookingsAsClient + userDetail._count.bookingsAsArtist)}</p>
                  <p className="text-[10px] text-zinc-500">کل رزروها</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                  <p className="text-lg font-bold text-emerald-400">{formatPrice(Number(userDetail.totalRevenue || 0), false)}</p>
                  <p className="text-[10px] text-zinc-500">درآمد تکمیل‌شده (تومان)</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                  <p className="text-lg font-bold text-amber-400">{toPersianNumbers(Number(userDetail.averageRating || 0).toFixed(1))} ★</p>
                  <p className="text-[10px] text-zinc-500">{toPersianNumbers(userDetail.reviewCount || 0)} نظر</p>
                </div>
              </div>

              {/* تاریخچه رزروها (به عنوان مشتری) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  تاریخچه رزروها (به عنوان مشتری) — {toPersianNumbers(userDetail._count.bookingsAsClient)}
                </h3>
                {userDetail.bookingsAsClient && userDetail.bookingsAsClient.length > 0 ? (
                  <div className="space-y-2">
                    {userDetail.bookingsAsClient.slice(0, 10).map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/20 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate" dir="ltr">{b.bookingNumber}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{b.artist?.displayName || b.artist?.artistName} — {b.service?.name || "—"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-zinc-400">{b.scheduledDate ? formatJalaliDate(new Date(b.scheduledDate), "short") : "—"}</p>
                          <p className="text-xs font-medium text-amber-400">{b.agreedPrice ? formatPrice(Number(b.agreedPrice)) : "—"}</p>
                          <Badge className={`mt-1 inline-block text-[10px] ${b.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : b.status === "CANCELLED_BY_CLIENT" || b.status === "CANCELLED_BY_ARTIST" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {BOOKING_STATUS_LABELS[b.status] || b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">رزروی به‌عنوان مشتری ثبت نشده است.</p>
                )}
              </div>

              {/* تاریخچه رزروها (به عنوان هنرمند) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  تاریخچه رزروها (به عنوان هنرمند) — {toPersianNumbers(userDetail._count.bookingsAsArtist)}
                </h3>
                {userDetail.bookingsAsArtist && userDetail.bookingsAsArtist.length > 0 ? (
                  <div className="space-y-2">
                    {userDetail.bookingsAsArtist.slice(0, 10).map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/20 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate" dir="ltr">{b.bookingNumber}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{b.client?.displayName} — {b.service?.name || "—"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-zinc-400">{b.scheduledDate ? formatJalaliDate(new Date(b.scheduledDate), "short") : "—"}</p>
                          <p className="text-xs font-medium text-amber-400">{b.agreedPrice ? formatPrice(Number(b.agreedPrice)) : "—"}</p>
                          <Badge className={`mt-1 inline-block text-[10px] ${b.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : b.status === "CANCELLED_BY_CLIENT" || b.status === "CANCELLED_BY_ARTIST" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {BOOKING_STATUS_LABELS[b.status] || b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">رزروی به‌عنوان هنرمند ثبت نشده است.</p>
                )}
              </div>

              {/* نظرات دریافت‌شده (هنرمندان) */}
              {userDetail.reviews && userDetail.reviews.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    نظرات دریافت‌شده — {userDetail._count.reviewsReceived}
                  </h3>
                  <div className="space-y-3">
                    {userDetail.reviews.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-800/20 p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                          {r.author?.avatarUrl ? <img src={r.author.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : r.author?.displayName?.[0] || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-xs">{r.author?.displayName}</span>
                            <span className="text-[10px] text-zinc-500">{formatJalaliDate(new Date(r.createdAt), "short")}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.91-2.01L12 2z" /></svg>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{r.comment}</p>
                          {r.isVerified && (
                            <Badge className="mt-1.5 inline-block text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">تأییدشده</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="border-t border-zinc-800 pt-4">
            <Button
              variant="outline"
              onClick={() => { setDetailOpen(false); setUserDetail(null); }}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">تغییر نقش کاربر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              کاربر: <strong className="text-white">{selectedUser?.displayName}</strong>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">نقش جدید</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleRoleChange} disabled={loading} className="bg-rose-600 hover:bg-rose-700">
              {loading ? "در حال انجام..." : "تغییر نقش"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">تغییر وضعیت کاربر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              کاربر: <strong className="text-white">{selectedUser?.displayName}</strong>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">وضعیت جدید</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleStatusChange} disabled={loading} className="bg-rose-600 hover:bg-rose-700">
              {loading ? "در حال انجام..." : "تغییر وضعیت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">حذف کاربر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              آیا از حذف کاربر <strong className="text-white">{selectedUser?.displayName}</strong> مطمئن هستید?
            </p>
            <p className="text-xs text-zinc-500">
              این قابل بازگردانی نیست.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "در حال انجام..." : "حذف شود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">ایجاد کاربر جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نام نمایشی *</label>
                <input
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  placeholder="مثال: علی رضایی"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">شماره موبایل *</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="09123456789"
                  dir="ltr"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">رمز عبور *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  dir="ltr"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نقش *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                >
                  <option value="CLIENT">مشتری</option>
                  <option value="ARTIST">هنرمند</option>
                  <option value="ADMIN">ادمین</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">وضعیت</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                >
                  <option value="ACTIVE">فعال</option>
                  <option value="INACTIVE">غیرفعال</option>
                  <option value="PENDING_VERIFICATION">در انتظار تأیید</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">شهر (اختیاری)</label>
              <input
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                placeholder="مثال: تهران"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
              />
            </div>
            {createForm.role === "ARTIST" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نام هنری (اختیاری)</label>
                <input
                  value={createForm.artistName}
                  onChange={(e) => setCreateForm({ ...createForm, artistName: e.target.value })}
                  placeholder="مثال: علی نیدلز (پیش‌فرض: نام نمایشی)"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={loading || !createForm.displayName || !createForm.phone || !createForm.password}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {loading ? "در حال ایجاد..." : "ایجاد کاربر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend 72h Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">مسدودیت موقت ۷۲ ساعته</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400">
              کاربر <strong className="text-white">{selectedUser?.displayName}</strong> به‌مدت ۷۲ ساعت مسدود می‌شود و پس از پایان مهلت به‌صورت خودکار فعال می‌گردد.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">دلیل مسدودیت (اختیاری)</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="مثال: نقض قوانین، رفتار نامناسب..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleSuspend72h} disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white">
              {loading ? "در حال انجام..." : "مسدود ۷۲ ساعته"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">ویرایش کامل: {selectedUser?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نام نمایشی *</label>
                <input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">شماره موبایل *</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} dir="ltr" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">ایمیل</label>
                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} dir="ltr" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">عکس پروفایل</label>
                <div className="flex items-center gap-3">
                  {editForm.avatarUrl ? (
                    <img src={editForm.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-zinc-700 object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-500">
                      {editForm.displayName?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-blue-500/50 hover:text-blue-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      آپلود تصویر
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          const data = await res.json();
                          if (data.url) setEditForm({ ...editForm, avatarUrl: data.url });
                        } catch { /* silent */ }
                      }} />
                    </label>
                    <p className="text-[10px] text-zinc-600">یا URL وارد کنید:</p>
                    <input value={editForm.avatarUrl} onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })} dir="ltr" placeholder="https://..." className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نام</label>
                <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">نام خانوادگی</label>
                <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">شهر</label>
                <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">استان</label>
                <input value={editForm.province} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">بیوگرافی</label>
              <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            {selectedUser?.artistProfile && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">پروفایل هنرمند</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-300">نام هنری</label>
                    <input value={editForm.artistName} onChange={(e) => setEditForm({ ...editForm, artistName: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-300">شهر هنرمند</label>
                    <input value={editForm.artistCity} onChange={(e) => setEditForm({ ...editForm, artistCity: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">بیوی کوتاه هنرمند</label>
                  <textarea value={editForm.shortBio} onChange={(e) => setEditForm({ ...editForm, shortBio: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-zinc-700 text-zinc-400">
              انصراف
            </Button>
            <Button onClick={handleFullEdit} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white">
              {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
