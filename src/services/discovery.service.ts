// ============================================================================
// سرویس کاوش و جستجوی هنرمندان - نوبت مارکت
// ============================================================================

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { resolveSampleImage } from "@/lib/utils";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// تایپ‌های فیلتر جستجو
// ============================================================================

export interface ArtistSearchFilters {
  /** متن جستجو (نام هنرمند یا بیوگرافی) */
  query?: string;
  /** شهر */
  city?: string;
  /** سبک تتو */
  style?: string;
  /** حداقل قیمت (تومان) */
  minPrice?: number;
  /** حداکثر قیمت (تومان) */
  maxPrice?: number;
  /** حداقل امتیاز رضایت */
  minRating?: number;
  /** فقط تأیید شده‌ها */
  verifiedOnly?: boolean;
  /** فقط در حال پذیرش رزرو */
  acceptingBookings?: boolean;
  /** مرتب‌سازی */
  sortBy?: "rating" | "experience" | "price_low" | "price_high" | "popularity" | "newest";
  /** شماره صفحه */
  page?: number;
  /** تعداد در هر صفحه */
  pageSize?: number;
}

// ============================================================================
// تایپ نتیجه جستجو
// ============================================================================

export type ArtistCard = {
  id: string;
  slug: string;
  artistName: string;
  shortBio: string | null;
  experienceYears: number | null;
  specializations: string[];
  minPrice: bigint | null;
  maxPrice: bigint | null;
  satisfactionScore: number;
  followerCount: number;
  completedBookings: number;
  isVerified: boolean;
  isAcceptingBookings: boolean;
  city: string | null;
  user: {
    displayName: string;
    avatarUrl: string | null;
    city: string | null;
  };
  portfolioItems: {
    images: string[];
    style: string;
  }[];
  _count: {
    portfolioItems: number;
    followers: number;
  };
};

// ============================================================================
// نقشه تبدیل نام فارسی سبک به مقدار Enum
// ============================================================================

const STYLE_MAP: Record<string, string> = {
  "بلک‌ورک": "BLACKWORK",
  "رئالیسم": "REALISM",
  "ژئومتریک": "GEOMETRIC",
  "مینیمال": "MINIMAL",
  "انتزاعی": "ABSTRACT",
  "آبستره": "ABSTRACT",
  "اورلداسکول": "OLD_SCHOOL",
  "نئوتد": "NEO_TRADITIONAL",
  "سیاه و خاکستری": "BLACK_AND_GREY",
  "رنگی": "COLOR",
  "لاین آرت": "LINE_ART",
  "داتورک": "DOTWORK",
  "ژاپنی": "JAPANESE",
  "ترایبال": "TRIBAL",
  "واتروکالر": "WATERCOLOR",
  "فاین‌لاین": "FINE_LINE",
};

function resolveStyleEnum(persianName: string): string | null {
  // اگر خودش enum value باشد
  const upper = persianName.toUpperCase().replace(/\s+/g, "_");
  if (Object.values(STYLE_MAP).includes(upper)) return upper;
  // اگر نام فارسی باشد
  return STYLE_MAP[persianName] || null;
}

// ============================================================================
// تابع اصلی جستجوی هنرمندان
// ============================================================================

/**
 * جستجوی پیشرفته هنرمندان با فیلترهای مختلف
 *
 * بهینه‌سازی‌ها:
 * - استفاده از ایندکس‌های Prisma برای فیلترهای رایج
 * - limit تعداد پورتفولیو برای هر هنرمند
 * - select only نیازمندی‌ها
 * - شمارش جداگانه برای pagination
 */
export async function searchArtists(
  filters: ArtistSearchFilters
): Promise<PaginatedResponse<ArtistCard>> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize || 12));
  const skip = (page - 1) * pageSize;

  // ──────────────────────────────────────────────────────
  // ساخت شرایط فیلتر
  // ──────────────────────────────────────────────────────
  const where: Prisma.ArtistProfileWhereInput = {
    ...(filters.acceptingBookings !== false
      ? { isAcceptingBookings: true }
      : {}),
    // فقط هنرمندانی که حسابشان توسط ادمین تأیید شده باشد (status=ACTIVE) نمایش داده می‌شوند
    user: { role: "ARTIST", status: "ACTIVE" },
  };

  if (filters.verifiedOnly) {
    where.isVerified = true;
  }

  if (filters.query) {
    where.OR = [
      { artistName: { contains: filters.query, mode: "insensitive" } },
      { shortBio: { contains: filters.query, mode: "insensitive" } },
      { fullBio: { contains: filters.query, mode: "insensitive" } },
      { user: { displayName: { contains: filters.query, mode: "insensitive" } } },
    ];
  }

  if (filters.city) {
    where.OR = [
      ...(where.OR || []),
      { city: { contains: filters.city, mode: "insensitive" } },
      { user: { city: { contains: filters.city, mode: "insensitive" } } },
    ];
  }

  if (filters.style) {
    const styleEnum = resolveStyleEnum(filters.style);
    if (styleEnum) {
      where.specializations = {
        has: styleEnum as any,
      };
    }
  }

  if (filters.minPrice !== undefined) {
    where.minPrice = { gte: BigInt(Math.round(filters.minPrice)) };
  }
  if (filters.maxPrice !== undefined) {
    where.minPrice = {
      ...(where.minPrice as object),
      lte: BigInt(Math.round(filters.maxPrice)),
    };
  }

  if (filters.minRating !== undefined) {
    where.satisfactionScore = { gte: filters.minRating };
  }

  // ──────────────────────────────────────────────────────
  // مرتب‌سازی
  // ──────────────────────────────────────────────────────
  let orderBy: Prisma.ArtistProfileOrderByWithRelationInput;
  switch (filters.sortBy) {
    case "rating":
      orderBy = { satisfactionScore: "desc" };
      break;
    case "experience":
      orderBy = { experienceYears: "desc" };
      break;
    case "price_low":
      orderBy = { minPrice: "asc" };
      break;
    case "price_high":
      orderBy = { minPrice: "desc" };
      break;
    case "popularity":
      orderBy = { followerCount: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { satisfactionScore: "desc" };
  }

  // ──────────────────────────────────────────────────────
  // اجرای کوئری
  // ──────────────────────────────────────────────────────
  const [items, totalItems] = await Promise.all([
    db.artistProfile.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        artistName: true,
        shortBio: true,
        experienceYears: true,
        specializations: true,
        minPrice: true,
        maxPrice: true,
        satisfactionScore: true,
        followerCount: true,
        completedBookings: true,
        isVerified: true,
        isAcceptingBookings: true,
        city: true,
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            city: true,
          },
        },
        portfolioItems: {
          where: { status: "PUBLISHED" },
          // آخرین نمونه‌کار (جدیدترین اثر منتشرشده)
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            images: true,
            style: true,
            title: true,
          },
        },
        _count: {
          select: {
            portfolioItems: { where: { status: "PUBLISHED" } },
            followers: true,
          },
        },
      },
    }),
    db.artistProfile.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // یکسان‌سازی تصویر پیش‌نمایش با صفحه الهام‌بخشی (همان resolveSampleImage)
  const mapped = items.map((a) => ({
    ...a,
    portfolioItems: (a.portfolioItems || []).map((p: { images: string[]; style: string; title?: string }) => ({
      ...p,
      images: p.images.map((img, i) =>
        i === 0 ? resolveSampleImage(a.slug, p.style, p.title || "") || img : img
      ),
    })),
  }));

  return {
    items: mapped as ArtistCard[],
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================================================
// دریافت لیست شهرها (برای فیلتر)
// ============================================================================

// لیست پیش‌فرض شهرهای ایران (برای نمایش در فیلتر حتی اگر هنرمندی نباشد)
const IRANIAN_CITIES = [
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
]

export async function getAvailableCities(): Promise<string[]> {
  const cities = await db.artistProfile.findMany({
    where: {
      isAcceptingBookings: true,
      city: { not: null },
      user: { role: "ARTIST", status: "ACTIVE" },
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  const userCities = await db.user.findMany({
    where: {
      role: "ARTIST",
      status: "ACTIVE",
      city: { not: null },
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  const dbCities = new Set<string>();
  cities.forEach((c) => c.city && dbCities.add(c.city));
  userCities.forEach((c) => c.city && dbCities.add(c.city));

  // ترکیب شهرهای دیتابیس با لیست پیش‌فرض
  const allCities = new Set<string>([...IRANIAN_CITIES, ...dbCities]);

  return Array.from(allCities).sort((a, b) => a.localeCompare(b, "fa"));
}

// ============================================================================
// دریافت جزئیات پروفایل هنرمند (برای صفحه [slug])
// ============================================================================

export type ArtistProfileFull = {
  id: string;
  slug: string;
  artistName: string;
  shortBio: string | null;
  fullBio: string | null;
  experienceYears: number | null;
  specializations: string[];
  minPrice: bigint | null;
  maxPrice: bigint | null;
  averageSessionDuration: number;
  satisfactionScore: number;
  followerCount: number;
  completedBookings: number;
  isVerified: boolean;
  isAcceptingBookings: boolean;
  acceptsCustomRequests: boolean;
  city: string | null;
  createdAt: Date;
  userId: string;
  /** تعداد پروژه‌های فعال (سقف ۲) */
  activeBookingCount: number;
  user: {
    displayName: string;
    avatarUrl: string | null;
    city: string | null;
  };
  _count: {
    portfolioItems: number;
    followers: number;
  };
  portfolioItems: {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    style: string;
    size: string | null;
    durationMinutes: number | null;
    price: bigint | null;
    tags: string[];
    likeCount: number;
    saveCount: number;
    publishedAt: Date | null;
  }[];
  services: {
    id: string;
    name: string;
    description: string | null;
    basePrice: bigint;
    maxPrice: bigint | null;
    durationMinutes: number;
    supportedSizes: string[];
    bookingCount: number;
  }[];
  flashTattoos: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    style: string;
    suggestedSize: string;
    price: bigint;
    isAvailable: boolean;
    isExclusive: boolean;
    soldCount: number;
    viewCount: number;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    isVerified: boolean;
    createdAt: Date;
    author: {
      displayName: string;
      avatarUrl: string | null;
    };
  }[];
};

export async function getArtistBySlug(
  slug: string
): Promise<ArtistProfileFull | null> {
  // دریافت پروفایل هنرمند
  const profile = await db.artistProfile.findFirst({
    where: {
      slug,
      // پروفایل‌های هنرمندان تأیید نشده (در انتظار تأیید/غیرفعال) قابل مشاهده نیستند
      user: { role: "ARTIST", status: "ACTIVE" },
    },
    select: {
      id: true,
      slug: true,
      artistName: true,
      shortBio: true,
      fullBio: true,
      experienceYears: true,
      specializations: true,
      minPrice: true,
      maxPrice: true,
      averageSessionDuration: true,
      satisfactionScore: true,
      followerCount: true,
      completedBookings: true,
      isVerified: true,
      isAcceptingBookings: true,
      acceptsCustomRequests: true,
      city: true,
      createdAt: true,
      userId: true,
      _count: {
        select: {
          portfolioItems: true,
          followers: true,
        },
      },
      user: {
        select: {
          displayName: true,
          avatarUrl: true,
          city: true,
        },
      },
      portfolioItems: {
        where: { status: "PUBLISHED" },
        orderBy: { likeCount: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          style: true,
          size: true,
          durationMinutes: true,
          price: true,
          tags: true,
          likeCount: true,
          saveCount: true,
          publishedAt: true,
        },
      },
      services: {
        where: { isActive: true },
        orderBy: { basePrice: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          maxPrice: true,
          durationMinutes: true,
          supportedSizes: true,
          bookingCount: true,
        },
      },
      flashTattoos: {
        where: { isAvailable: true, status: "APPROVED" },
        orderBy: { viewCount: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          style: true,
          suggestedSize: true,
          price: true,
          isAvailable: true,
          isExclusive: true,
          soldCount: true,
          viewCount: true,
        },
      },
    },
  });

  if (!profile) return null;

  // تعداد پروژه‌های فعال هنرمند (سقف ۲ پروژه هم‌زمان)
  const activeBookingCount = await db.booking.count({
    where: {
      artistId: profile.userId,
      status: { in: ["REQUESTED", "PENDING_ARTIST", "CONFIRMED", "IN_PROGRESS", "RESCHEDULE_PENDING"] },
    },
  });

  // دریافت نظرات مرتبط (از طریق userId - نه ArtistProfile)
  const reviews = await db.review.findMany({
    where: { recipientId: profile.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      rating: true,
      comment: true,
      isVerified: true,
      createdAt: true,
      author: {
        select: {
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // ═══════════════════════════════════════════════════════
  // محاسبه خودکار حداقل/حداکثر قیمت از سرویس‌ها
  // ═══════════════════════════════════════════════════════
  const services = profile.services || [];
  let computedMinPrice = profile.minPrice ? Number(profile.minPrice) : null;
  let computedMaxPrice = profile.maxPrice ? Number(profile.maxPrice) : null;

  if (services.length > 0) {
    const basePrices = services
      .map((s) => Number(s.basePrice))
      .filter((p) => p > 0);
    const maxPrices = services
      .map((s) => (s.maxPrice ? Number(s.maxPrice) : 0))
      .filter((p) => p > 0);

    if (basePrices.length > 0) {
      computedMinPrice = Math.min(...basePrices);
    }
    if (maxPrices.length > 0) {
      computedMaxPrice = Math.max(...maxPrices);
    } else if (basePrices.length > 0) {
      computedMaxPrice = Math.max(...basePrices);
    }
  }

  // یکسان‌سازی تصاویر پورتفولیو با صفحه الهام‌بخشی و پنل بازبینی:
  // تصویر اول هر اثر دقیقاً همان تصویری است که inspiration.service نشان می‌دهد.
  const resolvedPortfolio = (profile.portfolioItems || []).map((item) => ({
    ...item,
    images: item.images.map((img, i) =>
      i === 0 ? resolveSampleImage(profile.slug, item.style, item.title) || img : img
    ),
  }));

  return {
    ...profile,
    portfolioItems: resolvedPortfolio,
    minPrice: computedMinPrice,
    maxPrice: computedMaxPrice,
    reviews,
    activeBookingCount,
  } as ArtistProfileFull;
}

// ============================================================================
// دریافت هنرمندان مرتبط
// ============================================================================

export async function getRelatedArtists(
  currentSlug: string,
  styles: string[],
  city: string | null,
  limit: number = 3
): Promise<ArtistCard[]> {
  const artists = await db.artistProfile.findMany({
    where: {
      slug: { not: currentSlug },
      isAcceptingBookings: true,
      user: { role: "ARTIST", status: "ACTIVE" },
      OR: [
        { specializations: { hasSome: styles.map(s => resolveStyleEnum(s) || s).filter(Boolean) as any[] } },
        ...(city
          ? [
              { city: { equals: city, mode: "insensitive" as const } },
              { user: { city: { equals: city, mode: "insensitive" as const } } },
            ]
          : []),
      ],
    },
    orderBy: [{ satisfactionScore: "desc" }, { followerCount: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      artistName: true,
      shortBio: true,
      experienceYears: true,
      specializations: true,
      minPrice: true,
      maxPrice: true,
      satisfactionScore: true,
      followerCount: true,
      completedBookings: true,
      isVerified: true,
      isAcceptingBookings: true,
      city: true,
      user: {
        select: {
          displayName: true,
          avatarUrl: true,
          city: true,
        },
      },
      portfolioItems: {
        where: { status: "PUBLISHED" },
        orderBy: { likeCount: "desc" },
        take: 1,
        select: { images: true, style: true, title: true },
      },
      _count: {
        select: { portfolioItems: true, followers: true },
      },
    },
  });

  const mappedRelated = artists.map((a) => ({
    ...a,
    portfolioItems: (a.portfolioItems || []).map((p: { images: string[]; style: string; title?: string }) => ({
      ...p,
      images: p.images.map((img, i) =>
        i === 0 ? resolveSampleImage(a.slug, p.style, p.title || "") || img : img
      ),
    })),
  }));

  return mappedRelated as ArtistCard[];
}
