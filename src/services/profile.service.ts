"use server";

// ============================================================================
// سرویس مدیریت پروفایل - Server Actions
// به‌روزرسانی پروفایل کاربر و ایجاد پروفایل هنرمند
// ============================================================================

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/role-guard";
import {
  updateUserProfileSchema,
  createArtistProfileSchema,
  updateArtistProfileSchema,
} from "@/lib/validators";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types";

// ============================================================================
// توابع کمکی
// ============================================================================

/** پاسخ موفق */
function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

/** پاسخ خطا */
function error(message: string, errors?: Record<string, string[]>): ApiResponse<never> {
  return { success: false, message, errors } as ApiResponse<never>;
}

// ============================================================================
// Server Action: به‌روزرسانی پروفایل کاربر
// ============================================================================

export async function updateUserProfile(formData: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  province?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  postalCode?: string;
  avatarUrl?: string;
}): Promise<ApiResponse<{ user: { id: string; displayName: string; avatarUrl: string | null } }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const updateData: Record<string, unknown> = {};
    if (formData.name !== undefined) updateData.displayName = formData.name;
    if (formData.firstName !== undefined) updateData.firstName = formData.firstName;
    if (formData.lastName !== undefined) updateData.lastName = formData.lastName;
    if (formData.email !== undefined) updateData.email = formData.email || null;
    if (formData.city !== undefined) updateData.city = formData.city || null;
    if (formData.province !== undefined) updateData.province = formData.province || null;
    if (formData.gender !== undefined) updateData.gender = formData.gender || null;
    if (formData.dateOfBirth !== undefined) updateData.dateOfBirth = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;
    if (formData.address !== undefined) updateData.address = formData.address || null;
    if (formData.postalCode !== undefined) updateData.postalCode = formData.postalCode || null;
    if (formData.avatarUrl !== undefined) updateData.avatarUrl = formData.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return error("هیچ فیلدی برای به‌روزرسانی ارسال نشد");
    }

    const updatedUser = await db.user.update({
      where: { id: auth.user.id },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return success("پروفایل با موفقیت به‌روزرسانی شد", { user: updatedUser });
  } catch (err) {
    console.error("خطا در به‌روزرسانی پروفایل:", err);
    return error("خطا در به‌روزرسانی پروفایل. لطفاً مجدداً تلاش کنید");
  }
}

// ============================================================================
// Server Action: ایجاد پروفایل هنرمند
// ============================================================================

export async function createArtistProfile(formData: {
  bio: string;
  city: string;
  styles: string[];
  experienceYears: number;
  basePrice: number;
  studioId?: string;
}): Promise<ApiResponse<{ artistProfileId: string; slug: string }>> {
  try {
    // بررسی نقش - فقط ARTIST می‌تواند پروفایل هنرمند بسازد
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    // اعتبارسنجی ورودی
    const parsed = createArtistProfileSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });
      return error("اطلاعات وارد شده معتبر نیست", fieldErrors);
    }

    const { bio, city, styles, experienceYears, basePrice, studioId } = parsed.data;

    // بررسی وجود پروفایل هنرمند قبلی
    const existingProfile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (existingProfile) {
      return error("پروفایل هنرمند شما قبلاً ایجاد شده است");
    }

    // تولید slug یکتا
    const baseSlug = slugify(auth.user.displayName);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSlug = await db.artistProfile.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // ایجاد پروفایل هنرمند
    const artistProfile = await db.artistProfile.create({
      data: {
        userId: auth.user.id,
        artistName: auth.user.displayName,
        slug,
        shortBio: bio.substring(0, 150),
        fullBio: bio,
        specializations: styles as any[],
        experienceYears,
        minPrice: BigInt(Math.round(basePrice || 0)),
        isVerified: false,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        platformFeePercent: 15.0,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    // اتصال به استودیو (در صورت انتخاب)
    if (studioId) {
      const studio = await db.studio.findUnique({
        where: { id: studioId },
        select: { id: true },
      });

      if (studio) {
        await db.studioArtist.create({
          data: {
            artistProfileId: artistProfile.id,
            studioId: studio.id,
            isActive: true,
            studioSharePercent: 30.0,
          },
        });
      }
    }

    return success("پروفایل هنرمند با موفقیت ایجاد شد", {
      artistProfileId: artistProfile.id,
      slug: artistProfile.slug,
    });
  } catch (err) {
    console.error("خطا در ایجاد پروفایل هنرمند:", err);
    return error("خطا در ایجاد پروفایل هنرمند. لطفاً مجدداً تلاش کنید");
  }
}

// ============================================================================
// Server Action: به‌روزرسانی پروفایل هنرمند
// ============================================================================

export async function updateArtistProfile(formData: {
  bio?: string;
  city?: string;
  styles?: string[];
  experienceYears?: number;
  basePrice?: number;
  studioId?: string;
}): Promise<ApiResponse<{ artistProfile: { id: string; slug: string } }>> {
  try {
    // بررسی نقش
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    // اعتبارسنجی ورودی
    const parsed = updateArtistProfileSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });
      return error("اطلاعات وارد شده معتبر نیست", fieldErrors);
    }

    // جستجوی پروفایل موجود
    const existingProfile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true, slug: true },
    });

    if (!existingProfile) {
      return error("پروفایل هنرمند یافت نشد. ابتدا پروفایل خود را ایجاد کنید");
    }

    const { bio, city, styles, experienceYears, basePrice } = parsed.data;

    // آماده‌سازی داده‌های به‌روزرسانی
    const updateData: Record<string, any> = {};
    if (bio !== undefined) {
      updateData.shortBio = bio.substring(0, 150);
      updateData.fullBio = bio;
    }
    if (city !== undefined) updateData.city = city;
    if (styles !== undefined) updateData.specializations = styles;
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
    if (basePrice !== undefined) updateData.minPrice = BigInt(Math.round(basePrice));

    // به‌روزرسانی پروفایل
    const updatedProfile = await db.artistProfile.update({
      where: { id: existingProfile.id },
      data: updateData,
      select: {
        id: true,
        slug: true,
      },
    });

    return success("پروفایل هنرمند با موفقیت به‌روزرسانی شد", {
      artistProfile: updatedProfile,
    });
  } catch (err) {
    console.error("خطا در به‌روزرسانی پروفایل هنرمند:", err);
    return error("خطا در به‌روزرسانی پروفایل هنرمند. لطفاً مجدداً تلاش کنید");
  }
}

// ============================================================================
// Server Action: دریافت پروفایل کاربر
// ============================================================================

export async function getUserProfile(): Promise<
  ApiResponse<{
    user: {
      id: string;
      phone: string;
      displayName: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      role: string;
      status: string;
      city: string | null;
      gender: string | null;
    };
    artistProfile: {
      id: string;
      slug: string;
      artistName: string;
      shortBio: string | null;
      fullBio: string | null;
      experienceYears: number | null;
      specializations: string[];
      minPrice: number | null;
      followerCount: number;
      completedBookings: number;
      isVerified: boolean;
    } | null;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const profile = await db.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        phone: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        city: true,
        gender: true,
        artistProfile: {
          select: {
            id: true,
            slug: true,
            artistName: true,
            shortBio: true,
            fullBio: true,
            experienceYears: true,
            specializations: true,
            minPrice: true,
            followerCount: true,
            completedBookings: true,
            isVerified: true,
          },
        },
      },
    });

    if (!profile) {
      return error("پروفایل کاربر یافت نشد");
    }

    return success("پروفایل با موفقیت دریافت شد", {
      user: {
        id: profile.id,
        phone: profile.phone,
        displayName: profile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        status: profile.status,
        city: profile.city,
        gender: profile.gender,
      },
      artistProfile: profile.artistProfile
        ? {
            ...profile.artistProfile,
            minPrice: profile.artistProfile.minPrice
              ? Number(profile.artistProfile.minPrice)
              : null,
          }
        : null,
    });
  } catch (err) {
    console.error("خطا در دریافت پروفایل:", err);
    return error("خطا در دریافت پروفایل");
  }
}

// ============================================================================
// Server Action: دریافت آمار داشبورد
// ============================================================================

export async function getDashboardStats(): Promise<
  ApiResponse<{
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    unreadMessages: number;
    savedPortfolios: number;
    followerCount: number;
    totalEarnings: number;
    averageRating: number;
    artistProfileExists: boolean;
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // دریافت اطلاعات کاربر با آمار
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: {
        totalBookings: true,
        averageRating: true,
        reviewCount: true,
        artistProfile: {
          select: {
            id: true,
            completedBookings: true,
            followerCount: true,
            totalEarnings: true,
          },
        },
      },
    });

    if (!user) {
      return error("کاربر یافت نشد");
    }

    // شمارش رزروهای در انتظار
    const pendingBookings = await db.booking.count({
      where: {
        OR: [
          { clientId: auth.user.id, status: "REQUESTED" },
          { artistId: auth.user.id, status: "REQUESTED" },
        ],
      },
    });

    // شمارش پیام‌های خوانده نشده
    const unreadMessages = await db.conversationParticipant.aggregate({
      where: { userId: auth.user.id },
      _sum: { unreadCount: true },
    });

    // شمارش علاقه‌مندی‌ها
    const savedPortfolios = await db.savedPortfolio.count({
      where: { userId: auth.user.id },
    });

    return success("آمار داشبورد دریافت شد", {
      totalBookings: user.totalBookings,
      completedBookings: user.artistProfile?.completedBookings || 0,
      pendingBookings,
      unreadMessages: unreadMessages._sum.unreadCount || 0,
      savedPortfolios,
      followerCount: user.artistProfile?.followerCount || 0,
      totalEarnings: user.artistProfile
        ? Number(user.artistProfile.totalEarnings)
        : 0,
      averageRating: user.averageRating,
      artistProfileExists: !!user.artistProfile,
    });
  } catch (err) {
    console.error("خطا در دریافت آمار داشبورد:", err);
    return error("خطا در دریافت آمار داشبورد");
  }
}
