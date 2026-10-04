"use server";

// ============================================================================
// سرویس نظرات و امتیازات - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/role-guard";
import { triggerNotification } from "@/lib/notifications";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: ثبت نظر
// ============================================================================

export async function leaveReview(data: {
  bookingId: string;
  rating: number;
  /** امتیاز ۰ تا ۱۰۰ — معیار اصلی پروفایل؛ در صورت ارسال، rating از روی آن محاسبه می‌شود */
  score100?: number;
  creativityRating?: number;
  professionalismRating?: number;
  cleanlinessRating?: number;
  comment: string;
}): Promise<ApiResponse<{ reviewId: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // ─── اعتبارسنجی امتیاز ───
    let rating = data.rating;
    let score: number | null = null;
    if (data.score100 !== undefined && data.score100 !== null) {
      const s = Math.round(Number(data.score100));
      if (!Number.isFinite(s) || s < 0 || s > 100) {
        return error("امتیاز باید بین ۰ تا ۱۰۰ باشد");
      }
      score = s;
      rating = Math.min(5, Math.max(1, Math.round(s / 20)));
    } else if (rating < 1 || rating > 5) {
      return error("امتیاز باید بین ۱ تا ۵ باشد");
    }
    if (!data.comment || data.comment.length < 5) {
      return error("نظر باید حداقل ۵ کاراکتر باشد");
    }

    // ─── بررسی رزرو ───
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      select: {
        id: true,
        clientId: true,
        artistId: true,
        status: true,
      },
    });

    if (!booking) return error("رزرو یافت نشد");
    if (booking.clientId !== auth.user.id) return error("دسترسی ندارید");
    if (booking.status !== "COMPLETED") {
      return error("فقط برای رزروهای تکمیل شده می‌توان نظر ثبت کرد");
    }

    // ─── بررسی وجود نظر قبلی ───
    const existingReview = await db.review.findFirst({
      where: {
        bookingId: data.bookingId,
        authorId: auth.user.id,
      },
    });

    if (existingReview) {
      return error("شما قبلاً برای این رزرو نظر ثبت کرده‌اید");
    }

    // ─── ایجاد نظر ───
    const review = await db.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          authorId: auth.user.id,
          recipientId: booking.artistId,
          bookingId: booking.id,
          rating,
          score,
          creativityRating: data.creativityRating || null,
          professionalismRating: data.professionalismRating || null,
          cleanlinessRating: data.cleanlinessRating || null,
          comment: data.comment,
          isVerified: true,
        },
        select: { id: true },
      });

      // ─── به‌روزرسانی آمار هنرمند ───
      const artistProfile = await tx.artistProfile.findFirst({
        where: { userId: booking.artistId },
        select: { id: true, satisfactionScore: true },
      });

      if (artistProfile) {
        // امتیاز رضایت ۰ تا ۱۰۰: میانگین scoreها (در نبود score، از rating نگاشت‌شده)
        const allReviews = await tx.review.findMany({
          where: { recipientId: booking.artistId },
          select: { rating: true, score: true },
        });

        const values = allReviews.map((r) => (typeof r.score === "number" ? r.score : Math.round((r.rating / 5) * 100)));
        const satisfactionScore = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: { satisfactionScore },
        });

        await tx.user.update({
          where: { id: booking.artistId },
          data: { averageRating: Math.round(avgRating * 10) / 10 },
        });
      }

      // ─── به‌روزرسانی آمار کاربر ───
      await tx.user.update({
        where: { id: booking.artistId },
        data: {
          reviewCount: { increment: 1 },
        },
      });

      return rev;
    });

    // ─── ارسال اعلان ───
    await triggerNotification("REVIEW_RECEIVED", booking.artistId, {
      reviewerName: auth.user.displayName || "مشتری",
      bookingId: booking.id,
    });

    return success("نظر شما ثبت شد", { reviewId: review.id });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا در ثبت نظر");
  }
}

// ============================================================================
// Server Action: وضعیت امتیازدهی رزرو (برای نمایش در صفحه چت)
// ============================================================================

export async function getBookingRatingState(
  bookingId: string
): Promise<
  ApiResponse<{ show: boolean; bookingNumber: string; status: string }>
> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, bookingNumber: true, clientId: true, status: true },
    });
    if (!booking) return error("رزرو یافت نشد");

    if (booking.clientId !== auth.user.id || booking.status !== "COMPLETED") {
      return success("وضعیت امتیاز", { show: false, bookingNumber: booking.bookingNumber, status: booking.status });
    }

    const existing = await db.review.findFirst({
      where: { bookingId, authorId: auth.user.id },
      select: { id: true },
    });

    return success("وضعیت امتیاز", {
      show: !existing,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
    });
  } catch (err: any) {
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: دریافت نظرات یک هنرمند
// ============================================================================

export async function getArtistReviews(
  artistId: string,
  page: number = 1,
  limit: number = 10
): Promise<
  ApiResponse<{
    reviews: {
      id: string;
      rating: number;
      creativityRating: number | null;
      professionalismRating: number | null;
      cleanlinessRating: number | null;
      comment: string;
      artistReply: string | null;
      createdAt: string;
      author: { displayName: string; avatarUrl: string | null };
    }[];
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }>
> {
  try {
    const [reviews, total, allRatings] = await Promise.all([
      db.review.findMany({
        where: { recipientId: artistId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { displayName: true, avatarUrl: true },
          },
        },
      }),
      db.review.count({ where: { recipientId: artistId } }),
      db.review.findMany({
        where: { recipientId: artistId },
        select: { rating: true },
      }),
    ]);

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return success("نظرات دریافت شد", {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        creativityRating: r.creativityRating,
        professionalismRating: r.professionalismRating,
        cleanlinessRating: r.cleanlinessRating,
        comment: r.comment,
        artistReply: r.artistReply,
        createdAt: r.createdAt.toISOString(),
        author: r.author,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: total,
      ratingDistribution,
    });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت نظرات");
  }
}

// ============================================================================
// Server Action: پاسخ هنرمند به نظر
// ============================================================================

export async function replyToReview(
  reviewId: string,
  reply: string
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { recipientId: true },
    });

    if (!review || review.recipientId !== auth.user.id) {
      return error("دسترسی ندارید");
    }

    await db.review.update({
      where: { id: reviewId },
      data: {
        artistReply: reply,
        artistReplyAt: new Date(),
      },
    });

    return success("پاسخ شما ثبت شد");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: بررسی امکان ثبت نظر برای یک رزرو
// ============================================================================

export async function canLeaveReview(
  bookingId: string
): Promise<ApiResponse<{ canReview: boolean; reason?: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true, status: true },
    });

    if (!booking) return error("رزرو یافت نشد");
    if (booking.clientId !== auth.user.id) {
      return success("امکان ثبت نظر", { canReview: false, reason: "شما مالک این رزرو نیستید" });
    }
    if (booking.status !== "COMPLETED") {
      return success("امکان ثبت نظر", { canReview: false, reason: "فقط رزروهای تکمیل شده قابل نظر هستند" });
    }

    const existing = await db.review.findFirst({
      where: { bookingId, authorId: auth.user.id },
    });

    if (existing) {
      return success("امکان ثبت نظر", { canReview: false, reason: "شما قبلاً نظر ثبت کرده‌اید" });
    }

    return success("امکان ثبت نظر", { canReview: true });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}
