"use client";

// ============================================================================
// مدیریتگر در دسترسی (Client Component)
// برنامه هفتگی + مرخصی‌ها
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getMySchedule,
  updateWeeklySchedule,
  addTimeOff,
  deleteTimeOff,
} from "@/services/availability.service";
import { DAY_OF_WEEK_LABELS, formatJalaliDate, toPersianNumbers } from "@/lib/utils";
import JalaliDateInput from "@/components/ui/JalaliDateInput";
import jalaali from "jalaali-js";

// ============================================================================
// ثابت‌ها
// ============================================================================

const DAYS_ORDER = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export default function AvailabilityManager() {
  const [schedule, setSchedule] = useState<Record<string, { start: string; end: string; active: boolean }>>({});
  const [timeOffs, setTimeOffs] = useState<{ id: string; startDate: string; endDate: string; title: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // فرم مرخصی
  const [timeOffStart, setTimeOffStart] = useState("");
  const [timeOffEnd, setTimeOffEnd] = useState("");
  const [timeOffTitle, setTimeOffTitle] = useState("");

  const fetchSchedule = useCallback(async () => {
    try {
      const result = await getMySchedule();
      if (result.success && result.data && result.data.availabilities) {
        const data = result.data;
        // تبدیل به فرمت محلی
        const sched: Record<string, { start: string; end: string; active: boolean }> = {};
        DAYS_ORDER.forEach((day) => {
          const avail = data.availabilities.find((a) => a.dayOfWeek === day);
          sched[day] = {
            start: avail?.startTime || "10:00",
            end: avail?.endTime || "18:00",
            active: avail?.isActive ?? false,
          };
        });
        setSchedule(sched);
        setTimeOffs(
          (data.timeOffs || []).map((t) => ({
            id: t.id,
            startDate: t.startDate.toString(),
            endDate: t.endDate.toString(),
            title: t.title,
          }))
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // تغییر وضعیت یک روز
  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  // تغییر ساعت
  const updateDayTime = (day: string, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // ذخیره برنامه
  const handleSave = async () => {
    setSaving(true);
    try {
      const availabilities = DAYS_ORDER.map((day) => ({
        dayOfWeek: day,
        startTime: schedule[day].start,
        endTime: schedule[day].end,
        isActive: schedule[day].active,
      }));

      const result = await updateWeeklySchedule(availabilities);
      if (result.success) {
        toast.success("برنامه ذخیره شد");
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  // اضافه کردن مرخصی
  const handleAddTimeOff = async () => {
    if (!timeOffStart || !timeOffEnd) {
      toast.error("تاریخ شروع و پایان را وارد کنید");
      return;
    }

    try {
      const result = await addTimeOff({
        startDate: timeOffStart,
        endDate: timeOffEnd,
        title: timeOffTitle || undefined,
      });

      if (result.success) {
        toast.success("مرخصی اضافه شد");
        setTimeOffStart("");
        setTimeOffEnd("");
        setTimeOffTitle("");
        fetchSchedule();
      } else {
        toast.error(result.message || "خطا");
      }
    } catch {
      toast.error("خطا");
    }
  };

  // حذف مرخصی
  const handleDeleteTimeOff = async (id: string) => {
    try {
      const result = await deleteTimeOff(id);
      if (result.success) {
        toast.success("مرخصی حذف شد");
        fetchSchedule();
      }
    } catch {
      toast.error("خطا");
    }
  };

  if (loading) {
    return <div className="skeleton h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* ─── برنامه هفتگی ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          برنامه کاری هفتگی
        </h2>

        <div className="space-y-3">
          {DAYS_ORDER.map((day) => (
            <div
              key={day}
              className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                schedule[day]?.active
                  ? "border-brand/30 bg-rose-600/5"
                  : "border-zinc-800 bg-zinc-800/50"
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => toggleDay(day)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  schedule[day]?.active ? "bg-rose-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-900/80 transition-all ${
                    schedule[day]?.active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>

              {/* نام روز */}
              <span className={`w-20 shrink-0 text-sm font-medium ${
                schedule[day]?.active ? "text-white" : "text-zinc-500"
              }`}>
                {DAY_OF_WEEK_LABELS[day]}
              </span>

              {/* ساعت شروع */}
              <select
                value={schedule[day]?.start || "10:00"}
                onChange={(e) => updateDayTime(day, "start", e.target.value)}
                disabled={!schedule[day]?.active}
                className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <span className="text-zinc-500">تا</span>

              {/* ساعت پایان */}
              <select
                value={schedule[day]?.end || "18:00"}
                onChange={(e) => updateDayTime(day, "end", e.target.value)}
                disabled={!schedule[day]?.active}
                className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 btn-primary text-sm disabled:opacity-50"
        >
          {saving ? "در حال ذخیره..." : "ذخیره برنامه"}
        </button>
      </div>

      {/* ─── مرخصی‌ها ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          مرخصی‌ها و روزهای تعطیل
        </h2>

        {/* فرم اضافه کردن — تاریخ شمسی */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">از تاریخ (شمسی)</label>
            <JalaliDateInput
              value={timeOffStart}
              onChange={setTimeOffStart}
              fromYear={jalaali.toJalaali(new Date()).jy}
              toYear={jalaali.toJalaali(new Date()).jy + 3}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">تا تاریخ (شمسی)</label>
            <JalaliDateInput
              value={timeOffEnd}
              onChange={setTimeOffEnd}
              fromYear={jalaali.toJalaali(new Date()).jy}
              toYear={jalaali.toJalaali(new Date()).jy + 3}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">عنوان (اختیاری)</label>
            <input
              type="text"
              value={timeOffTitle}
              onChange={(e) => setTimeOffTitle(e.target.value)}
              className="input-field text-sm"
              placeholder="مثال: تعطیلات نوروز"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleAddTimeOff} className="btn-primary text-sm">
              + اضافه
            </button>
          </div>
        </div>

        {/* لیست مرخصی‌ها */}
        {timeOffs.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            مرخصی ثبت نشده
          </p>
        ) : (
          <div className="space-y-2">
            {timeOffs.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3"
              >
                <div>
                  <span className="text-sm text-white">
                    {t.title || "مرخصی"}
                  </span>
                  <span className="mr-2 text-xs text-zinc-500">
                    از {formatJalaliDate(t.startDate, "short")} تا{" "}
                    {formatJalaliDate(t.endDate, "short")}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTimeOff(t.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
