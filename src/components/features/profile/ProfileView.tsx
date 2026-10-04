"use client";

import { useState, useEffect, useRef } from "react";
import ProfileSettings from "./ProfileSettings";

type UserData = {
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

type Booking = {
  id: string;
  title: string;
  status: string;
  scheduledDate: string;
  artistName: string;
  studioName: string | null;
  style: string | null;
  images: string[];
  completedAt: string | null;
};

type ProfileViewProps = {
  user: UserData;
  bookings?: Booking[];
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
      <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
function ProfileHeader({ user, roleLabel, bgClass }: { user: UserData; roleLabel: string; bgClass: string }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (coverRef.current) {
        const rect = coverRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = user.displayName?.[0] || "?";
  return (
    <div>
      <div ref={coverRef} className="relative h-40 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
        {user.coverUrl ? (
          <img src={user.coverUrl} alt="" className="h-full w-full object-cover" style={{ transform: `translateY(${scrollY * 0.15}px) scale(1.1)`, willChange: "transform" }} />
        ) : (
          <div className={"h-full " + bgClass} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
      </div>
      <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-16 relative z-10 px-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-800 shadow-xl">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-zinc-500">{initials}</div>}
        </div>
        <div className="pb-1 text-center sm:text-right">
          <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
          <div className="mt-1 flex items-center gap-2 justify-center sm:justify-start">
            <span className="rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-medium text-rose-400">{roleLabel}</span>
            {user.city && <span className="text-xs text-zinc-500">{user.city}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
function SecurityCard({ phone }: { phone: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h3 className="text-sm font-semibold text-white mb-3">امنیت</h3>
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3">
        <div><p className="text-sm font-medium text-white">شماره موبایل</p><p className="text-xs text-zinc-500" dir="ltr">{phone}</p></div>
        <span className="text-xs text-green-400">تأیید شده ✓</span>
      </div>
    </div>
  );
}

function DoneTattoos({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">تتوهای انجام شده</h3>
      {bookings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{b.title}</span>
                <span className="text-[10px] text-emerald-400">✓ انجام شده</span>
              </div>
              {b.images[0] && <img src={b.images[0]} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{b.artistName}</span>
                {b.studioName && <span>· {b.studioName}</span>}
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{new Date(b.scheduledDate).toLocaleDateString("fa-IR")}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-zinc-500">هنوز تتوی انجام شده‌ای ثبت نشده</p>}
    </div>
  );
}
export default function ProfileView({ user, bookings }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditing(false)} className="mb-6 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          بازگشت به پروفایل
        </button>
        <ProfileSettings user={user} />
      </div>
    );
  }

  const editBtn = (color: string) => (
    <div className="flex justify-end mb-6">
      <button onClick={() => setEditing(true)} className={"flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium backdrop-blur-sm transition-all hover:shadow-lg " + color}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        ویرایش اطلاعات
      </button>
    </div>
  );

  const infoCards = (
    <div className="grid gap-3 sm:grid-cols-2">
      <InfoCard label="شماره موبایل" value={user.phone} />
      <InfoCard label="ایمیل" value={user.email || "—"} />
      <InfoCard label="نام نمایشی" value={user.displayName} />
      <InfoCard label="شهر" value={user.city || "—"} />
    </div>
  );

  const bioSection = (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h3 className="text-xs font-medium text-zinc-500 mb-2">درباره من</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">{user.bio || "هنوز بیویی ثبت نشده"}</p>
    </div>
  );

  if (user.role === "ADMIN") {
    return (<div className="space-y-4">{editBtn("bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25 hover:text-amber-300")}<ProfileHeader user={user} roleLabel="مدیر سیستم" bgClass="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10" />{infoCards}{bioSection}<SecurityCard phone={user.phone} /></div>);
  }

  if (user.role === "ARTIST") {
    return (<div className="space-y-4">{editBtn("bg-rose-500/15 border-rose-500/25 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300")}<ProfileHeader user={user} roleLabel="هنرمند" bgClass="bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-amber-500/10" />{infoCards}{bioSection}<SecurityCard phone={user.phone} /></div>);
  }

  const completedBookings = (bookings || []).filter(b => b.status === "COMPLETED");
  return (<div className="space-y-4">{editBtn("bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300")}<ProfileHeader user={user} roleLabel="مشتری" bgClass="bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10" />{infoCards}{completedBookings.length > 0 && <DoneTattoos bookings={completedBookings} />}{bioSection}<SecurityCard phone={user.phone} /></div>);
}
