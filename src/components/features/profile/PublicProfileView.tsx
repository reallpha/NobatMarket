"use client";

type PublicUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  city: string | null;
  role: string;
  createdAt: string;
};

type PublicProfileProps = {
  user: PublicUser;
  isOwn: boolean;
  artistSlug?: string | null;
  completedCount?: number;
};

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN: { label: "مدیر سیستم", cls: "bg-amber-500/15 text-amber-400" },
    ARTIST: { label: "هنرمند", cls: "bg-rose-500/15 text-rose-400" },
    CLIENT: { label: "مشتری", cls: "bg-emerald-500/15 text-emerald-400" },
  };
  const r = map[role] || map.CLIENT;
  return <span className={"rounded-full px-3 py-0.5 text-xs font-medium " + r.cls}>{r.label}</span>;
}

export default function PublicProfileView({ user, isOwn, artistSlug, completedCount }: PublicProfileProps) {
  const initials = user.displayName?.[0] || "?";

  return (
    <div className="space-y-4">
      {/* Cover */}
      <div className="relative h-48 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
        {user.coverUrl ? (
          <img src={user.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-amber-500/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-16 relative z-10 px-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-800 shadow-xl">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl font-bold text-zinc-500">{initials}</div>
          )}
        </div>
        <div className="pb-1 text-center sm:text-right">
          <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
          <div className="mt-1 flex items-center gap-2 justify-center sm:justify-start">
            <RoleBadge role={user.role} />
            {user.city && <span className="text-xs text-zinc-500">{user.city}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {user.role === "ARTIST" && artistSlug && (
          <a href={"/artists/" + artistSlug} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-center transition-colors hover:bg-zinc-800/60">
            <p className="text-lg font-bold text-rose-400">مشاهده پورتفولیو</p>
            <p className="text-xs text-zinc-500 mt-1">نمونه کارها و سبک‌ها</p>
          </a>
        )}
        {user.role === "CLIENT" && completedCount !== undefined && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{completedCount}</p>
            <p className="text-xs text-zinc-500 mt-1">تتوی انجام شده</p>
          </div>
        )}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-center">
          <p className="text-lg font-bold text-white">{new Date(user.createdAt).toLocaleDateString("fa-IR")}</p>
          <p className="text-xs text-zinc-500 mt-1">عضو از</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
          <h3 className="text-xs font-medium text-zinc-500 mb-2">درباره</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{user.bio}</p>
        </div>
      )}

      {/* Own profile link */}
      {isOwn && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <a href={user.role === "ADMIN" ? "/admin/profile" : user.role === "ARTIST" ? "/artist/profile" : "/client/profile"} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">
            رفتن به پروفایل خودم برای ویرایش →
          </a>
        </div>
      )}
    </div>
  );
}
