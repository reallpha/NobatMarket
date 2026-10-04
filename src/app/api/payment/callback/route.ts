// ============================================================================
// Callback Route: پرداخت Zarinpal
// ============================================================================
//
// این Route Handler توسط زرین‌پال پس از پرداخت فراخوانی می‌شود.
// 1. دریافت authority و status از query params
// 2. تأیید پرداخت با زرین‌پال
// 3. به‌روزرسانی وضعیت رزرو و پرداخت
// 4. پردازش کیف پول هنرمند
// 5. ریدایرکت کاربر به صفحه نتیجه
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payment";
import { recordPlatformFeeOnDeposit, settleCompletedBooking } from "@/lib/booking-rules";
import { publicUrl } from "@/lib/request-origin";

/**
 * خواندن یک پارامتر از query string بدون حساسیت به بزرگی و کوچکی حروف.
 *
 * ⚠️ زرین‌پال پارامترها را با حرف بزرگ برمی‌گرداند:
 *    http://www.yoursite.ir/?Authority=A000...&Status=OK
 * قبلاً کد با `searchParams.get("authority")` می‌خواند که حساس به حروف است و
 * مقدار را null برمی‌گرداند؛ نتیجه: پیام «payment=invalid» و هیچ پرداختی ثبت نمی‌شد.
 * (مستندات: https://www.zarinpal.com/docs/paymentGateway/connectToGateway)
 */
function readParam(searchParams: URLSearchParams, names: string[]): string | null {
  for (const name of names) {
    const value = searchParams.get(name);
    if (value) return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authority = readParam(searchParams, ["Authority", "authority", "AUTHORITY"]);
  const status = readParam(searchParams, ["Status", "status", "STATUS"]);
  // پارامتر اختیاری است؛ فقط برای این‌که کاربر به همان رزرو برگردد
  const bookingIdHint = readParam(searchParams, ["bookingId", "BookingId", "bookingid"]);

  // تاریخچه استفاده از متغیر برای قابل‌دسترس بودن در بلوک catch
  let resolvedBookingId: string | null = bookingIdHint;

  // ─── اعتبارسنجی پارامترها ───
  if (!authority || !status) {
    console.error(
      `[payment/callback] پارامترهای ناقص — Authority=${authority} Status=${status}`
    );
    const target = publicUrl(request, "/client/payments");
    target.searchParams.set("payment", "invalid");
    if (bookingIdHint) target.searchParams.set("booking", bookingIdHint);
    return NextResponse.redirect(target);
  }

  try {
    const provider = await getPaymentProvider();

    // ─── پیدا کردن پرداخت فقط با authority ───
    // authority یکتاست، پس نیازی به bookingId در آدرس بازگشت نداریم
    // (و همین باعث می‌شود اگر درگاه پارامتری را جابه‌جا برگرداند، خراب نشود).
    const payment = await db.payment.findFirst({
      where: { gatewayTransactionId: authority },
      select: { id: true, amount: true, status: true, purpose: true, bookingId: true },
    });

    if (!payment) {
      console.error(
        `[payment/callback] پرداختی با authority=${authority} یافت نشد (bookingId hint=${bookingIdHint})`
      );
      const target = publicUrl(request, "/client/payments");
      target.searchParams.set("payment", "error");
      if (bookingIdHint) target.searchParams.set("booking", bookingIdHint);
      return NextResponse.redirect(target);
    }

    const bookingId = payment.bookingId;
    resolvedBookingId = bookingId;

    // ─── جلوگیری از پردازش تکراری (idempotency) ───
    // اگر قبلاً PAID شده، دوباره verify نزنیم
    if (payment.status === "PAID") {
      return NextResponse.redirect(
        publicUrl(request, `/client/payments?booking=${bookingId}&payment=success`)
      );
    }

    // ─── تبدیل مبلغ به ریال (API v4 به ریال نیاز دارد) ───
    const amountInRials = Number(payment.amount) * 10;

    // ─── تأیید پرداخت نزد زرین‌پال ───
    const verification = await provider.verifyPayment({
      authority,
      status,
      amount: amountInRials,
    });

    if (!verification.success) {
      // ─── پرداخت ناموفق ───
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.redirect(
        publicUrl(request, `/client/payments?booking=${bookingId}&payment=failed`)
      );
    }

    // ─── پرداخت موفق ───
    // به‌روزرسانی رکورد پرداخت
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        gatewayRefId: verification.refId,
        trackingCode: verification.refId,
        paidAt: new Date(),
        gatewayResponse: { refId: verification.refId, cardPan: verification.cardPan },
      },
    });

    // ─── منطق زنجیره تأیید: بیعانه فقط قفل تأیید را باز می‌کند (تأیید خودکار نداریم) ───
    if (payment) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, bookingNumber: true, clientId: true, artistId: true, status: true },
      });

      if (payment.purpose === "DEPOSIT" && booking) {
        // سهم پلتفرم (درصد بیعانه تنظیم‌شده) همان ابتدا ثبت می‌شود
        await recordPlatformFeeOnDeposit(bookingId, booking.artistId, payment.amount);
        await db.notification.create({
          data: {
            userId: booking.clientId,
            title: "بیعانه پرداخت شد ✅",
            message: `بیعانه رزرو ${booking.bookingNumber} دریافت شد و درخواست شما برای بررسی به مدیریت ارسال شد.`,
            type: "PAYMENT",
            link: "/client/payments",
            data: { bookingId },
          },
        }).catch(() => undefined);

        // ─── اعلان به مدیران: درخواست حالا آماده تأیید است ───
        try {
          const admins = await db.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });
          await Promise.all(
            admins.map((a) =>
              db.notification
                .create({
                  data: {
                    userId: a.id,
                    title: "بیعانه دریافت شد — در انتظار تأیید شما",
                    message: `مشتری بیعانه رزرو ${booking.bookingNumber} را پرداخت کرد. حالا می‌توانید رزرو را تأیید کنید تا به هنرمند ارسال شود.`,
                    type: "BOOKING",
                    link: "/admin/bookings",
                    data: { bookingId, status: "REQUESTED" },
                  },
                })
                .catch(() => undefined)
            )
          );
        } catch {
          /* بی‌اهمیت */
        }
      } else if (booking) {
        await db.notification.create({
          data: {
            userId: booking.artistId,
            title: "باقی‌مانده پرداخت شد ✅",
            message: `مشتری باقی‌مانده رزرو ${booking.bookingNumber} را پرداخت کرد.`,
            type: "PAYMENT",
            link: "/artist/dashboard/payments",
            data: { bookingId },
          },
        }).catch(() => undefined);
      }

      // اگر پروژه تکمیل شده، سهم هنرمند تسویه شود
      if (booking?.status === "COMPLETED") {
        await settleCompletedBooking(bookingId);
      }
    }

    return NextResponse.redirect(
      publicUrl(request, `/client/payments?booking=${bookingId}&payment=success`)
    );
  } catch (error) {
    console.error("خطا در callback پرداخت:", error);
    const target = publicUrl(request, "/client/payments");
    target.searchParams.set("payment", "error");
    if (resolvedBookingId) target.searchParams.set("booking", resolvedBookingId);
    return NextResponse.redirect(target);
  }
}
