"use client";

// ============================================================================
// ویزار آنبوردینگ هنرمند - ۳ مرحله
// ============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const TATTOO_STYLES = [
  "BLACKWORK", "REALISM", "GEOMETRIC", "MINIMAL", "ABSTRACT",
  "OLD_SCHOOL", "NEO_TRADITIONAL", "BLACK_AND_GREY", "COLOR",
  "LINE_ART", "DOTWORK", "JAPANESE", "TRIBAL", "WATERCOLOR",
  "LETTERING", "BIOMECHANICAL", "CHICANO", "OTHER",
];

const STYLE_LABELS: Record<string, string> = {
  BLACKWORK: "بلک‌ورک",
  REALISM: "رئالیسم",
  GEOMETRIC: "هندسی",
  MINIMAL: "مینیمال",
  ABSTRACT: "انتزاعی",
  OLD_SCHOOL: "اولد اسکول",
  NEO_TRADITIONAL: "نئو تریدیشنال",
  BLACK_AND_GREY: "سیاه و سفید",
  COLOR: "رنگی",
  LINE_ART: "لاین آرت",
  DOTWORK: "نقطه‌ای",
  JAPANESE: "ژاپنی",
  TRIBAL: " Tribal",
  WATERCOLOR: "واترکالر",
  LETTERING: "لترینگ",
  BIOMECHANICAL: "بیومکانیکال",
  CHICANO: "چیکانو",
  OTHER: "سایر",
};

const IRAN_CITIES = [
  "تهران", "اصفهان", "شیراز", "تبریز", "مشهد", "اهواز",
  "کرمان", "اراک", "همدان", "یزد", "قم", "رشت",
  "بندرعباس", "زنجان", "سنندج", "بیرجند", "بجنورد", "ساری",
];

type Props = {
  userId: string;
  existingProfile: {
    shortBio: string;
    city: string;
    styles: string[];
  } | null;
};

export function ArtistOnboarding({ userId, existingProfile }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // ─── State فرم ───
  const [bio, setBio] = useState(existingProfile?.shortBio || "");
  const [city, setCity] = useState(existingProfile?.city || "");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(existingProfile?.styles || []);
  const [saving, setSaving] = useState(false);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : prev.length >= 4 ? prev : [...prev, style]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { createArtistProfile } = await import("@/services/profile.service");
      const result = await createArtistProfile({
        bio,
        city,
        styles: selectedStyles,
        experienceYears: 0,
        basePrice: 0,
      });

      if (result.success) {
        toast({ title: "پروفایل شما تکمیل شد! 🎉" });
        router.push("/artist/dashboard");
      } else {
        toast({ title: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطا در ذخیره", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* هدر */}
      <div className="mb-10 text-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
        <h1 className="mb-2 text-2xl font-bold text-white">
          به نوبت مارکت خوش آمدید!
        </h1>
        <p className="text-zinc-400">
          پروفایل خود را تکمیل کنید تا شروع به دریافت رزرو کنید.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-10 flex items-center justify-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step >= s
                  ? "bg-rose-500 text-white shadow-[0_0_15px_-3px_rgba(231,68,68,0.5)]"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && (
              <div className={`h-px w-12 ${step > s ? "bg-rose-500" : "bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ─── مرحله ۱: اطلاعات پایه ─── */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">اطلاعات پایه</h2>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">درباره خودتان</label>
            <Textarea
              value={bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
              className="min-h-[100px] border-zinc-800 bg-zinc-900 text-white"
              placeholder="چند جمله درباره خودتان و تجربه‌تان بنویسید..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">شهر</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-rose-500"
            >
              <option value="">انتخاب شهر</option>
              {IRAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!bio || !city}
            className="w-full bg-rose-600 hover:bg-rose-700"
          >
            ادامه
          </Button>
        </div>
      )}

      {/* ─── مرحله ۲: سبک‌ها ─── */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">سبک‌های تخصصی</h2>
          <p className="text-sm text-zinc-400">حداقل یک و حداکثر ۴ دسته‌بندی انتخاب کنید ({selectedStyles.length}/۴).</p>

          <div className="flex flex-wrap gap-2">
            {TATTOO_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  selectedStyles.includes(style)
                    ? "border-rose-500 bg-rose-500/10 text-rose-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {STYLE_LABELS[style] || style}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="border-zinc-700 text-zinc-300">
              بازگشت
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={selectedStyles.length === 0}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              ادامه
            </Button>
          </div>
        </div>
      )}

      {/* ─── مرحله ۳: تأیید نهایی ─── */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">تأیید اطلاعات</h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <div>
              <span className="text-sm text-zinc-400">درباره شما</span>
              <p className="mt-1 text-sm text-white">{bio}</p>
            </div>
            <div>
              <span className="text-sm text-zinc-400">شهر</span>
              <p className="mt-1 text-sm text-white">{city}</p>
            </div>
            <div>
              <span className="text-sm text-zinc-400">سبک‌ها</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStyles.map((s) => (
                  <Badge key={s} className="bg-zinc-800 text-zinc-300">
                    {STYLE_LABELS[s] || s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="border-zinc-700 text-zinc-300">
              بازگشت
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 bg-gradient-to-l from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
            >
              {saving ? "در حال ذخیره..." : "تکمیل و شروع 🚀"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
