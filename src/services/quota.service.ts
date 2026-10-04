"use server";

// ============================================================================
// سرویس اشتراک و سهمیه - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/role-guard";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// ثابت‌های پلن
// ============================================================================

// ⚠️ توجه: این فایل "use server" است و فقط می‌تواند async function اکسپورت کند.
// اکسپورت کردن object (مثل این ثابت) باعث خطای زمان اجرای
// "A use server file can only export async functions, found object" می‌شود و
// کل Server Actionهای وابسته (مثل ایجاد نمونه‌کار) را از کار می‌اندازد.
const PLAN_LIMITS = {
  FREE: {
    maxPortfolioItems: 20,
    maxFlashItems: 10,
    label: "رایگان",
  },
  PRO: {
    maxPortfolioItems: 100,
    maxFlashItems: 50,
    label: "حرفه‌ای",
  },
  STUDIO: {
    maxPortfolioItems: 500,
    maxFlashItems: 200,
    label: "استودیو",
  },
} as const;

// ============================================================================
// Server Action: بررسی سهمیه
// ============================================================================

export async function checkQuota(
  artistId: string,
  resourceType: "portfolio" | "flash"
): Promise<ApiResponse<{ allowed: boolean; current: number; max: number; plan: string }>> {
  try {
    const profile = await db.artistProfile.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        plan: true,
        planExpiresAt: true,
        maxPortfolioItems: true,
        maxFlashItems: true,
      },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    // ─── بررسی انقضای پلن ───
    let currentPlan = profile.plan;
    if (profile.planExpiresAt && profile.planExpiresAt < new Date()) {
      currentPlan = "FREE"; // بازگشت به پلن رایگان
      await db.artistProfile.update({
        where: { id: artistId },
        data: { plan: "FREE" },
      });
    }

    // ─── محاسبه سقف بر اساس پلن ───
    const limits = PLAN_LIMITS[currentPlan];
    const max = resourceType === "portfolio" ? limits.maxPortfolioItems : limits.maxFlashItems;

    // ─── شمارش منابع فعلی ───
    let current = 0;
    if (resourceType === "portfolio") {
      current = await db.portfolioItem.count({
        where: { artistProfileId: artistId, status: { not: "ARCHIVED" } },
      });
    } else {
      current = await db.flashTattoo.count({
        where: { artistProfileId: artistId },
      });
    }

    return success("سهمیه بررسی شد", {
      allowed: current < max,
      current,
      max,
      plan: currentPlan,
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا در بررسی سهمیه");
  }
}

// ============================================================================
// Server Action: تغییر پلن هنرمند (ادمین)
// ============================================================================

export async function changeArtistPlan(
  artistId: string,
  newPlan: string,
  expiresAt?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    if (!["FREE", "PRO", "STUDIO"].includes(newPlan)) {
      return error("پلن نامعتبر است");
    }

    const planConfig = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS];

    await db.artistProfile.update({
      where: { id: artistId },
      data: {
        plan: newPlan as any,
        planExpiresAt: expiresAt ? new Date(expiresAt) : null,
        maxPortfolioItems: planConfig.maxPortfolioItems,
        maxFlashItems: planConfig.maxFlashItems,
      },
    });

    return success(`پلن به ${planConfig.label} تغییر کرد`);
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: دریافت اطلاعات پلن هنرمند
// ============================================================================

export async function getMyPlan(): Promise<
  ApiResponse<{
    plan: string;
    planLabel: string;
    expiresAt: string | null;
    portfolio: { current: number; max: number };
    flash: { current: number; max: number };
  }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: {
        id: true,
        plan: true,
        planExpiresAt: true,
        maxPortfolioItems: true,
        maxFlashItems: true,
      },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const [portfolioCount, flashCount] = await Promise.all([
      db.portfolioItem.count({
        where: { artistProfileId: profile.id, status: { not: "ARCHIVED" } },
      }),
      db.flashTattoo.count({
        where: { artistProfileId: profile.id },
      }),
    ]);

    const planConfig = PLAN_LIMITS[profile.plan];

    return success("اطلاعات پلن دریافت شد", {
      plan: profile.plan,
      planLabel: planConfig.label,
      expiresAt: profile.planExpiresAt?.toISOString() ?? null,
      portfolio: { current: portfolioCount, max: profile.maxPortfolioItems },
      flash: { current: flashCount, max: profile.maxFlashItems },
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: دریافت لیست هنرمندان برای مدیریت پلن (ادمین)
// ============================================================================

export async function getArtistsForPlanManagement(): Promise<
  ApiResponse<{
    artists: {
      id: string;
      userId: string;
      artistName: string;
      plan: string;
      planExpiresAt: string | null;
      displayName: string;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ADMIN");
    if (auth.error) return auth.error;

    const artists = await db.artistProfile.findMany({
      orderBy: { artistName: "asc" },
      select: {
        id: true,
        userId: true,
        artistName: true,
        plan: true,
        planExpiresAt: true,
        user: {
          select: { displayName: true },
        },
      },
    });

    return success("هنرمندان دریافت شد", {
      artists: artists.map((a) => ({
        id: a.id,
        userId: a.userId,
        artistName: a.artistName,
        plan: a.plan,
        planExpiresAt: a.planExpiresAt?.toISOString() ?? null,
        displayName: a.user.displayName,
      })),
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}
