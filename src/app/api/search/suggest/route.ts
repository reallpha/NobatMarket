import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TATTOO_STYLE_LABELS } from "@/lib/utils";
import { getAvailableCities } from "@/services/discovery.service";

export const dynamic = "force-dynamic";

// جستجوهای محبوب و دسته‌بندی‌های پرکاربرد
const POPULAR_SEARCHES = [
  "رئالیسم دست",
  "مینیمال",
  "بلک‌ورک",
  "فاین‌لاین",
  "تتو گل",
  "ژئومتریک",
  "ترایبال",
  "واتروکالر",
  "دات‌ورک",
  "نئو ترادیشنال",
  "جاپانی",
  "اولد اسکول",
];

const POPULAR_CATEGORIES = [
  { style: "REALISM", bookings: "رزرو بالا" },
  { style: "MINIMAL", bookings: "محبوب" },
  { style: "BLACKWORK", bookings: "محبوب" },
  { style: "FINE_LINE", bookings: "ترند" },
  { style: "DOTWORK", bookings: "خاص" },
  { style: "WATERCOLOR", bookings: "رنگی" },
  { style: "GEOMETRIC", bookings: "هندسی" },
  { style: "OLD_SCHOOL", bookings: "کلاسیک" },
  { style: "JAPANESE", bookings: "سنتی" },
];

// شهرهای پیش‌فرض ایران (fallback)
const FALLBACK_CITIES = [
  "تهران", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم",
  "مشهد", "کرمانشاه", "زاهدان", "بیرجند", "یزد",
  "اردبیل", "بندرعباس", "اراک", "گرگان", "ساری",
  "رشت", "همدان", "کرمان", "زنجان", "سنندج", "بجنورد",
  "گنبدکاووس", "سمنان", "خرم‌آباد", "ایلام", "بوشهر", "چابهار",
  "نیشابور", "سبزوار", "قزوین", "کاشان", "نور", "نطنز",
  "قشم", "کیش", "بندرلنگه", "بم", "جیرفت", "سیرجان",
  "بابل", "آمل", "قائم‌شهر", "نوشهر", "لاهیجان",
  "نورآباد", "دورود", "ملایر", "اسفراین", "بافت", "رفسنجان",
  "تفت", "خمیر", "میناب", "نایین", "زرند", "آباده",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    // شهرها (برای فیلتر) — همیشه برگردان
    let cities: string[] = [];
    try {
      cities = await getAvailableCities();
    } catch {
      cities = [];
    }
    // ترکیب با fallback
    const allCities = Array.from(new Set([...FALLBACK_CITIES, ...cities])).sort((a, b) => a.localeCompare(b, "fa"));

    if (!q || q.length < 1) {
      return NextResponse.json({
        artists: [],
        styles: [],
        cities: [],
        popularSearches: POPULAR_SEARCHES,
        popularCategories: POPULAR_CATEGORIES.map((c) => ({
          ...c,
          label: TATTOO_STYLE_LABELS[c.style] || c.style,
        })),
        allCities: allCities.slice(0, 50),
        allStyles: Object.entries(TATTOO_STYLE_LABELS).map(([value, label]) => ({ value, label })),
      });
    }

    const artists = await db.artistProfile.findMany({
      where: {
        user: { role: "ARTIST", status: "ACTIVE" },
        OR: [
          { artistName: { contains: q, mode: "insensitive" } },
          { shortBio: { contains: q, mode: "insensitive" } },
          { user: { displayName: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        artistName: true,
        city: true,
        isVerified: true,
        satisfactionScore: true,
        specializations: true,
        user: { select: { avatarUrl: true } },
      },
    });

    const qLower = q.toLowerCase();
    const styles = Object.entries(TATTOO_STYLE_LABELS)
      .filter(([value, label]) => label.includes(q) || value.toLowerCase().includes(qLower))
      .slice(0, 4)
      .map(([value, label]) => ({ value, label }));

    const matchedCities = allCities.filter((c) => c.includes(q)).slice(0, 4);

    return NextResponse.json({
      artists: artists.map((a) => ({
        slug: a.slug,
        name: a.artistName,
        city: a.city,
        verified: a.isVerified,
        rating: a.satisfactionScore,
        styles: (a.specializations || []).slice(0, 2).map((s) => TATTOO_STYLE_LABELS[s] || s),
        avatar: a.user.avatarUrl,
      })),
      styles,
      cities: matchedCities,
      popularSearches: POPULAR_SEARCHES,
      popularCategories: POPULAR_CATEGORIES.map((c) => ({
        ...c,
        label: TATTOO_STYLE_LABELS[c.style] || c.style,
      })),
      allCities: allCities.slice(0, 50),
      allStyles: Object.entries(TATTOO_STYLE_LABELS).map(([value, label]) => ({ value, label })),
    });
  } catch {
    return NextResponse.json({ 
      artists: [], 
      styles: [], 
      cities: [], 
      popularSearches: POPULAR_SEARCHES, 
      popularCategories: POPULAR_CATEGORIES.map((c) => ({
        ...c,
        label: TATTOO_STYLE_LABELS[c.style] || c.style,
      })),
      allCities: FALLBACK_CITIES.slice(0, 50),
      allStyles: Object.entries(TATTOO_STYLE_LABELS).map(([value, label]) => ({ value, label })),
    });
  }
}
