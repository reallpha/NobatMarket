// ============================================================================
// ایجاد خودکار گفتگو (چت) بین مشتری و هنرمند پس از ثبت/تأیید رزرو
// ============================================================================

import { db } from "@/lib/db";

/**
 * اگر گفتگویی برای این رزرو وجود نداشته باشد، یک گفتگوی دوسویه
 * بین مشتری و هنرمند (مرتبط با bookingId) می‌سازد و به هر دو اعلان می‌فرستد.
 *
 * فقط باید از سمت سرور صدا زده شود (server action / api route).
 */
export async function ensureBookingConversation(bookingId: string): Promise<void> {
  try {
    const existing = await db.conversation.findUnique({
      where: { bookingId },
      select: { id: true },
    });
    if (existing) return;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        clientId: true,
        artistId: true,
      },
    });
    if (!booking) return;

    const title = `گفتگوی رزرو ${booking.bookingNumber}`;

    await db.conversation.create({
      data: {
        bookingId: booking.id,
        title,
        participants: {
          create: [{ userId: booking.clientId }, { userId: booking.artistId }],
        },
      },
    });

    // اعلان به هر دو طرف با لینک مستقیم به صندوق پیام
    await db.notification
      .create({
        data: {
          userId: booking.clientId,
          title: "گفتگو با هنرمند باز شد 💬",
          message: `گفتگوی مستقیم رزرو ${booking.bookingNumber} برای هماهنگی با هنرمند ایجاد شد. برای مشاهده به بخش «پیام‌ها و اعلان‌ها» بروید.`,
          type: "MESSAGE",
          link: "/client/inbox?tab=chat",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
        },
      })
      .catch(() => undefined);

    await db.notification
      .create({
        data: {
          userId: booking.artistId,
          title: "گفتگو با مشتری باز شد 💬",
          message: `گفتگوی مستقیم رزرو ${booking.bookingNumber} برای هماهنگی با مشتری ایجاد شد. برای مشاهده به بخش «پیام‌ها و اعلان‌ها» بروید.`,
          type: "MESSAGE",
          link: "/artist/inbox?tab=chat",
          data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
        },
      })
      .catch(() => undefined);
  } catch (err) {
    console.error("خطا در ایجاد گفتگوی رزرو:", err);
  }
}
