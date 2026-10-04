"use client";

// ============================================================================
// صفحه رزرو جدید - ویزارد چند مرحله‌ای با تقویم فارسی
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import jalaali from "jalaali-js";
import {
  getDepositPercentClient,
  getUploadLimitsClient,
  type ClientUploadLimits,
} from "@/lib/public-settings-client";

type Artist = {
  id: string;
  artistName: string;
  slug: string;
  bio: string | null;
  city: string | null;
  isVerified: boolean;
  isAcceptingBookings: boolean;
  specializations: string[];
  user: { displayName: string; avatarUrl: string | null };
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  durationMinutes: number;
};

type TimeSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

// ─── تقویم فارسی (جلالی ساده) ───
const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const JALALI_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  days = (days - 1) % 365;
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  // تبدیل از کتابخانهٔ jalaali-js انجام می‌شود (همان کتابخانه‌ای که JalaliDateInput
  // استفاده می‌کند) تا تاریخ انتخاب‌شده دقیقاً همان چیزی باشد که کاربر دیده است.
  const g = jalaali.toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** طول ماه شمسی (برای اسفندِ سال کبیسه دقیق است) */
function jalaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

function formatJalali(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toPersianDigits(String(jd))} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(String(jy))}`;
}

function formatJalaliShort(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toPersianDigits(String(jd))} ${JALALI_MONTHS[jm - 1]}`;
}

function toPersianDigits(str: string): string {
  return str.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

// ─── آیکون‌ها ───
function CheckIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

export default function BookingWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artistSlug = searchParams.get("artist") || "";

  const [step, setStep] = useState(1);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // فرم جزئیات
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bodyPlacement, setBodyPlacement] = useState("");
  const [size, setSize] = useState("");
  const [colorType, setColorType] = useState<"BW" | "COLOR" | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedImageName, setUploadedImageName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // درصد بیعانه و محدودیت‌های آپلود از تنظیمات ادمین می‌آید.
  // تا وقتی مقدار واقعی نرسیده، مبلغ بیعانه نمایش داده نمی‌شود تا عدد اشتباه نبینید.
  const [depositPercent, setDepositPercent] = useState<number | null>(null);
  const [uploadLimits, setUploadLimits] = useState<ClientUploadLimits | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [percent, limits] = await Promise.all([
        getDepositPercentClient(),
        getUploadLimitsClient(),
      ]);
      if (cancelled) return;
      setDepositPercent(percent);
      setUploadLimits(limits);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // تقویم
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  });

  // دریافت اطلاعات هنرمند
  useEffect(() => {
    if (!artistSlug) {
      setError("شناسه هنرمند وارد نشده است");
      setLoading(false);
      return;
    }

    async function fetchArtist() {
      try {
        const res = await fetch(`/api/artists/${artistSlug}`);
        if (!res.ok) throw new Error("Artist not found");
        const data = await res.json();
        setArtist(data.artist);
        setServices(data.services || []);
      } catch {
        setError("هنرمند یافت نشد");
      } finally {
        setLoading(false);
      }
    }
    fetchArtist();
  }, [artistSlug]);

  // دریافت اسلات‌های موجود
  const fetchSlots = useCallback(async (date: string) => {
    if (!date || !artistSlug) {
      setAvailableSlots([]);
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    try {
      const duration = selectedService?.durationMinutes || 120;
      const params = new URLSearchParams();
      params.set("artist", artistSlug);
      params.set("date", date);
      params.set("duration", String(duration));
      const res = await fetch(`/api/availability/slots?${params.toString()}`);
      const data = await res.json();
      setAvailableSlots((data && Array.isArray(data.slots)) ? data.slots : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [artistSlug, selectedService]);

  // هر بار date عوض شد، اسلات رو از سر برگردون (حتی قبل از ورود به مرحله ۳)
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  // اگر سرویس عوض شد و هنوز Historical date/step داریم، دوباره slots بگیر
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots(selectedDate);
    }
  }, [selectedService]);

  // آپلود تصویر طرح
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // محدودیت‌ها از تنظیمات ادمین (پیش‌تر در کد هاردکد بود)
    const limits = uploadLimits ?? (await getUploadLimitsClient());

    // اعتبارسنجی حجم
    if (file.size > limits.maxBytes) {
      setUploadError(
        `حجم فایل بیش از حد مجاز (${toPersianDigits(String(limits.maxMb))} مگابایت)`
      );
      return;
    }

    // اعتبارسنجی فرمت (بر اساس فهرست مجاز ادمین + پیشوندهای رایج jpg)
    const mime = file.type.toLowerCase();
    const isJpegAlias = mime === "image/jpg" || mime === "image/pjpeg";
    if (!limits.allowedTypes.includes(mime) && !isJpegAlias) {
      setUploadError("فرمت فایل مجاز نیست. لطفاً از تصویر PNG، JPG، WEBP یا فرمت‌های مجاز استفاده کنید.");
      return;
    }

    setUploadingImage(true);
    setUploadError("");
    setUploadedImageUrl("");
    setUploadedImageName("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "booking-design");
      formData.append("folder", "bookings");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.url) {
        setUploadedImageUrl(data.url);
        setUploadedImageName(file.name);
      } else if (data.error) {
        setUploadError(data.error);
      } else {
        setUploadError("آپلود موفقیت‌آمیز بود اما مسیر فایل بازیابی نشد.");
      }
    } catch {
      setUploadError("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ارسال رزرو
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistSlug,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          title: title || `رزرو ${selectedService.name}`,
          description,
          bodyPlacement,
          size,
          colorType: colorType || null,
          designImageUrl: uploadedImageUrl || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // هدایت مستقیم به بخش پرداخت برای واریز بیعانه (شرط ارسال به تأیید)
        const bid = data.data?.bookingId;
        router.push(bid ? `/client/payments?booking=${bid}` : "/client/payments");
      } else {
        setError(data.message || "خطا در ثبت رزرو");
      }
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── تقویم فارسی ───
  function renderCalendar() {
    const [jy, jm] = currentMonth;
    const daysInMonth = jalaliMonthLength(jy, jm);
    const firstDayDate = jalaliToGregorian(jy, jm, 1);
    const firstDayIndex = (firstDayDate.getDay() + 1) % 7; // شنبه=0
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        {/* هدر ماه */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => {
            const [ny, nm] = jm === 1 ? [jy - 1, 12] : [jy, jm - 1];
            setCurrentMonth([ny, nm, 1]);
          }} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <span className="text-sm font-semibold text-white">{JALALI_MONTHS[jm - 1]} {toPersianDigits(String(jy))}</span>
          <button onClick={() => {
            const [ny, nm] = jm === 12 ? [jy + 1, 1] : [jy, jm + 1];
            setCurrentMonth([ny, nm, 1]);
          }} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* روزهای هفته */}
        <div className="grid grid-cols-7 mb-2">
          {JALALI_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-zinc-500 py-1">{d}</div>
          ))}
        </div>

        {/* روزها */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const gDate = jalaliToGregorian(jy, jm, day);
            const dateStr = `${gDate.getFullYear()}-${String(gDate.getMonth() + 1).padStart(2, "0")}-${String(gDate.getDate()).padStart(2, "0")}`;
            const isPast = gDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isFriday = gDate.getDay() === 5;

            return (
              <button
                key={day}
                disabled={isPast || isFriday}
                onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : isToday
                    ? "border border-rose-500/30 text-rose-400"
                    : isPast || isFriday
                    ? "text-zinc-700 cursor-not-allowed"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {toPersianDigits(String(day))}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
      </div>
    );
  }

  if (error && !artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{error}</h2>
          <Link href="/artists" className="mt-4 inline-block rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500">
            بازگشت به لیست هنرمندان
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "انتخاب سرویس" },
    { num: 2, label: "انتخاب تاریخ" },
    { num: 3, label: "انتخاب ساعت" },
    { num: 4, label: "جزئیات" },
    { num: 5, label: "تأیید" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* هدر */}
      <div className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/artists/${artistSlug}`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">رزرو نوبت</h1>
              <p className="text-xs text-zinc-500">{artist?.artistName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* پیشرفت */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > s.num ? "bg-green-500 text-white" : step === s.num ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {step > s.num ? <CheckIcon /> : toPersianDigits(String(s.num))}
                </div>
                <span className={`hidden text-xs sm:inline ${step === s.num ? "text-white" : "text-zinc-500"}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px flex-1 ${step > s.num ? "bg-green-500/50" : "bg-zinc-800"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* محتوا */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* مرحله ۱: انتخاب سرویس */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">سرویس مورد نظر را انتخاب کنید</h2>
            {services.length === 0 ? (
              <p className="text-zinc-500">هنرمند هنوز سرویسی تعریف نکرده است.</p>
            ) : (
              <div className="space-y-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className={`w-full rounded-xl border p-5 text-right transition-all ${
                      selectedService?.id === s.id
                        ? "border-rose-500/50 bg-rose-500/10"
                        : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        {s.description && <p className="mt-1 text-sm text-zinc-400">{s.description}</p>}
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-amber-400">{toPersianDigits(Number(s.basePrice).toLocaleString("fa-IR"))} تومان</p>
                        <p className="text-xs text-zinc-500">{toPersianDigits(String(s.durationMinutes))} دقیقه</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* مرحله ۲: انتخاب تاریخ */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">تاریخ مورد نظر را انتخاب کنید</h2>
              <button onClick={() => setStep(1)} className="text-sm text-zinc-400 hover:text-white">تغییر سرویس</button>
            </div>
            {renderCalendar()}
            {selectedDate && (
              <div className="flex justify-end">
                <button onClick={() => setStep(3)} className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500">
                  انتخاب ساعت
                </button>
              </div>
            )}
          </div>
        )}

        {/* مرحله ۳: انتخاب ساعت */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">ساعت مورد نظر را انتخاب کنید</h2>
              <button onClick={() => setStep(2)} className="text-sm text-zinc-400 hover:text-white">تغییر تاریخ</button>
            </div>
            <p className="text-sm text-zinc-500">{selectedDate ? formatJalali(new Date(selectedDate + "T00:00:00")) : "-"}</p>

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 text-center backdrop-blur-md">
                <svg className="mb-3 h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-2.55-9.895M11.579 13.925A9.003 9.003 0 0112 13.5H1.5l4.5 5.225c.235.026.46.08.665.157"/></svg>
                <p className="text-sm font-medium text-white">ساعتی در دسترس برای این تاریخ وجود ندارد</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {selectedService ? (
                    <>سرویس {selectedService.name} ({toPersianDigits(String(selectedService.durationMinutes))} دقیقه) نیاز به زمان بیشتری دارد</>
                  ) : (
                    <>هنرمند در این روز در دسترس نبوده است</>
                  )}
                </p>
                <button
                  onClick={() => { setSelectedDate(""); setSelectedSlot(null); setAvailableSlots([]); setLoadingSlots(false); }}
                  className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                >
                  تاریخ دیگری انتخاب کنید
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.filter((s) => s.available).map((slot) => (
                  <button
                    key={slot.startTime}
                    onClick={() => { setSelectedSlot(slot); setStep(4); }}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      selectedSlot?.startTime === slot.startTime
                        ? "border-rose-500/50 bg-rose-500/10 text-white"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <p className="text-sm font-bold">{toPersianDigits(slot.startTime)}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">{toPersianDigits(slot.endTime)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* مرحله ۴: جزئیات */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">جزئیات طرح و اطلاعات تکمیلی</h2>
              <button onClick={() => setStep(3)} className="text-sm text-zinc-400 hover:text-white">تغییر ساعت</button>
            </div>

            {/* بخش اول: اطلاعاتی */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
              <p className="text-sm font-medium text-white">اطلاعات رزرو</p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">عنوان رزرو</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50" placeholder="مثلاً: طرح گل رز روی بازو" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">محل تتو روی بدن</label>
                  <input value={bodyPlacement} onChange={(e) => setBodyPlacement(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50" placeholder="بازو، پشت، ساعد..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">اندازه</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50">
                    <option value="">انتخاب کنید</option>
                    <option value="SMALL">کوچک</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="LARGE">بزرگ</option>
                    <option value="FULL_SLEEVE">فول اسلیو</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">توضیحات بیشتر</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50 resize-none" placeholder="جزئیات بیشتر درباره طرح مورد نظر، سوالی که دارید..." />
              </div>
            </div>

            {/* بخش دوم: نوع رنگی */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="mb-3 text-sm font-medium text-white">نوع رنگی طرح</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setColorType("BW")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all duraction-300 ${
                    colorType === "BW"
                      ? "border-rose-500 bg-rose-500/10 text-rose-400"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xs font-medium">سیاه و سفید</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>
                    کلاسیک و دائمی
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setColorType("COLOR")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all duraction-300 ${
                    colorType === "COLOR"
                      ? "border-rose-500 bg-rose-500/10 text-rose-400"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xs font-medium">رنگی</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M4.098 19.902a3.75 3.75 0 005.304 0l.96-1.92a2.25 2.25 0 013.143-2.288 5.277 5.277 0 013.09-1.04 3.75 3.75 0 003.75 3.75c.536 0 1.05-.122 1.53-.34l.03-.06a.75.75 0 01.99-.504l.14-.02a2.25 2.25 0 01.56 2.88l-.09.09a6.019 6.019 0 00-2.04.83 3.75 3.75 0 00-3.75 3.75c0 .421.093.826.267 1.2a24.319 24.319 0 01-1.73 3.53l-.31.22a3.75 3.75 0 000 3.45l.22-.31a24.242 24.242 0 013.24-1.53 2.25 2.25 0 012.288-.56l.02.14a.75.75 0 01-.5.99l-.06.03a3.75 3.75 0 00-1.2-1.53l-.03-.06a5.25 5.25 0 01-1.04-3.09 2.25 2.25 0 01-2.289-3.144l-1.92-.96a3.75 3.75 0 000-5.304z"/></svg>
                    جلوه رنگی و زنده
                  </div>
                </button>
              </div>
            </div>

            {/* بخش سوم: آپلود تصویر طرح */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">تصویر طرح مورد نظر (اختیاری)</p>
                <span className="text-xs text-zinc-500">حداکثر ۱۰ مگابایت</span>
              </div>

              {uploadingImage ? (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-rose-500" />
                  <span className="text-sm text-zinc-400">در حال آپلود تصویر...</span>
                </div>
              ) : uploadedImageUrl ? (
                <div className="relative">
                  <img
                    src={uploadedImageUrl}
                    alt="طرح آپلود شده"
                    className="h-48 w-full rounded-lg object-cover border border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => { setUploadedImageUrl(""); setUploadedImageName(""); setUploadError(""); }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/90 px-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    حذف
                  </button>
                  {uploadedImageName && (
                    <p className="mt-2 text-xs text-zinc-500">{uploadedImageName}</p>
                  )}
                </div>
              ): (
                <label className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-5 py-8 transition-all cursor-pointer hover:border-rose-500/30 hover:bg-rose-500/3 ${
                  uploadError
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-zinc-700 bg-zinc-800/30"
                }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
                  <span className="text-sm text-zinc-400">کلیک کنید یا تصویر را قرار دهید</span>
                  <span className="text-xs text-zinc-600">PNG, JPG, WEBP - حداکثر ۱۰ مگابایت</span>
                  {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
                </label>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (uploadingImage) return;
                  setStep(5);
                }}
                className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500"
              >
                بررسی و تأیید
              </button>
            </div>
          </div>
        )}

        {/* مرحله ۵: تأیید نهایی */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">بررسی و تأیید رزرو</h2>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                  {artist?.artistName[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{artist?.artistName}</p>
                  <p className="text-xs text-zinc-500">{artist?.city || ""}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">سرویس</p>
                  <p className="text-white font-medium">{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">مدت زمان</p>
                  <p className="text-white font-medium">{toPersianDigits(String(selectedService?.durationMinutes || 0))} دقیقه</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">تاریخ</p>
                  <p className="text-white font-medium">{selectedDate ? formatJalali(new Date(selectedDate + "T00:00:00")) : ""}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">ساعت</p>
                  <p className="text-white font-medium">{toPersianDigits(selectedSlot?.startTime || "")} - {toPersianDigits(selectedSlot?.endTime || "")}</p>
                </div>
                {bodyPlacement && (
                  <div>
                    <p className="text-zinc-500 text-xs">محل تتو</p>
                    <p className="text-white font-medium">{bodyPlacement}</p>
                  </div>
                )}
                {size && (
                  <div>
                    <p className="text-zinc-500 text-xs">اندازه</p>
                    <p className="text-white font-medium">{size === "SMALL" ? "کوچک" : size === "MEDIUM" ? "متوسط" : size === "LARGE" ? "بزرگ" : "فول اسلیو"}</p>
                  </div>
                )}
                {colorType && (
                  <div>
                    <p className="text-zinc-500 text-xs">نوع رنگی</p>
                    <p className={`font-medium ${colorType === "BW" ? "text-zinc-200" : "text-amber-400"}`}>
                      {colorType === "BW" ? "سیاه و سفید" : "رنگی"}
                    </p>
                  </div>
                )}
              </div>

              {uploadedImageUrl && (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                  <p className="mb-2 text-xs font-medium text-zinc-400">تصویر طرح ارسالی</p>
                  <img
                    src={uploadedImageUrl}
                    alt="طرح مورد نظر"
                    className="h-40 w-full rounded object-cover border border-zinc-700"
                  />
                </div>
              )}

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">هزینه تقریبی</span>
                  <span className="text-lg font-bold text-amber-400">{toPersianDigits(Number(selectedService?.basePrice || 0).toLocaleString("fa-IR"))} تومان</span>
                </div>
                {depositPercent !== null && (
                  <p className="mt-1 text-xs text-zinc-600">
                    بیعانه پرداختی ({toPersianDigits(String(depositPercent))}٪):{" "}
                    {toPersianDigits(
                      Math.round(
                        (Number(selectedService?.basePrice || 0) * depositPercent) / 100
                      ).toLocaleString("fa-IR")
                    )}{" "}
                    تومان
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(4)} className="rounded-xl border border-zinc-700 px-6 py-2.5 text-sm text-zinc-400 hover:text-white">
                بازگشت
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-rose-600 px-8 py-3 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50">
                {submitting ? "در حال ثبت..." : "تایید و پرداخت بیعانه"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
