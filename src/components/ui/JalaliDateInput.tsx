"use client";

// ============================================================================
// ورودی تاریخ شمسی (بدون وابستگی خارجی)
// خروجی همیشه رشته میلادی YYYY-MM-DD است تا APIها بدون تغییر بمانند.
// ============================================================================

import { useMemo, useState, useEffect } from "react";
import jalaali from "jalaali-js";
import { toPersianNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function gregorianToJalaliParts(value: string): { jy: number; jm: number; jd: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  try {
    const j = jalaali.toJalaali(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (!j || !j.jy) return null;
    return { jy: j.jy, jm: j.jm, jd: j.jd };
  } catch {
    return null;
  }
}

interface JalaliDateInputProps {
  /** تاریخ میلادی YYYY-MM-DD یا رشته خالی */
  value: string;
  onChange: (gregorian: string) => void;
  /** محدوده سال شمسی (پیش‌فرض: ۸۰ سال گذشته تا امسال) */
  fromYear?: number;
  toYear?: number;
  className?: string;
  disabled?: boolean;
}

export default function JalaliDateInput({
  value,
  onChange,
  fromYear,
  toYear,
  className,
  disabled,
}: JalaliDateInputProps) {
  const nowJ = useMemo(() => jalaali.toJalaali(new Date()), []);
  const minYear = fromYear ?? nowJ.jy - 80;
  const maxYear = toYear ?? nowJ.jy;

  const parsed = useMemo(() => gregorianToJalaliParts(value), [value]);
  const [jy, setJy] = useState<number | "">(parsed?.jy ?? "");
  const [jm, setJm] = useState<number | "">(parsed?.jm ?? "");
  const [jd, setJd] = useState<number | "">(parsed?.jd ?? "");

  // همگام‌سازی وقتی value از بیرون تغییر کرد (مثلاً ریست فرم)
  useEffect(() => {
    if (!value) {
      setJy(""); setJm(""); setJd("");
    } else {
      const p = gregorianToJalaliParts(value);
      if (p) { setJy(p.jy); setJm(p.jm); setJd(p.jd); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const maxDay = useMemo(() => {
    if (!jy || !jm) return 31;
    return jalaali.jalaaliMonthLength(Number(jy), Number(jm));
  }, [jy, jm]);

  const emit = (y: number | "", m: number | "", d: number | "") => {
    if (!y || !m || !d) return;
    try {
      const g = jalaali.toGregorian(Number(y), Number(m), Number(d));
      const iso = `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
      onChange(iso);
    } catch {
      /* تاریخ نامعتبر — نادیده بگیر */
    }
  };

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const selectClass =
    "rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50";

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <select
        aria-label="روز"
        value={jd}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value === "" ? "" : Number(e.target.value);
          const day = typeof v === "number" && v > maxDay ? maxDay : v;
          setJd(day);
          emit(jy, jm, day);
        }}
        className={selectClass}
      >
        <option value="">روز</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{toPersianNumbers(d)}</option>
        ))}
      </select>
      <select
        aria-label="ماه"
        value={jm}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value === "" ? "" : Number(e.target.value);
          setJm(v);
          // اگر روز از طول ماه جدید بیشتر شد، اصلاح کن
          let day = jd;
          if (jy && v && jd) {
            const ml = jalaali.jalaaliMonthLength(Number(jy), Number(v));
            if (Number(jd) > ml) { day = ml; setJd(ml); }
          }
          emit(jy, v, day);
        }}
        className={selectClass}
      >
        <option value="">ماه</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        aria-label="سال"
        value={jy}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value === "" ? "" : Number(e.target.value);
          setJy(v);
          emit(v, jm, jd);
        }}
        className={selectClass}
      >
        <option value="">سال</option>
        {years.map((y) => (
          <option key={y} value={y}>{toPersianNumbers(y)}</option>
        ))}
      </select>
    </div>
  );
}
