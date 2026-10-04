"use client";

// ============================================================================
// ویزار رزرو (Client Component)
// مراحل: انتخاب سرویس → انتخاب تاریخ → انتخاب ساعت → جزئیات → تأیید
// ============================================================================

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getDepositPercentClient } from "@/lib/public-settings-client";
import {
  createBooking,
  getAvailableSlots,
} from "@/services/booking.service";
import { formatPrice, toPersianNumbers, TATTOO_SIZE_LABELS } from "@/lib/utils";

// ============================================================================
// تایپ‌ها
// ============================================================================

interface Artist {
  id: string;
  userId: string;
  artistName: string;
  slug: string;
  avatarUrl: string | null;
  displayName: string;
  isAcceptingBookings: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  maxPrice: number | null;
  durationMinutes: number;
  supportedSizes: string[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ============================================================================
// مراحل
// ============================================================================

const STEPS = [
  { id: 1, label: "انتخاب سرویس" },
  { id: 2, label: "انتخاب تاریخ" },
  { id: 3, label: "انتخاب ساعت" },
  { id: 4, label: "جزئیات تتو" },
  { id: 5, label: "بررسی و تأیید" },
];

// ============================================================================
// کامپوننت اصلی
// ============================================================================

export default function BookingWizard({
  artist,
  services,
}: {
  artist: Artist;
  services: Service[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // درصد بیعانه از تنظیمات ادمین؛ تا رسیدن مقدار، خط بیعانه نمایش داده نمی‌شود
  const [depositPercent, setDepositPercent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDepositPercentClient().then((p) => {
      if (!cancelled) setDepositPercent(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // State فرم
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bodyPlacement, setBodyPlacement] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── دریافت جلسات ───
  const fetchSlots = useCallback(
    async (date: string) => {
      if (!selectedService) return;
      setLoadingSlots(true);
      try {
        const result = await getAvailableSlots(artist.slug, date, selectedService.id);
        if (result.success && result.data) {
          setSlots(result.data);
        }
      } catch {
        toast.error("خطا در دریافت جلسات");
      } finally {
        setLoadingSlots(false);
      }
    },
    [artist.slug, selectedService]
  );

  // ─── انتخاب تاریخ ───
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date);
  };

  // ─── ارسال رزرو + پرداخت ───
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    try {
      // ۱. ایجاد رزرو
      const { createBooking: createBookingAction } = await import("@/services/booking.service");
      const result = await createBookingAction({
        artistSlug: artist.slug,
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        title: title || `رزرو ${selectedService.name}`,
        description: description || undefined,
        bodyPlacement: bodyPlacement || undefined,
        size: selectedSize || undefined,
      });

      if (result.success && result.data) {
        // ۲. ایجاد پرداخت و دریافت لینک درگاه
        const { createPayment } = await import("@/services/payment.service");
        const paymentResult = await createPayment({
          bookingId: result.data.bookingId,
          amount: result.data.estimatedDeposit,
          description: `بیعانه رزرو ${result.data.bookingNumber}`,
        });

        if (paymentResult.success && paymentResult.data) {
          // ۳. ریدایرکت به درگاه پرداخت
          toast.success("رزرو ایجاد شد! در حال انتقال به درگاه پرداخت...");
          window.location.href = paymentResult.data.url;
        } else {
          // رزرو ایجاد شد اما پرداخت ناموفق بود - کاربر بعداً پرداخت می‌کند
          toast.success("رزرو با موفقیت ایجاد شد!");
          toast.error("خطا در اتصال به درگاه پرداخت. لطفاً از صفحه رزروها پرداخت کنید.");
          router.push(`/bookings/${result.data.bookingId}`);
        }
      } else {
        toast.error(result.message || "خطا در ایجاد رزرو");
      }
    } catch {
      toast.error("خطا در ارسال رزرو");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── تاریخ‌های قابل انتخاب ───
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* هدر هنرمند */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800">
          {artist.avatarUrl ? (
            <img src={artist.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xl">
              
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">رزرو وقت</h1>
          <p className="text-sm text-zinc-400">
            با {artist.artistName} • {artist.displayName}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step >= s.id
                    ? "bg-rose-500 text-white shadow-[0_0_10px_-2px_rgba(231,68,68,0.5)]"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {step > s.id ? "✓" : toPersianNumbers(s.id)}
              </div>
              <span
                className={`hidden text-xs sm:inline ${
                  step >= s.id ? "text-white" : "text-zinc-600"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px w-6 ${
                    step > s.id ? "bg-rose-500" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── مرحله ۱: انتخاب سرویس ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">سرویس مورد نظر را انتخاب کنید</h2>
          {services.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-500">هنوز سرویسی ثبت نشده</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedService?.id === service.id
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {service.durationMinutes} دقیقه
                  </p>
                  <p className="mt-2 text-sm font-bold text-amber-400">
                    {formatPrice(service.basePrice)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── مرحله ۲: انتخاب تاریخ ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">تاریخ مورد نظر را انتخاب کنید</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-rose-500"
            />
            <p className="mt-2 text-xs text-zinc-500">
              فقط روزهایی که هنرمند فعال است نمایش داده می‌شوند
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary text-sm">
              بازگشت
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedDate}
              className="btn-primary text-sm disabled:opacity-50"
            >
              ادامه
            </button>
          </div>
        </div>
      )}

      {/* ─── مرحله ۳: انتخاب ساعت ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">ساعت مورد نظر را انتخاب کنید</h2>
          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-500">
                جلسه‌ای در این تاریخ موجود نیست. تاریخ دیگری انتخاب کنید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (slot.available) {
                      setSelectedSlot(slot);
                      setStep(4);
                    }
                  }}
                  disabled={!slot.available}
                  className={`rounded-lg px-3 py-2.5 text-center text-sm transition-all ${
                    !slot.available
                      ? "cursor-not-allowed bg-zinc-800/50 text-zinc-600 line-through"
                      : selectedSlot?.startTime === slot.startTime
                      ? "bg-rose-500 text-white shadow-[0_0_10px_-2px_rgba(231,68,68,0.5)]"
                      : "border border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700"
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary text-sm">
              بازگشت
            </button>
          </div>
        </div>
      )}

      {/* ─── مرحله ۴: جزئیات تتو ─── */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">جزئیات تتو</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">عنوان رزرو</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
                placeholder={`رزرو ${selectedService?.name || ""}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">جای تتو در بدن</label>
              <input
                type="text"
                value={bodyPlacement}
                onChange={(e) => setBodyPlacement(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
                placeholder="مثال: مچ دست راست"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">اندازه</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
              >
                <option value="">انتخاب اندازه</option>
                {Object.entries(TATTOO_SIZE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">توضیحات</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
                rows={3}
                placeholder="توضیحات اختیاری..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-secondary text-sm">
              بازگشت
            </button>
            <button onClick={() => setStep(5)} className="btn-primary text-sm">
              ادامه
            </button>
          </div>
        </div>
      )}

      {/* ─── مرحله ۵: بررسی و تأیید ─── */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">بررسی و تأیید رزرو</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            {/* خلاصه */}
            <div className="space-y-3 border-b border-zinc-800 pb-4">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">هنرمند</span>
                <span className="text-sm font-medium text-white">{artist.artistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">سرویس</span>
                <span className="text-sm font-medium text-white">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">تاریخ</span>
                <span className="text-sm font-medium text-white">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">ساعت</span>
                <span className="text-sm font-medium text-white">
                  {selectedSlot?.startTime} - {selectedSlot?.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">مدت</span>
                <span className="text-sm font-medium text-white">
                  {toPersianNumbers(selectedService?.durationMinutes || 0)} دقیقه
                </span>
              </div>
              {bodyPlacement && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">جای تتو</span>
                  <span className="text-sm font-medium text-white">{bodyPlacement}</span>
                </div>
              )}
            </div>

            {/* قیمت */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">قیمت سرویس</span>
                <span className="text-sm font-medium text-white">
                  {formatPrice(selectedService?.basePrice || 0)}
                </span>
              </div>
              {depositPercent !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">
                    بیعانه ({toPersianNumbers(depositPercent)}٪ — شرط تأیید رزرو)
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {formatPrice(
                      Math.round(
                        ((selectedService?.basePrice || 0) * depositPercent) / 100
                      )
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* سیاست لغو */}
            <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
              <p className="font-medium text-zinc-400">سیاست لغو:</p>
              <p className="mt-1">
                لغو رایگان تا ۲۴ ساعت قبل از زمان رزرو. لغو کمتر از ۲۴ ساعت قبل،
                شامل کسر ۵۰٪ ودیعه می‌شود.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="btn-secondary text-sm">
              بازگشت
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-gradient-to-l from-rose-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(231,68,68,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(231,68,68,0.6)] disabled:opacity-50"
            >
              {submitting ? "در حال ارسال..." : "پرداخت بیعانه و رزرو"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
