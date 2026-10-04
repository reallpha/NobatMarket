// ============================================================================
// سرویس ارسال پیامک — ملی‌پیامک (MeliPayamak)
//
// وب‌سرویس استفاده‌شده: REST روی  http://rest.payamak-panel.com/api/SendSMS
// روش احراز هویت: نام کاربری + رمز عبور (طبق مستندات رسمی ملی‌پیامک)
//
// مستندات مرجع:
//   • فهرست وب‌سرویس‌ها .... https://www.melipayamak.com/api/
//   • ارسال پترن (متد دوم) . https://www.melipayamak.com/api/sendbybasenumber2/
//   • ارسال ساده ............ https://www.melipayamak.com/api/SendSMS/
//
// ⚠️ نکات مهم و تأییدشده با تست واقعی روی سرور ملی‌پیامک:
//   ۱) دامنه‌ی rest.payamak-panel.com فقط روی HTTP پاسخ می‌دهد؛ HTTPS روی آن
//      بسته است (اتصال TLS برقرار نمی‌شود). این فراخوانی از سمت سرور انجام
//      می‌شود، پس محدودیت mixed-content مرورگر مطرح نیست.
//   ۲) داده‌ها باید به‌صورت application/x-www-form-urlencoded ارسال شوند.
//   ۳) قالب پاسخ همیشه این پوشش است:
//        { "Value": "<recId یا 0>", "RetStatus": <کد>, "StrRetStatus": "<وضعیت>" }
//      موفقیت = RetStatus برابر ۱ (یا Value یک recId بیش از ۱۵ رقم)
//   ۴) متد GetUserNumbers یک پوشش متفاوت دارد:
//        { "MyBase": { ... }, "Data": [ ... ] }
// ============================================================================

import { db } from "./db";
import { SMS_PATTERNS, type SmsPatternKey } from "./sms-patterns";

/** آدرس پایه وب‌سرویس REST ملی‌پیامک (فقط HTTP — HTTPS پشتیبانی نمی‌شود) */
const MELI_REST_BASE = "http://rest.payamak-panel.com/api/SendSMS";

/** مهلت هر درخواست به ملی‌پیامک (میلی‌ثانیه) */
const MELI_TIMEOUT_MS = 15_000;

// ============================================================================
// انواع
// ============================================================================

export interface SmsResult {
  success: boolean;
  /** شناسه پیام ارسال‌شده (recId) در صورت موفقیت */
  messageId?: string;
  /** پیام خطای فارسی و قابل نمایش */
  error?: string;
  /** کد خطای خام ملی‌پیامک برای دیباگ */
  errorCode?: string;
}

export interface MeliConfig {
  username: string;
  /** رمز عبور — یا کلید API در صورتی که سامانه استفاده از رمز را الزام کرده باشد (خطای ۱۱۰-) */
  secret: string;
  authKind: "password" | "apiKey" | "none";
  sender: string;
  enabled: boolean;
}

export interface MeliConnectionReport {
  ok: boolean;
  /** اعتبار باقی‌مانده پنل (ریال/تومان بسته به پنل) */
  credit?: number;
  /** شماره‌های خطوط متعلق به این حساب */
  numbers: string[];
  /** آیا شماره‌ی فرستنده‌ی تنظیم‌شده در میان خطوط حساب هست؟ */
  senderRecognized?: boolean;
  /** پیام موفقیت یا خطای فارسی */
  message: string;
  errorCode?: string;
}

interface MeliEnvelope {
  Value?: string | number;
  RetStatus?: string | number;
  StrRetStatus?: string;
}

// ============================================================================
// نقشه‌ی خطاها — برگرفته از جدول رسمی "مقدار بازگشتی" ملی‌پیامک
// ============================================================================

const MELI_ERROR_MESSAGES: Record<string, string> = {
  "0": "نام کاربری یا رمز عبور اشتباه است",
  "2": "اعتبار پنل پیامکی کافی نیست",
  "6": "سامانه ملی‌پیامک در حال بروزرسانی است؛ بعداً تلاش کنید",
  "7": "متن پیامک حاوی کلمه فیلترشده است",
  "10": "کاربر پنل پیامکی فعال نیست",
  "11": "پیامک ارسال نشد",
  "12": "مدارک کاربر پنل پیامکی کامل نیست",
  "16": "شماره گیرنده یافت نشد",
  "17": "متن پیامک خالی است",
  "18": "شماره گیرنده نامعتبر است",
  "19": "از محدودیت ساعتی ارسال فراتر رفته‌اید",
  "35": "شماره گیرنده در لیست سیاه مخابرات است یا داده‌های ارسالی ناقص/نامعتبر است",
  "-1": "دسترسی استفاده از این وب‌سرویس غیرفعال است؛ با پشتیبانی ملی‌پیامک تماس بگیرید",
  "-2": "در هر بار ارسال فقط یک شماره موبایل مجاز است",
  "-3": "خط فرستنده در سیستم ملی‌پیامک تعریف نشده است",
  "-4": "کد پترن صحیح نیست یا توسط مدیر سامانه تأیید نشده است",
  "-5": "متن ارسالی با متغیرهای پترن هم‌خوانی ندارد؛ ترتیب و تعداد متغیرها را بررسی کنید",
  "-6": "خطای داخلی سامانه ملی‌پیامک؛ با پشتیبانی تماس بگیرید",
  "-7": "خطا در شماره فرستنده؛ با پشتیبانی ملی‌پیامک تماس بگیرید",
  "-10": "در میان متغیرهای ارسالی لینک وجود دارد (مجاز نیست)",
  "-108": "IP سرور به دلیل تلاش‌های ناموفق مسدود شده است",
  "-109": "باید IP سرور در پنل ملی‌پیامک به‌عنوان IP مجاز ثبت شود",
  "-110": "سامانه الزام کرده به‌جای رمز عبور از کلید API استفاده کنید",
  "-111": "IP درخواست‌کننده نامعتبر است",
};

/** ترجمه‌ی متن‌های وضعیت انگلیسی که ملی‌پیامک برمی‌گرداند */
const MELI_STATUS_MESSAGES: Record<string, string> = {
  UserNameAndPasswordFailed: "نام کاربری یا رمز عبور اشتباه است",
  InvalidData: "داده‌های ارسالی نامعتبر است (شماره فرستنده، کد پترن یا شماره گیرنده)",
};

// ============================================================================
// خواندن تنظیمات
// ============================================================================

async function readSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const setting = await db.systemSetting.findUnique({ where: { key } });
    const value = setting?.value?.trim();
    return value ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * خواندن اطلاعات اتصال ملی‌پیامک از تنظیمات سیستم.
 * اگر رمز عبور خالی باشد و کلید API پر باشد، از کلید API به‌عنوان رمز استفاده می‌شود
 * (این روش رسمی ملی‌پیامک برای حساب‌هایی است که خطای «۱۱۰-» می‌گیرند).
 */
export async function getMeliConfig(): Promise<MeliConfig> {
  const [username, password, apiKey, sender, smsEnabled] = await Promise.all([
    readSetting("MELI_USERNAME"),
    readSetting("MELI_PASSWORD"),
    readSetting("MELI_API_KEY"),
    readSetting("MELI_SENDER_NUMBER"),
    readSetting("SMS_ENABLED", "false"),
  ]);

  const usePassword = Boolean(username && password);
  const useApiKey = Boolean(username && !password && apiKey);

  return {
    username,
    secret: usePassword ? password : useApiKey ? apiKey : "",
    authKind: usePassword ? "password" : useApiKey ? "apiKey" : "none",
    sender,
    enabled: smsEnabled === "true",
  };
}

// ============================================================================
// لایه‌ی ارتباط با وب‌سرویس
// ============================================================================

/**
 * نرمال‌سازی شماره موبایل به فرمت موردانتظار ملی‌پیامک: 09xxxxxxxxx
 */
export function normalizeMeliPhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0098")) return "0" + digits.slice(4);
  if (digits.startsWith("98") && digits.length >= 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

/** تشخیص موفقیت از روی پوشش پاسخ */
function isSuccessEnvelope(env: MeliEnvelope): boolean {
  const status = Number(env.RetStatus);
  if (status === 1) return true;
  const value = String(env.Value ?? "").trim();
  // recId موفق در مستندات «عددی بیش از ۱۵ رقم» معرفی شده است
  return /^\d+$/.test(value) && value.length >= 15;
}

/** استخراج کد خطا از پوشش پاسخ */
function extractErrorCode(env: MeliEnvelope): string {
  const value = String(env.Value ?? "").trim();
  if (value.startsWith("-")) return value;
  const status = Number(env.RetStatus);
  if (Number.isFinite(status) && status !== 1) return String(status);
  return value || "unknown";
}

/** تبدیل کد خطا به پیام فارسی */
function describeError(env: MeliEnvelope): string {
  const code = extractErrorCode(env);
  if (MELI_ERROR_MESSAGES[code]) return MELI_ERROR_MESSAGES[code];
  const statusText = String(env.StrRetStatus ?? "").trim();
  if (statusText && MELI_STATUS_MESSAGES[statusText]) return MELI_STATUS_MESSAGES[statusText];
  return `خطای نامشخص از ملی‌پیامک (کد ${code}${statusText ? ` / ${statusText}` : ""})`;
}

/**
 * فراخوانی یک متد از وب‌سرویس REST ملی‌پیامک.
 * داده‌ها به‌صورت form-urlencoded ارسال می‌شوند (طبق مستندات).
 */
async function callMeli(
  endpoint: string,
  payload: Record<string, string>
): Promise<{ httpOk: boolean; env: MeliEnvelope | null; raw: string }> {
  const body = new URLSearchParams(payload).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MELI_TIMEOUT_MS);

  try {
    const response = await fetch(`${MELI_REST_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    const raw = await response.text();
    let env: MeliEnvelope | null = null;
    try {
      env = JSON.parse(raw) as MeliEnvelope;
    } catch {
      env = null;
    }
    return { httpOk: response.ok, env, raw };
  } finally {
    clearTimeout(timeout);
  }
}

/** ساخت احراز هویت برای هر درخواست */
function authPayload(config: MeliConfig): Record<string, string> {
  return { username: config.username, password: config.secret };
}

// ============================================================================
// ارسال پیامک
// ============================================================================

/**
 * ارسال پیامک با پترن (خط خدماتی اشتراکی).
 * متغیرها به ترتیب در متن پترن جای‌گذاری می‌شوند و با «;» به هم متصل می‌شوند.
 */
async function sendPatternSms(
  phone: string,
  patternCode: string,
  variables: string[]
): Promise<SmsResult> {
  const config = await getMeliConfig();

  if (!config.enabled) {
    // حالت توسعه: پیامک واقعی ارسال نمی‌شود
    return { success: true, messageId: "disabled" };
  }

  if (!config.username || !config.secret) {
    return {
      success: false,
      error: "نام کاربری یا رمز عبور ملی‌پیامک تنظیم نشده است",
      errorCode: "not-configured",
    };
  }

  if (!patternCode) {
    return {
      success: false,
      error: "کد پترن برای این پیامک در تنظیمات وارد نشده است",
      errorCode: "no-pattern",
    };
  }

  const to = normalizeMeliPhone(phone);
  if (!to) {
    return { success: false, error: "شماره موبایل گیرنده نامعتبر است", errorCode: "invalid-phone" };
  }

  try {
    const { httpOk, env, raw } = await callMeli("BaseServiceNumber", {
      ...authPayload(config),
      bodyId: patternCode,
      to,
      text: variables.join(";"),
    });

    if (!env) {
      console.error("[SMS] پاسخ نامعتبر از ملی‌پیامک:", raw);
      return {
        success: false,
        error: "پاسخ نامعتبر از سرویس پیامک دریافت شد",
        errorCode: `http-${httpOk ? "parse" : "error"}`,
      };
    }

    if (isSuccessEnvelope(env)) {
      const recId = String(env.Value ?? "");
      console.log("[SMS] ارسال موفق به", to, "recId:", recId);
      return { success: true, messageId: recId };
    }

    const error = describeError(env);
    console.error("[SMS] ارسال ناموفق به", to, "—", error, env);
    return { success: false, error, errorCode: extractErrorCode(env) };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[SMS] خطای ارتباط با ملی‌پیامک:", error);
    return {
      success: false,
      error: isAbort ? "مهلت ارتباط با سرویس پیامک به پایان رسید" : "خطا در ارتباط با سرویس پیامک",
      errorCode: isAbort ? "timeout" : "network",
    };
  }
}

/** پیدا کردن کد پترن یک سناریو از تنظیمات */
async function readPatternCode(key: SmsPatternKey): Promise<string> {
  return readSetting(SMS_PATTERNS[key].settingKey);
}

/**
 * ارسال پیامک متنی ساده از خط اختصاصی پنل.
 * (متد «ارسال ساده» وب‌سرویس ملی‌پیامک)
 */
export async function sendSimpleSms(phone: string, text: string): Promise<SmsResult> {
  const config = await getMeliConfig();

  if (!config.enabled) {
    return { success: true, messageId: "disabled" };
  }

  if (!config.username || !config.secret) {
    return {
      success: false,
      error: "نام کاربری یا رمز عبور ملی‌پیامک تنظیم نشده است",
      errorCode: "not-configured",
    };
  }

  if (!config.sender) {
    return { success: false, error: "شماره فرستنده تنظیم نشده است", errorCode: "no-sender" };
  }

  const to = normalizeMeliPhone(phone);
  if (!to) {
    return { success: false, error: "شماره موبایل گیرنده نامعتبر است", errorCode: "invalid-phone" };
  }

  try {
    const { httpOk, env, raw } = await callMeli("SendSMS", {
      ...authPayload(config),
      from: config.sender,
      to,
      text,
      isFlash: "false",
    });

    if (!env) {
      console.error("[SMS] پاسخ نامعتبر از ملی‌پیامک:", raw);
      return {
        success: false,
        error: "پاسخ نامعتبر از سرویس پیامک دریافت شد",
        errorCode: `http-${httpOk ? "parse" : "error"}`,
      };
    }

    if (isSuccessEnvelope(env)) {
      return { success: true, messageId: String(env.Value ?? "") };
    }

    const error = describeError(env);
    console.error("[SMS] ارسال ساده ناموفق:", error, env);
    return { success: false, error, errorCode: extractErrorCode(env) };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[SMS] خطای ارتباط با ملی‌پیامک:", error);
    return {
      success: false,
      error: isAbort ? "مهلت ارتباط با سرویس پیامک به پایان رسید" : "خطا در ارتباط با سرویس پیامک",
      errorCode: isAbort ? "timeout" : "network",
    };
  }
}

// ============================================================================
// تست اتصال (برای دکمه «تست اتصال» در پنل مدیریت)
// ============================================================================

/**
 * بررسی صحت اتصال به ملی‌پیامک با نام کاربری و رمز عبور:
 *   ۱) دریافت اعتبار پنل  → صحت نام کاربری/رمز
 *   ۲) دریافت خطوط حساب  → کنترل اینکه «شماره فرستنده» واقعاً به این حساب تعلق دارد
 * هیچ پیامکی ارسال نمی‌شود، پس این تست هزینه‌ای ندارد.
 */
export async function verifyMeliConnection(): Promise<MeliConnectionReport> {
  const config = await getMeliConfig();

  if (!config.username || !config.secret) {
    return {
      ok: false,
      numbers: [],
      message: "نام کاربری و رمز عبور ملی‌پیامک را وارد و ذخیره کنید",
      errorCode: "not-configured",
    };
  }

  // ── ۱) اعتبار / صحت احراز هویت ──
  let creditResult: Awaited<ReturnType<typeof callMeli>>;
  try {
    creditResult = await callMeli("GetCredit", authPayload(config));
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      numbers: [],
      message: isAbort
        ? "مهلت ارتباط با ملی‌پیامک به پایان رسید؛ اتصال اینترنت سرور را بررسی کنید"
        : "ارتباط با سرور ملی‌پیامک برقرار نشد",
      errorCode: isAbort ? "timeout" : "network",
    };
  }

  const creditEnv = creditResult.env;
  if (!creditEnv) {
    return {
      ok: false,
      numbers: [],
      message: "پاسخ نامعتبر از ملی‌پیامک دریافت شد",
      errorCode: "parse",
    };
  }

  if (!isSuccessEnvelope(creditEnv)) {
    return {
      ok: false,
      numbers: [],
      message: describeError(creditEnv),
      errorCode: extractErrorCode(creditEnv),
    };
  }

  const credit = Number(String(creditEnv.Value ?? "").replace(/[^\d-]/g, "")) || 0;

  // ── ۲) خطوط حساب، برای اعتبارسنجی شماره فرستنده ──
  let numbers: string[] = [];
  let senderRecognized: boolean | undefined = undefined;
  try {
    const { raw } = await callMeli("GetUserNumbers", authPayload(config));
    const parsed = JSON.parse(raw) as { Data?: unknown };
    if (Array.isArray(parsed.Data)) {
      numbers = parsed.Data.map((n) => String(n).trim()).filter(Boolean);
      if (config.sender) {
        const sender = normalizeMeliPhone(config.sender);
        senderRecognized = numbers.some((n) => normalizeMeliPhone(n) === sender);
      }
    }
  } catch {
    // این بخش اختیاری است؛ نبودش اتصال را رد نمی‌کند
  }

  const parts = ["اتصال به ملی‌پیامک با موفقیت برقرار شد"];
  if (credit > 0) parts.push(`اعتبار پنل: ${credit.toLocaleString("fa-IR")}`);
  if (config.sender && senderRecognized === false) {
    parts.push("⚠️ شماره فرستنده در فهرست خطوط این حساب پیدا نشد");
  }
  if (!config.sender) parts.push("⚠️ شماره فرستنده تنظیم نشده است");

  return {
    ok: true,
    credit,
    numbers,
    senderRecognized,
    message: parts.join(" · "),
  };
}

// ============================================================================
// توابع ارسال پیامک برای سناریوهای مختلف
// ============================================================================

/** ارسال کد تأیید هویت (OTP) */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  return sendPatternSms(phone, await readPatternCode("OTP"), [code]);
}

/** ارسال اعلان رزرو جدید به هنرمند */
export async function sendBookingArtistSms(
  artistPhone: string,
  clientName: string,
  serviceType: string,
  bookingDate: string,
  bookingId: string
): Promise<SmsResult> {
  return sendPatternSms(artistPhone, await readPatternCode("BOOKING_ARTIST"), [
    clientName,
    serviceType,
    bookingDate,
    bookingId,
  ]);
}

/** ارسال تأیید رزرو به مشتری */
export async function sendBookingClientSms(
  clientPhone: string,
  artistName: string,
  serviceType: string,
  bookingDate: string,
  bookingId: string
): Promise<SmsResult> {
  return sendPatternSms(clientPhone, await readPatternCode("BOOKING_CLIENT"), [
    artistName,
    serviceType,
    bookingDate,
    bookingId,
  ]);
}

/** ارسال اعلان لغو رزرو */
export async function sendBookingCancelSms(
  phone: string,
  bookingId: string,
  reason: string
): Promise<SmsResult> {
  return sendPatternSms(phone, await readPatternCode("BOOKING_CANCEL"), [bookingId, reason]);
}

/** ارسال اعلان پیام جدید */
export async function sendNewMessageSms(
  phone: string,
  senderName: string,
  messagePreview: string
): Promise<SmsResult> {
  return sendPatternSms(phone, await readPatternCode("NEW_MESSAGE"), [
    senderName,
    messagePreview.slice(0, 50),
  ]);
}

/** ارسال پیامک ثبت‌نام موفق */
export async function sendRegisterSms(phone: string, name: string): Promise<SmsResult> {
  return sendPatternSms(phone, await readPatternCode("REGISTER"), [name]);
}

/**
 * ارسال پیامک بازیابی رمز عبور (رمز جدید)
 * در پترن ملی‌پیامک، رمز جدید اولین متغیر ({0}) است.
 */
export async function sendResetPasswordSms(phone: string, newPassword: string): Promise<SmsResult> {
  return sendPatternSms(phone, await readPatternCode("RESET_PASSWORD"), [newPassword]);
}

/** نام مستعار معنایی برای همین سناریو: ارسال «رمز عبور جدید» via SMS */
export async function sendNewPasswordSms(phone: string, newPassword: string): Promise<SmsResult> {
  return sendResetPasswordSms(phone, newPassword);
}
