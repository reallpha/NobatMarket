"use server";

// ============================================================================
// سرویس درخواست سفارشی - Server Actions
// ============================================================================
//
// ماشین حالت درخواست‌های سفارشی:
// NEW → UNDER_REVIEW → QUOTE_SENT → ACCEPTED / REJECTED
//              ↓
//          REJECTED (توسط هنرمند)
//
// وقتی ACCEPTED شد → به صورت خودکار Booking ایجاد می‌شود
// ============================================================================

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/role-guard";
import { triggerNotification } from "@/lib/notifications";
import { nanoid } from "nanoid";
import type { ApiResponse } from "@/types";

// ============================================================================
// توابع کمکی
// ============================================================================

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

function generateBookingNumber(): string {
  return `TY-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
}

// ============================================================================
// Server Action: ارسال درخواست سفارشی (توسط کلاینت)
// ============================================================================

export async function createCustomRequest(data: {
  artistSlug: string;
  title: string;
  description: string;
  referenceImages?: string[];
  preferredSize?: string;
  preferredStyle?: string;
  bodyPlacement?: string;
  budget?: number;
  preferredStartDate?: string;
  isFlexibleWithDate?: boolean;
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const artistProfile = await db.artistProfile.findUnique({
      where: { slug: data.artistSlug },
      select: { id: true, isAcceptingBookings: true, acceptsCustomRequests: true },
    });

    if (!artistProfile) return error("هنرمند یافت نشد");
    if (!artistProfile.acceptsCustomRequests) {
      return error("این هنرمند درخواست سفارشی نمی‌پذیرد");
    }

    if (!data.title || data.title.length < 3) {
      return error("عنوان باید حداقل ۳ کاراکتر باشد");
    }
    if (!data.description || data.description.length < 10) {
      return error("توضیحات باید حداقل ۱۰ کاراکتر باشد");
    }

    const request = await db.customRequest.create({
      data: {
        clientId: auth.user.id,
        artistId: artistProfile.id,
        title: data.title,
        description: data.description,
        referenceImages: data.referenceImages || [],
        preferredSize: data.preferredSize as any || null,
        preferredStyle: data.preferredStyle as any || null,
        bodyPlacement: data.bodyPlacement || null,
        budget: data.budget ? BigInt(data.budget) : null,
        preferredStartDate: data.preferredStartDate ? new Date(data.preferredStartDate) : null,
        isFlexibleWithDate: data.isFlexibleWithDate ?? true,
        status: "NEW",
      },
      select: { id: true },
    });

    // ─── ارسال اعلان به هنرمند ───
    const artistUser = await db.artistProfile.findUnique({
      where: { id: artistProfile.id },
      select: { userId: true },
    });
    if (artistUser) {
      await triggerNotification("REQUEST_NEW", artistUser.userId, {
        requestId: request.id,
        clientName: auth.user.displayName || "مشتری",
      });
    }

    return success("درخواست با موفقیت ارسال شد", { id: request.id });
  } catch (err) {
    console.error("خطا در ایجاد درخواست:", err);
    return error("خطا در ارسال درخواست");
  }
}

// ============================================================================
// Server Action: دریافت درخواست‌های هنرمند
// ============================================================================

export async function getMyRequests(): Promise<
  ApiResponse<{
    requests: {
      id: string;
      title: string;
      description: string;
      referenceImages: string[];
      preferredSize: string | null;
      preferredStyle: string | null;
      bodyPlacement: string | null;
      budget: bigint | null;
      quotedPrice: bigint | null;
      quoteNotes: string | null;
      status: string;
      createdAt: Date;
      client: { displayName: string; phone: string; avatarUrl: string | null };
    }[];
  }>
> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const requests = await db.customRequest.findMany({
      where: { artistId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        referenceImages: true,
        preferredSize: true,
        preferredStyle: true,
        bodyPlacement: true,
        budget: true,
        quotedPrice: true,
        quoteNotes: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return success("درخواست‌ها دریافت شد", { requests });
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در دریافت درخواست‌ها");
  }
}

// ============================================================================
// Server Action: ارسال قیمت پیشنهادی (توسط هنرمند)
// ============================================================================

export async function sendQuote(
  requestId: string,
  quotedPrice: number,
  quoteNotes: string,
  estimatedDuration?: number
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const request = await db.customRequest.findFirst({
      where: { id: requestId, artistId: profile.id },
    });

    if (!request) return error("درخواست یافت نشد");
    if (request.status !== "NEW" && request.status !== "UNDER_REVIEW") {
      return error("این درخواست قبلاً بررسی شده");
    }

    await db.customRequest.update({
      where: { id: requestId },
      data: {
        quotedPrice: BigInt(quotedPrice),
        quoteNotes,
        quoteExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // ۷ روز
        status: "QUOTE_SENT",
      },
    });

    // ─── ارسال اعلان به مشتری ───
    await triggerNotification("REQUEST_QUOTED", request.clientId, {
      requestId,
      price: BigInt(quotedPrice).toLocaleString("fa-IR") + " تومان",
    });

    return success("قیمت پیشنهادی ارسال شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در ارسال قیمت");
  }
}

// ============================================================================
// Server Action: تأیید قیمت توسط کلاینت
// ============================================================================

export async function acceptQuote(
  requestId: string
): Promise<ApiResponse<{ bookingId: string }>> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const request = await db.customRequest.findFirst({
      where: { id: requestId, clientId: auth.user.id },
      select: { id: true, status: true, quotedPrice: true, artistId: true },
    });

    if (!request) return error("درخواست یافت نشد");
    if (request.status !== "QUOTE_SENT") {
      return error("پیشنهاد قابل تأیید نیست");
    }

    // 🔒 تراکنش: تأیید درخواست + ایجاد رزرو
    const result = await db.$transaction(async (tx) => {
      // به‌روزرسانی وضعیت درخواست
      await tx.customRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // دریافت اطلاعات هنرمند
      const artistProfile = await tx.artistProfile.findUnique({
        where: { id: request.artistId },
        select: { userId: true },
      });

      if (!artistProfile) throw new Error("هنرمند یافت نشد");

      // ایجاد رزرو
      const bookingNumber = generateBookingNumber();
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          clientId: auth.user.id,
          artistId: artistProfile.userId,
          customRequestId: requestId,
          scheduledDate: new Date(), // تاریخ پیش‌فرض - بعداً توسط هنرمند تنظیم می‌شود
          startTime: "10:00",
          endTime: "12:00",
          title: `رزرو سفارشی`,
          agreedPrice: request.quotedPrice,
          status: "REQUESTED",
        },
        select: { id: true },
      });

      return { bookingId: booking.id };
    });

    // ─── ارسال اعلان به هنرمند ───
    await triggerNotification("REQUEST_ACCEPTED", request.artistId, {
      requestId,
    });

    return success("قیمت تأیید شد و رزرو ایجاد شد", result);
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا در تأیید قیمت");
  }
}

// ============================================================================
// Server Action: رد درخواست
// ============================================================================

export async function declineRequest(
  requestId: string,
  reason?: string
): Promise<ApiResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const request = await db.customRequest.findFirst({
      where: {
        id: requestId,
        OR: [{ clientId: auth.user.id }, { artistId: (await db.artistProfile.findUnique({ where: { userId: auth.user.id }, select: { id: true } }))?.id }],
      },
    });

    if (!request) return error("درخواست یافت نشد");

    await db.customRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || null,
      },
    });

    return success("درخواست رد شد");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}

// ============================================================================
// Server Action: بررسی درخواست (هنرمند)
// ============================================================================

export async function markUnderReview(
  requestId: string
): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const request = await db.customRequest.findFirst({
      where: { id: requestId, artistId: profile.id, status: "NEW" },
    });

    if (!request) return error("درخواست یافت نشد یا وضعیت نامعتبر است");

    await db.customRequest.update({
      where: { id: requestId },
      data: { status: "UNDER_REVIEW" },
    });

    return success("درخواست در حال بررسی");
  } catch (err) {
    console.error("خطا:", err);
    return error("خطا");
  }
}
