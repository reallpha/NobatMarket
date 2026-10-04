// ============================================================================
// سیستم اعلان‌ها - اعلان درون‌برنامه‌ای + stubهای SMS/Email
// ============================================================================
//
// ⚠️ Stage 7: اعلان‌ها اکنون در دیتابیس ذخیره می‌شوند.
// ⚠️ @todo Stage 8: اتصال به Kavehnegar (SMS)، Resend (Email)، FCM (Push)
// ============================================================================

import { db } from "@/lib/db";

export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "BOOKING_RESCHEDULED"
  | "REQUEST_NEW"
  | "REQUEST_QUOTED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYOUT_APPROVED"
  | "PAYOUT_REJECTED"
  | "REVIEW_RECEIVED"
  | "MESSAGE_RECEIVED";

// ============================================================================
// پیام‌های اعلان
// ============================================================================

const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; body: string; dbType: string; link?: string }> = {
  BOOKING_CREATED: {
    title: "رزرو جدید ثبت شد",
    body: "رزرو شما با موفقیت ثبت شد. هنرمند به زودی وضعیت رزرو را بررسی و تأیید خواهد کرد.",
    dbType: "BOOKING",
    link: "/bookings",
  },
  BOOKING_CONFIRMED: {
    title: "رزرو تأیید شد ✅",
    body: "رزرو شما توسط هنرمند تأیید شد. لطفاً در زمان مقرر در استودیو حاضر شوید.",
    dbType: "BOOKING",
    link: "/bookings",
  },
  BOOKING_CANCELLED: {
    title: "رزرو لغو شد ❌",
    body: "رزرو شما لغو شد. در صورت پرداخت وجه، مبلغ به کیف پول شما بازگشت داده خواهد شد.",
    dbType: "WARNING",
    link: "/bookings",
  },
  BOOKING_COMPLETED: {
    title: "رزرو تکمیل شد 🎉",
    body: "رزرو شما با موفقیت تکمیل شد. از تتوی خود لذت ببرید! نظرتان را ثبت کنید.",
    dbType: "SUCCESS",
    link: "/bookings",
  },
  BOOKING_RESCHEDULED: {
    title: "تغییر زمان رزرو 📅",
    body: "زمان رزرو شما تغییر کرد. لطفاً زمان جدید را بررسی کنید.",
    dbType: "BOOKING",
    link: "/bookings",
  },
  REQUEST_NEW: {
    title: "درخواست سفارشی جدید 📨",
    body: "یک مشتری درخواست تتوی سفارشی ارسال کرده است. لطفاً بررسی و قیمت پیشنهاد دهید.",
    dbType: "BOOKING",
  },
  REQUEST_QUOTED: {
    title: "قیمت پیشنهادی ارسال شد 💰",
    body: "هنرمند قیمتی را برای درخواست شما پیشنهاد داده است. لطفاً بررسی و تأیید کنید.",
    dbType: "PAYMENT",
  },
  REQUEST_ACCEPTED: {
    title: "پیشنهاد تأیید شد ✅",
    body: "پیشنهاد قیمت تأیید شد. رزرو شما در حال ثبت نهایی است.",
    dbType: "SUCCESS",
  },
  REQUEST_REJECTED: {
    title: "پیشنهاد رد شد",
    body: "پیشنهاد قیمت رد شد. می‌توانید درخواست جدید ارسال کنید.",
    dbType: "WARNING",
  },
  PAYMENT_SUCCESS: {
    title: "پرداخت موفق ✅",
    body: "پرداخت شما با موفقیت انجام شد. رسید پرداخت در بخش رزروها قابل مشاهده است.",
    dbType: "PAYMENT",
    link: "/bookings",
  },
  PAYMENT_FAILED: {
    title: "پرداخت ناموفق ❌",
    body: "پرداخت شما با مشکل مواجه شد. لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.",
    dbType: "WARNING",
  },
  PAYOUT_APPROVED: {
    title: "درخواست برداشت تأیید شد ✅",
    body: "درخواست برداشت شما تأیید شد. وجه به زودی به حساب شما واریز خواهد شد.",
    dbType: "SUCCESS",
  },
  PAYOUT_REJECTED: {
    title: "درخواست برداشت رد شد",
    body: "درخواست برداشت شما رد شد. لطفاً با پشتیبانی تماس بگیرید.",
    dbType: "WARNING",
  },
  REVIEW_RECEIVED: {
    title: "نظر جدید دریافت شد ⭐",
    body: "یک مشتری نظر جدیدی برای شما ثبت کرده است. نظر آنها را بررسی کنید.",
    dbType: "SUCCESS",
  },
  MESSAGE_RECEIVED: {
    title: "پیام جدید 💬",
    body: "پیام جدیدی از یک کاربر دریافت کردید. برای مشاهده و پاسخ به بخش پیام‌ها مراجعه کنید.",
    dbType: "MESSAGE",
  },
};

// ============================================================================
// ارسال اعلان (ذخیره در دیتابیس)
// ============================================================================

export async function triggerNotification(
  type: NotificationType,
  userId: string,
  data?: Record<string, string>
): Promise<void> {
  if (!userId) return;

  const config = NOTIFICATION_MESSAGES[type];

  // ─── ۱. ذخیره در دیتابیس ───
  try {
    await db.notification.create({
      data: {
        userId,
        title: config.title,
        message: config.body,
        type: config.dbType as any,
        link: config.link || null,
        data: data || undefined,
      },
    });
  } catch (err) {
    console.error("خطا در ذخیره اعلان:", err);
  }

  // ─── ۲. ایجاد تیکت رزرو بین مشتری و هنرمند ───
  if ((type === "BOOKING_CONFIRMED" || type === "BOOKING_CREATED") && data?.bookingId) {
    try {
      const booking = await db.booking.findUnique({
        where: { id: data.bookingId },
        select: {
          id: true,
          bookingNumber: true,
          clientId: true,
          artistId: true,
        },
      });

      if (booking) {
        // Check if ticket already exists for this booking
        const existingTicket = await db.notification.findFirst({
          where: {
            isTicket: true,
            data: { path: ["bookingId"], equals: booking.id },
          },
        });

        if (!existingTicket) {
          const warning = "\n\n⚠️ توجه: رد و بدل کردن اطلاعات تماس، لینک و شماره تلفن در این تیکت ممنوع است. در صورت تخلف، حساب شما به صورت کامل مسدود خواهد شد.";
          const ticketTitle = `گفتگوی رزرو #${booking.bookingNumber}`;
          const ticketMessage = `تیکت گفتگوی رزرو شماره ${booking.bookingNumber} ایجاد شد.\n\nاز اینجا می‌توانید با هنرمند/مشتری در ارتباط باشید.${warning}`;

          // Create ticket for client
          await db.notification.create({
            data: {
              userId: booking.clientId,
              title: ticketTitle,
              message: ticketMessage,
              type: "MESSAGE",
              isTicket: true,
              data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
            },
          });

          // Create ticket for artist (userId is the artist's userId)
          await db.notification.create({
            data: {
              userId: booking.artistId,
              title: ticketTitle,
              message: ticketMessage,
              type: "MESSAGE",
              isTicket: true,
              data: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
            },
          });
        }
      }
    } catch (err) {
      console.error("خطا در ایجاد تیکت رزرو:", err);
    }
  }

  // ─── ۲. لاگ توسعه ───
  console.log(
    `📱 [اعلان] ${type} → کاربر: ${userId}\n` +
    `   عنوان: ${config.title}\n` +
    `   متن: ${config.body}\n` +
    `   داده‌ها: ${JSON.stringify(data || {})}`
  );

  // ─── ۳. @todo Stage 8: ارسال SMS ───
  // await sendSMS(userId, config.body);

  // ─── ۴. @todo Stage 8: ارسال Email ───
  // await sendEmail(userId, config.title, config.body);

  // ─── ۵. @todo Stage 8: ارسال Push ───
  // await sendPushNotification(userId, type, data);
}

// ============================================================================
// Stub: ارسال پیامک (Kavehnegar)
// ============================================================================

/**
 * @todo Stage 8: اتصال به Kavehnegar API
 *
 * @example
 * // نمونه کد اتصال به Kavehnegar:
 * const response = await fetch("https://api.kavehanegar.com/v1/send/verify", {
 *   method: "POST",
 *   headers: {
 *     "Content-Type": "application/json",
 *   },
 *   body: JSON.stringify({
 *     receptor: phone,
 *     template: "نوبت مارکت",
 *     token: otpCode,
 *     type: "sms",
 *   }),
 * });
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  console.log(
    `📱 [SMS Stub] ارسال پیامک به ${phone}:\n` +
    `   متن: ${message}`
  );
}

// ============================================================================
// Stub: ارسال ایمیل (Resend / SendGrid)
// ============================================================================

/**
 * @todo Stage 8: اتصال به Resend API
 *
 * @example
 * const resend = new Resend(process.env.RESEND_API_KEY);
 * await resend.emails.send({
 *   from: "نوبت مارکت <noreply@nobat-market.com>",
 *   to: email,
 *   subject: title,
 *   html: body,
 * });
 */
export async function sendEmail(
  email: string,
  subject: string,
  body: string
): Promise<void> {
  console.log(
    `📧 [Email Stub] ارسال ایمیل به ${email}:\n` +
    `   عنوان: ${subject}\n` +
    `   متن: ${body}`
  );
}
