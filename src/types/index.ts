// ============================================================================
// تعریف تایپ‌های سراسری - نوبت مارکت
// ============================================================================

import { type Prisma } from "@prisma/client";

// ============================================================================
// تایپ‌های عمومی
// ============================================================================

/**
 * پاسخ استاندارد API
 */
export interface ApiResponse<T = unknown> {
  /** آیا درخواست موفقیت‌آمیز بود */
  success: boolean;
  /** پیام */
  message?: string;
  /** داده */
  data?: T;
  /** خطاها */
  errors?: Record<string, string[]>;
}

/**
 * پاسخ صفحه‌بندی شده
 */
export interface PaginatedResponse<T> {
  /** لیست آیتم‌ها */
  items: T[];
  /** شماره صفحه فعلی */
  page: number;
  /** تعداد آیتم در هر صفحه */
  pageSize: number;
  /** تعداد کل آیتم‌ها */
  totalItems: number;
  /** تعداد کل صفحات */
  totalPages: number;
  /** آیا صفحه بعدی وجود دارد */
  hasNextPage: boolean;
  /** آیا صفحه قبلی وجود دارد */
  hasPreviousPage: boolean;
}

/**
 * فیلتر جستجوی هنرمند
 */
export interface ArtistSearchFilters {
  /** متن جستجو */
  query?: string;
  /** شهر */
  city?: string;
  /** سبک تتو */
  style?: TattooStyleFilter;
  /** حداقل تجربه */
  minExperience?: number;
  /** حداکثر قیمت */
  maxPrice?: number;
  /** فقط تأیید شده‌ها */
  verifiedOnly?: boolean;
  /** فقط در حال پذیرش */
  acceptingBookings?: boolean;
  /** مرتب‌سازی */
  sortBy?: "rating" | "experience" | "price" | "popularity" | "newest";
  /** ترتیب */
  sortOrder?: "asc" | "desc";
  /** شماره صفحه */
  page?: number;
  /** تعداد در هر صفحه */
  pageSize?: number;
}

/**
 * فیلتر جستجوی استودیو
 */
export interface StudioSearchFilters {
  query?: string;
  city?: string;
  verifiedOnly?: boolean;
  sortBy?: "rating" | "popularity" | "newest";
  page?: number;
  pageSize?: number;
}

// ============================================================================
// تایپ‌های فرم
// ============================================================================

/**
 * داده فرم ورود
 */
export interface LoginFormData {
  phone: string;
  password: string;
}

/**
 * داده فرم ثبت‌نام
 */
export interface RegisterFormData {
  phone: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: "CLIENT" | "ARTIST";
}

/**
 * داده تأیید کد
 */
export interface VerifyCodeFormData {
  code: string;
  phone: string;
}

// ============================================================================
// تایپ‌های سیستمی
// ============================================================================

/**
 * سبک تتو (فیلتر)
 */
export type TattooStyleFilter =
  | "BLACKWORK"
  | "REALISM"
  | "GEOMETRIC"
  | "MINIMAL"
  | "ABSTRACT"
  | "OLD_SCHOOL"
  | "NEO_TRADITIONAL"
  | "BLACK_AND_GREY"
  | "COLOR"
  | "LINE_ART"
  | "DOTWORK"
  | "JAPANESE"
  | "TRIBAL"
  | "WATERCOLOR"
  | "LETTERING"
  | "OTHER";

/**
 * تم رنگی
 */
export type Theme = "dark" | "light" | "system";

/**
 * جهت زبان
 */
export type Direction = "rtl" | "ltr";

/**
 * اندازه صفحه نمایش
 */
export type ScreenSize = "mobile" | "tablet" | "desktop" | "wide";

/**
 * وضعیت لودینگ
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * وضعیت فرم
 */
export type FormStatus = "idle" | "submitting" | "success" | "error";

// ============================================================================
// تایپ‌های سفارشی Prisma
// ============================================================================

/**
 * پروفایل هنرمند با اطلاعات کامل (برای نمایش عمومی)
 */
export type ArtistProfileWithUser = Prisma.ArtistProfileGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        displayName: true;
        avatarUrl: true;
        city: true;
      };
    };
  };
}>;

/**
 * آیتم پورتفولیو با اطلاعات هنرمند
 */
export type PortfolioItemWithArtist = Prisma.PortfolioItemGetPayload<{
  include: {
    artistProfile: {
      include: {
        user: {
          select: {
            displayName: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;

/**
 * رزرو با اطلاعات کامل
 */
export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    client: {
      select: {
        id: true;
        displayName: true;
        avatarUrl: true;
        phone: true;
      };
    };
    artist: {
      select: {
        id: true;
        displayName: true;
        avatarUrl: true;
        artistProfile: {
          select: {
            artistName: true;
            slug: true;
          };
        };
      };
    };
    studio: {
      select: {
        id: true;
        name: true;
        address: true;
        city: true;
      };
    };
    service: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

/**
 * پیام با اطلاعات فرستنده
 */
export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        displayName: true;
        avatarUrl: true;
      };
    };
  };
}>;
