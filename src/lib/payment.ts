// ============================================================================
// دروازه پرداخت - Zarinpal + Mock Provider
// ============================================================================
//
// حالت پرداخت با تنظیمات سیستم تعیین می‌شود (تب «پرداخت» در پنل مدیریت):
//   PAYMENT_MODE = "zarinpal" | "mock"
//   ZARINPAL_MERCHANT_ID | ZARINPAL_SANDBOX | ZARINPAL_CALLBACK_URL
//
// اگر تنظیمات در دیتابیس نبود، به‌عنوان جایگزین از متغیرهای محیطی استفاده می‌شود.
// ⚠️ قبلاً فقط متغیرهای محیطی خوانده می‌شد و هر مقداری که ادمین در پنل ذخیره
//    می‌کرد بی‌اثر بود.
// ============================================================================

import { nanoid } from "nanoid";
import { APP_URL } from "@/constants";
import { db } from "@/lib/db";

// ============================================================================
// تایپ‌ها
// ============================================================================

export type PaymentMode = "mock" | "zarinpal";

export interface PaymentRequest {
  amount: bigint; // مبلغ به تومان
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
}

export interface PaymentResponse {
  authority: string;
  url: string;
}

export interface VerificationRequest {
  authority: string;
  status: string;
  /** مبلغ تراکنش به ریال — الزامی برای API v4 */
  amount: number;
}

export interface VerificationResponse {
  success: boolean;
  refId: string;
  cardPan?: string;
  amount?: bigint;
  message: string;
}

export interface IPaymentProvider {
  requestPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(request: VerificationRequest): Promise<VerificationResponse>;
}

/** تنظیمات مؤثر درگاه پرداخت */
export interface PaymentConfig {
  mode: PaymentMode;
  merchantId: string;
  sandbox: boolean;
  /** اگر ادمین آدرس بازگشت دستی وارد کرده باشد */
  callbackUrlOverride: string;
  /** آیا کلید درگاه معتبر به‌نظر می‌رسد؟ */
  merchantIdValid: boolean;
}

// ============================================================================
// خواندن تنظیمات (دیتابیس → متغیر محیطی)
// ============================================================================

async function readSetting(key: string): Promise<string | undefined> {
  try {
    const row = await db.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    const value = row?.value?.trim();
    return value ? value : undefined;
  } catch {
    return undefined;
  }
}

/** کلید زرین‌پال یک UUID ۳۶ کاراکتری است */
const MERCHANT_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * خواندن تنظیمات مؤثر درگاه پرداخت.
 * اولویت: تنظیمات دیتابیس ← متغیر محیطی ← مقدار پیش‌فرض
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  const [modeSetting, merchantSetting, sandboxSetting, callbackSetting] =
    await Promise.all([
      readSetting("PAYMENT_MODE"),
      readSetting("ZARINPAL_MERCHANT_ID"),
      readSetting("ZARINPAL_SANDBOX"),
      readSetting("ZARINPAL_CALLBACK_URL"),
    ]);

  const rawMode = (modeSetting || process.env.PAYMENT_MODE || "mock").toLowerCase();
  const mode: PaymentMode = rawMode === "zarinpal" ? "zarinpal" : "mock";

  const merchantId = merchantSetting || process.env.ZARINPAL_MERCHANT_ID || "";
  const sandboxRaw = sandboxSetting ?? process.env.ZARINPAL_SANDBOX ?? "true";

  return {
    mode,
    merchantId,
    sandbox: sandboxRaw === "true",
    callbackUrlOverride: callbackSetting || process.env.ZARINPAL_CALLBACK_URL || "",
    merchantIdValid: MERCHANT_ID_PATTERN.test(merchantId),
  };
}

// ============================================================================
// Zarinpal Provider
// ============================================================================

// ─── کدهای خطای رسمی زرین‌پال ───
// منبع: https://www.zarinpal.com/docs/paymentGateway/errorList
// این پیام‌ها مستقیماً از مستندات رسمی ترجمه شده‌اند تا کاربر/ادمین بفهمد مشکل چیست.
const ZARINPAL_ERROR_MESSAGES: Record<string, string> = {
  "-9": "خطای اعتبارسنجی: یکی از موارد مرچنت کد، آدرس بازگشت (callback)، توضیحات یا مبلغ نادرست است یا وارد نشده",
  "-10": "آی‌پی یا مرچنت کد پذیرنده صحیح نیست",
  "-11": "مرچنت کد فعال نیست؛ مشکل خود را به امور مشتریان زرین‌پال ارجاع دهید",
  "-12": "تلاش بیش از حد مجاز در بازه زمانی کوتاه؛ با پشتیبانی زرین‌پال تماس بگیرید",
  "-13": "محدودیت تراکنش پذیرنده؛ برای رفع این مورد مدارک خود را تکمیل کنید",
  "-14": "آدرس بازگشت (callback) با دامنه ثبت‌شده در پنل زرین‌پال مغایرت دارد؛ دامنه باید دقیقاً همان دامنه ثبت‌شده باشد",
  "-15": "درگاه پرداخت به حالت تعلیق درآمده است؛ با امور مشتریان زرین‌پال تماس بگیرید",
  "-16": "سطح تأیید پذیرنده پایین‌تر از سطح نقره‌ای است",
  "-17": "محدودیت پذیرنده در سطح آبی",
  "-18": "استفاده از کد درگاه اختصاصی روی این دامنه مجاز نیست",
  "-19": "امکان ایجاد تراکنش برای این ترمینال وجود ندارد",
  "-40": "پارامتر اضافه نامعتبر است (expire_in)",
  "-41": "حداکثر مبلغ پرداختی ۱۰۰ میلیون تومان است",
  "-50": "مبلغ پرداخت‌شده با مبلغ ارسالی در متد وریفای متفاوت است",
  "-51": "پرداخت ناموفق بود",
  "-52": "خطای غیرمنتظره در درگاه رخ داد؛ با امور مشتریان زرین‌پال تماس بگیرید",
  "-53": "این پرداخت متعلق به این مرچنت کد نیست",
  "-54": "شناسه (authority) پرداخت نامعتبر است",
  "-55": "تراکنش مورد نظر یافت نشد",
  "-60": "امکان ریورس کردن تراکنش با بانک وجود ندارد",
  "-61": "تراکنش موفق نیست یا قبلاً ریورس شده است",
  "-62": "آی‌پی درگاه تنظیم نشده است",
  "-63": "مهلت ۳۰ دقیقه‌ای برای ریورس این تراکنش منقضی شده است",
  "100": "عملیات موفق",
  "101": "این تراکنش قبلاً وریفای شده است",
};

/** ترجمهٔ یک کد خطای زرین‌پال به پیام فارسی (در صورت وجود) */
function zarinpalErrorMessage(code: string | number | undefined | null): string | null {
  if (code === undefined || code === null) return null;
  return ZARINPAL_ERROR_MESSAGES[String(code)] ?? null;
}

// ─── آدرس‌های API v4 زرین‌پال ───
// مستندات رسمی: https://www.zarinpal.com/docs/paymentGateway/connectToGateway
function zarinpalApiBase(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/v4"
    : "https://payment.zarinpal.com/pg/v4";
}

function zarinpalStartPay(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://payment.zarinpal.com/pg/StartPay";
}

export class ZarinpalProvider implements IPaymentProvider {
  constructor(private readonly config: PaymentConfig) {}

  /** بررسی آماده بودن درگاه و پرتاب خطای فارسی روشن در صورت نبود تنظیمات */
  private assertConfigured(): void {
    if (!this.config.merchantId) {
      throw new Error(
        "درگاه پرداخت زرین‌پال تنظیم نشده است: کلید اصلی (MERCHANT_ID) را در «تنظیمات ← پرداخت» وارد کنید"
      );
    }
    if (!this.config.merchantIdValid) {
      throw new Error(
        "کلید اصلی زرین‌پال نامعتبر است. مقدار باید یک UUID ۳۶ کاراکتری باشد"
      );
    }
  }

  async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.assertConfigured();

    const amountInRials = Number(request.amount) * 10; // تومان به ریال

    const response = await fetch(`${zarinpalApiBase(this.config.sandbox)}/payment/request.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
        amount: amountInRials,
        currency: "IRR",
        description: request.description,
        callback_url: request.callbackUrl,
        metadata: {
          mobile: request.mobile || "",
          email: request.email || "",
        },
      }),
    });

    const envelope = await response.json();

    // فرمت v4: { data: { code, authority, ... }, errors: [] }
    if (envelope.data?.code !== 100 || !envelope.data?.authority) {
      const code = envelope.data?.code ?? envelope.errors?.[0]?.code;
      const errMsg =
        zarinpalErrorMessage(code) ||
        envelope.errors?.[0]?.message ||
        envelope.data?.message ||
        "خطای ناشناخته";
      const suffix = zarinpalErrorMessage(code) && code !== undefined ? ` (کد ${code})` : "";
      throw new Error(`خطا در درخواست پرداخت: ${errMsg}${suffix}`);
    }

    return {
      authority: envelope.data.authority,
      url: `${zarinpalStartPay(this.config.sandbox)}/${envelope.data.authority}`,
    };
  }

  /**
   * تأیید پرداخت نزد زرین‌پال.
   * ⚠️ amount الزامی است و باید مبلغ اصلی تراکنش (بر حسب ریال) باشد.
   * مستندات: https://www.zarinpal.com/docs/paymentGateway/connectToGateway
   */
  async verifyPayment(request: VerificationRequest): Promise<VerificationResponse> {
    this.assertConfigured();

    // Zarinpal فقط در صورت موفقیت Status=OK را برمی‌گرداند
    if (request.status !== "OK") {
      return {
        success: false,
        refId: "",
        message: "پرداخت توسط کاربر لغو شد یا ناموفق بود",
      };
    }

    if (!request.amount || request.amount <= 0) {
      return {
        success: false,
        refId: "",
        message: "مبلغ تراکنش نامعتبر است",
      };
    }

    // request.amount باید بر حسب ریال باشد (تومان × ۱۰)
    const response = await fetch(`${zarinpalApiBase(this.config.sandbox)}/payment/verify.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
        amount: request.amount,
        authority: request.authority,
      }),
    });

    const envelope = await response.json();

    // کد ۱۰۰ = تأیید موفق (اولین بار)
    // کد ۱۰۱ = قبلاً تأیید شده (idempotent)
    if (envelope.data?.code === 100 || envelope.data?.code === 101) {
      return {
        success: true,
        refId: String(envelope.data.ref_id),
        cardPan: envelope.data.card_pan || undefined,
        message:
          envelope.data.code === 100
            ? "پرداخت با موفقیت تأیید شد"
            : "پرداخت قبلاً تأیید شده بود",
      };
    }

    const code = envelope.data?.code;
    const known = zarinpalErrorMessage(code);
    return {
      success: false,
      refId: "",
      message: known
        ? `خطا در تأیید پرداخت: ${known}${code !== undefined ? ` (کد ${code})` : ""}`
        : `خطا در تأیید پرداخت (کد ${code ?? "ناشناخته"}): ${
            envelope.data?.message || envelope.errors?.[0]?.message || "خطای ناشناخته"
          }`,
    };
  }
}

// ============================================================================
// Mock Payment Provider (برای محیط توسعه / تست بدون درگاه واقعی)
// ============================================================================

export class MockPaymentProvider implements IPaymentProvider {
  async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const authority = `MOCK_${nanoid(12)}`;

    console.log(
      `💳 [Mock Payment] درخواست پرداخت:\n` +
        `   مبلغ: ${request.amount.toLocaleString("fa-IR")} تومان\n` +
        `   توضیح: ${request.description}\n` +
        `   Authority: ${authority}\n` +
        `   Callback: ${request.callbackUrl}`
    );

    // ⚠️ آدرس بازگشت را باید با URL بسازیم، نه با چسباندن «?» دستی.
    // قبلاً «?authority=...&status=OK» به آدرسی که خودش query داشت چسبانده
    // می‌شد و در نتیجه پارامتر authority از بین می‌رفت و callback با خطای
    // «missing_params» به صفحه‌ای ناموجود ریدایرکت می‌کرد.
    const url = new URL(request.callbackUrl);
    url.searchParams.set("authority", authority);
    url.searchParams.set("status", "OK");

    return { authority, url: url.toString() };
  }

  async verifyPayment(request: VerificationRequest): Promise<VerificationResponse> {
    console.log(
      `✅ [Mock Payment] تأیید پرداخت:\n` +
        `   Authority: ${request.authority}\n` +
        `   Status: ${request.status}\n` +
        `   Amount: ${request.amount} ریال`
    );

    if (request.status === "OK") {
      return {
        success: true,
        refId: `MOCK_REF_${nanoid(8)}`,
        cardPan: "6104-33**-****-5678",
        message: "پرداخت آزمایشی با موفقیت تأیید شد",
      };
    }

    return {
      success: false,
      refId: "",
      message: "پرداخت آزمایشی لغو شد",
    };
  }
}

// ============================================================================
// Factory: انتخاب Provider بر اساس تنظیمات سیستم
// ============================================================================

export async function getPaymentProvider(): Promise<IPaymentProvider> {
  const config = await getPaymentConfig();

  if (config.mode === "zarinpal") {
    return new ZarinpalProvider(config);
  }

  return new MockPaymentProvider();
}

// ============================================================================
// توابع کمکی
// ============================================================================

/**
 * ساخت آدرس بازگشت از درگاه.
 *
 * ⚠️ این آدرس **بدون هیچ query string** ساخته می‌شود.
 * مستندات زرین‌پال: پس از پرداخت، خودِ درگاه کاربر را به این آدرس برمی‌گرداند و
 * پارامترهای `?Authority=...&Status=OK` را به آن اضافه می‌کند.
 * اگر ما خودمان query داشتیم (مثل `?bookingId=...`)، احتمال خراب‌شدن نتیجه
 * وجود داشت (چسباندن `?` دوم). حالا پرداخت را در callback با «authority»
 * پیدا می‌کنیم که هم یکتاست و هم مستقل از پارامترهای URL.
 */
export async function generatePaymentCallbackUrl(): Promise<string> {
  const config = await getPaymentConfig();
  const base = config.callbackUrlOverride || `${APP_URL}/api/payment/callback`;

  try {
    const url = new URL(base);
    url.search = "";
    return url.toString();
  } catch {
    // اگر آدرس دستی نامعتبر بود، به مقدار پیش‌فرض برگرد
    return `${APP_URL}/api/payment/callback`;
  }
}

export function calculateDepositAmount(totalPrice: bigint, percent: number = 30): bigint {
  // محاسبه ودیعه با BigInt برای جلوگیری از خطای اعشاری
  const deposit = (totalPrice * BigInt(percent)) / BigInt(100);
  return deposit;
}
