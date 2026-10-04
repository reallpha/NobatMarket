"use server";

// ============================================================================
// سرویس لیست انتظار - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/role-guard";
import { triggerNotification } from "@/lib/notifications";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: اضافه شدن به لیست انتظار
// ============================================================================

export async function joinWaitlist(
  artistId: string,
  preferredStyle?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── بررسی وجود در لیست ───
    const existing = await db.waitlist.findUnique({
      where: {
        userId_artistProfileId: {
          userId: auth.user.id,
          artistProfileId: artistId,
        },
      },
    });

    if (existing) {
      return error("شما قبلاً در لیست انتظار این هنرمند هستید");
    }

    await db.waitlist.create({
      data: {
        userId: auth.user.id,
        artistProfileId: artistId,
        preferredStyle: preferredStyle as any || null,
      },
    });

    return success("شما به لیست انتظار اضافه شدید. هنگام آزاد شدن وقت، به شما اطلاع داده می‌شود.");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: حذف از لیست انتظار
// ============================================================================

export async function leaveWaitlist(artistId: string): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db.waitlist.deleteMany({
      where: {
        userId: auth.user.id,
        artistProfileId: artistId,
      },
    });

    return success("از لیست انتظار خارج شدید");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: بررسی وضعیت لیست انتظار
// ============================================================================

export async function getWaitlistStatus(artistId: string): Promise<
  ApiResponse<{ isWaitlisted: boolean }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const entry = await db.waitlist.findUnique({
      where: {
        userId_artistProfileId: {
          userId: auth.user.id,
          artistProfileId: artistId,
        },
      },
    });

    return success("وضعیت بررسی شد", { isWaitlisted: !!entry });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: ارسال اعلان به لیست انتظار (توسط سیستم)
// ============================================================================

/**
 * این تابع زمانی فراخوانی می‌شود که هنرمند زمان جدیدی اضافه کند.
 * به تمام کاربران در لیست انتظار اعلان ارسال می‌شود.
 */
export async function notifyWaitlist(artistId: string): Promise<void> {
  try {
    const waitlistEntries = await db.waitlist.findMany({
      where: { artistProfileId: artistId },
      select: { userId: true },
    });

    const artist = await db.artistProfile.findUnique({
      where: { id: artistId },
      select: { artistName: true },
    });

    for (const entry of waitlistEntries) {
      await triggerNotification("BOOKING_RESCHEDULED", entry.userId, {
        message: `وقت جدیدی در ${artist?.artistName || "هنرمند"} باز شد!`,
      });
    }

    console.log(
      `📢 اعلان لیست انتظار: ${waitlistEntries.length} کاربر برای هنرمند ${artistId} اعلان دریافت کردند`
    );
  } catch (err) {
    console.error("خطا در ارسال اعلان لیست انتظار:", err);
  }
}
