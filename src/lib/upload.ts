// ============================================================================
// پایپ‌لاین پردازش و آپلود تصویر - نوبت مارکت
// ============================================================================
//
// نکته: این ماژول از sharp استفاده می‌کند که نیاز به باینری‌های native دارد.
// در محیط production، مطمئن شوید sharp نصب شده است:
//   npm install sharp
//
// در صورت بروز مشکل در نصب sharp، می‌توانید از @img/sharp-darwin-arm64
// یا پکیج‌های مشابه استفاده کنید.
// ============================================================================

// Lazy import to prevent build-time failures when sharp binary is missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sharp: any = null;
let _sharpFailed = false;
async function getSharp(): Promise<any> {
  if (_sharpFailed) {
    throw new Error("sharp unavailable");
  }
  if (!_sharp) {
    try {
      const mod = await import("sharp");
      _sharp = mod.default;
    } catch (err) {
      _sharpFailed = true;
      throw err;
    }
  }
  return _sharp;
}

/** آیا موتور پردازش تصویر (sharp) در دسترس است؟ */
export async function isImageProcessingAvailable(): Promise<boolean> {
  try {
    await getSharp();
    return true;
  } catch {
    return false;
  }
}
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { UPLOAD_LIMITS } from "@/constants";
import type { ApiResponse } from "@/types";

// ============================================================================
// تایپ‌ها و اینترفیس‌ها
// ============================================================================

/** نتیجه پردازش تصویر */
export interface ProcessedImage {
  /** URL تصویر اصلی (large) */
  url: string;
  /** URL تصویر متوسط */
  mediumUrl: string;
  /** URL تصویر بندانگشتی */
  thumbnailUrl: string;
  /** عرض تصویر اصلی */
  width: number;
  /** ارتفاع تصویر اصلی */
  height: string;
  /** حجم فایل اصلی (بایت) */
  size: number;
  /** فرمت خروجی */
  format: "webp";
}

/** نتیجه آپلود فایل */
export interface UploadResult {
  /** شناسه یکتای فایل */
  id: string;
  /** URL فایل اصلی */
  url: string;
  /** URL تصویر متوسط */
  mediumUrl: string;
  /** URL تصویر بندانگشتی */
  thumbnailUrl: string;
  /** عرض تصویر */
  width: number;
  /** ارتفاع تصویر */
  height: number;
  /** حجم فایل */
  size: number;
  /** فرمت */
  format: string;
  /** مسیر ذخیره‌سازی */
  path: string;
}

/** تنظیمات اندازه تصویر */
interface ImageSize {
  name: string;
  width: number;
  height: number;
  quality: number;
}

/** اندازه‌های تولیدی */
const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { name: "thumb", width: 400, height: 400, quality: 70 },
  medium: { name: "med", width: 800, height: 800, quality: 80 },
  large: { name: "lg", width: 1600, height: 1600, quality: 90 },
};

/**
 * فرمت‌های مجاز تصویر
 * شامل اکثر فرمت‌های رایج دوربین/موبایل تا هنرمند بتواند هر تصویری را
 * به‌عنوان نمونه‌کار آپلود کند (خروجی نهایی همیشه WebP می‌شود).
 */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/x-ms-bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/svg+xml",
]);

/** نگاشت افزونه‌های جایگزین به نوع استاندارد */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-ms-bmp": "image/bmp",
};

// ============================================================================
// اینترفیس ارائه‌دهنده ذخیره‌سازی (Storage Provider)
// ============================================================================

/**
 * اینترفیس انتزاعی ذخیره‌سازی
 * هر ارائه‌دهنده ذخیره‌سازی (local, S3, Cloudinary, ...)
 * باید این متدها را پیاده‌سازی کند
 */
export interface IStorageProvider {
  /** آپلود فایل */
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  /** حذف فایل */
  delete(key: string): Promise<void>;
  /** دریافت URL فایل */
  getUrl(key: string): string;
}

// ============================================================================
// ارائه‌دهنده ذخیره‌سازی محلی (Local Storage - برای توسعه)
// ============================================================================

/**
 * ذخیره‌سازی محلی در پوشه public/uploads/
 * مناسب برای محیط توسعه
 */
export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
    this.baseUrl = "/uploads";
  }

  async upload(
    buffer: Buffer,
    key: string,
    _contentType: string
  ): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    // ایجاد پوشه در صورت عدم وجود
    await fs.mkdir(dir, { recursive: true });

    // ذخیره فایل
    await fs.writeFile(filePath, buffer);

    return `${this.baseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // فایل وجود نداشت - نادیده بگیر
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

// ============================================================================
// ارائه‌دهنده ذخیره‌سازی S3 (Stub - برای production)
// ============================================================================

/**
 * ارائه‌دهنده ذخیره‌سازی AWS S3
 *
 * برای فعال‌سازی:
 * 1. پکیج‌های زیر را نصب کنید:
 *    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * 2. متغیرهای محیطی را تنظیم کنید:
 *    AWS_ACCESS_KEY_ID
 *    AWS_SECRET_ACCESS_KEY
 *    AWS_REGION
 *    S3_BUCKET_NAME
 *
 * 3. این کلاس را جایگزین LocalStorageProvider کنید
 */
export class S3StorageProvider implements IStorageProvider {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || "";
    this.region = process.env.AWS_REGION || "ap-south-1";
  }

  async upload(
    _buffer: Buffer,
    _key: string,
    _contentType: string
  ): Promise<string> {
    // TODO: پیاده‌سازی آپلود به S3
    // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
    //
    // const client = new S3Client({ region: this.region });
    // const command = new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    //   Body: buffer,
    //   ContentType: contentType,
    //   ACL: "public-read",
    // });
    // await client.send(command);
    // return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    throw new Error("S3StorageProvider: پیاده‌سازی نشده است");
  }

  async delete(_key: string): Promise<void> {
    // TODO: پیاده‌سازی حذف از S3
    // import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
    // const client = new S3Client({ region: this.region });
    // const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    // await client.send(command);

    throw new Error("S3StorageProvider: پیاده‌سازی نشده است");
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

// ============================================================================
// پردازش تصویر با Sharp
// ============================================================================

/**
 * پردازش تصویر و تولید ۳ اندازه مختلف
 *
 * جریان:
 * 1. خواندن فایل اصلی
 * 2. اصلاح چرخش EXIF (auto-orient)
 * 3. تولید large (1600x1600, 90% کیفیت)
 * 4. تولید medium (800x800, 80% کیفیت)
 * 5. تولید thumbnail (400x400, 70% کیفیت)
 * 6. تبدیل همه به WebP
 */
export async function processImage(
  inputBuffer: Buffer,
  watermarkText?: string
): Promise<{ large: Buffer; medium: Buffer; thumbnail: Buffer }> {
  // خواندن و پردازش تصویر اصلی
  const sharpFn = await getSharp();
  const baseImage = sharpFn(inputBuffer)
    .rotate() // اصلاح چرخش EXIF
    .ensureAlpha(); // اطمینان از وجود کانال آلفا

  // تولید large با watermark اختیاری
  const largeImage = baseImage
    .clone()
    .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
      fit: "inside",
      withoutEnlargement: true,
    });

  if (watermarkText) {
    // ساخت SVG watermark نیمه‌شفاف
    const watermarkSvg = Buffer.from(
      `<svg width="300" height="40" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="30" font-family="Tahoma, Arial" font-size="20" 
              fill="white" fill-opacity="0.15" font-weight="bold">
          ${watermarkText}
        </text>
      </svg>`
    );
    largeImage.composite([{ input: watermarkSvg, gravity: "southeast" }]);
  }

  const large = await largeImage
    .webp({ quality: IMAGE_SIZES.large.quality })
    .toBuffer();

  // تولید medium با watermark اختیاری
  const mediumImage = baseImage
    .clone()
    .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
      fit: "inside",
      withoutEnlargement: true,
    });

  if (watermarkText) {
    const watermarkSvg = Buffer.from(
      `<svg width="200" height="30" xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="22" font-family="Tahoma, Arial" font-size="14" 
              fill="white" fill-opacity="0.12" font-weight="bold">
          ${watermarkText}
        </text>
      </svg>`
    );
    mediumImage.composite([{ input: watermarkSvg, gravity: "southeast" }]);
  }

  const medium = await mediumImage
    .webp({ quality: IMAGE_SIZES.medium.quality })
    .toBuffer();

  // thumbnail بدون watermark (خیلی کوچک است)
  const thumbnail = await baseImage
    .clone()
    .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
      fit: "cover",
    })
    .webp({ quality: IMAGE_SIZES.thumbnail.quality })
    .toBuffer();

  return { large, medium, thumbnail };
}

// ============================================================================
// توابع اعتبارسنجی
// ============================================================================

/**
 * استخراج افزونه فایل بر اساس MIME type یا نام فایل
 */
export function extensionForMime(mime: string, originalName?: string): string {
  const normalized = MIME_ALIASES[mime] || mime;
  const fromMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/svg+xml": "svg",
  };
  if (fromMime[normalized]) return fromMime[normalized];

  if (originalName && originalName.includes(".")) {
    const ext = originalName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ext) return ext;
  }
  return "jpg";
}

/**
 * اعتبارسنجی فایل تصویری
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // بررسی نوع فایل
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `فرمت فایل مجاز نیست. لطفاً یک فایل تصویری (JPG، PNG، WebP، GIF، HEIC، AVIF و ...) انتخاب کنید`,
    };
  }

  // بررسی حجم فایل
  if (file.size > UPLOAD_LIMITS.IMAGE_MAX_SIZE) {
    const maxSizeMB = UPLOAD_LIMITS.IMAGE_MAX_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `حجم فایل بیش از حد مجاز است. حداکثر: ${maxSizeMB} مگابایت`,
    };
  }

  return { valid: true };
}

/**
 * اعتبارسنجی تعداد فایل‌ها
 */
export function validateFileCount(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: false, error: "حداقل یک فایل انتخاب کنید" };
  }

  if (files.length > UPLOAD_LIMITS.MAX_IMAGES_PER_UPLOAD) {
    return {
      valid: false,
      error: `حداکثر ${UPLOAD_LIMITS.MAX_IMAGES_PER_UPLOAD} فایل مجاز است`,
    };
  }

  return { valid: true };
}

// ============================================================================
// تابع اصلی آپلود
// ============================================================================

/**
 * آپلود و پردازش یک فایل تصویری
 *
 * @param file - فایل تصویری
 * @param folder - پوشه مقصد (مثال: "portfolio", "flash", "avatar")
 * @param storage - ارائه‌دهنده ذخیره‌سازی
 * @returns نتیجه آپلود با URLهای مختلف
 */
export async function uploadImage(
  file: File,
  folder: string,
  storage: IStorageProvider = getDefaultStorage(),
  watermarkText?: string
): Promise<ApiResponse<UploadResult>> {
  try {
    // اعتبارسنجی فایل
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, message: validation.error! };
    }

    // خواندن فایل
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // اگر sharp در دسترس نیست (مثلاً باینری native خراب است)،
    // فایل اصلی را بدون پردازش ذخیره کن تا آپلود هیچ‌وقت کاملاً خراب نشود.
    let sharpOk = true;
    try {
      await getSharp();
    } catch {
      sharpOk = false;
    }

    if (!sharpOk) {
      const ext = extensionForMime(file.type, file.name);
      const fileId = nanoid(12);
      const timestamp = Date.now();
      const key = `${folder}/${timestamp}_${fileId}_orig.${ext}`;
      const url = await storage.upload(buffer, key, file.type);
      return {
        success: true,
        message: "تصویر با موفقیت آپلود شد",
        data: {
          id: fileId,
          url,
          mediumUrl: url,
          thumbnailUrl: url,
          width: 0,
          height: 0,
          size: buffer.length,
          format: ext,
          path: key,
        },
      };
    }

    // پردازش تصویر
    let processed: { large: Buffer; medium: Buffer; thumbnail: Buffer };
    try {
      processed = await processImage(buffer, watermarkText);
    } catch (procErr) {
      // بعضی فرمت‌ها (مثل HEIC/TIFF/RAW) ممکن است توسط موتور پردازش پشتیبانی نشوند؛
      // در این حالت فایل اصلی را بدون تبدیل ذخیره می‌کنیم تا آپلود هیچ‌وقت شکست نخورد.
      console.warn("پردازش تصویر ناموفق بود؛ ذخیره فایل اصلی:", procErr);
      const ext = extensionForMime(file.type, file.name);
      const fileId = nanoid(12);
      const timestamp = Date.now();
      const key = `${folder}/${timestamp}_${fileId}_orig.${ext}`;
      const url = await storage.upload(buffer, key, file.type);
      return {
        success: true,
        message: "تصویر با موفقیت آپلود شد",
        data: {
          id: fileId,
          url,
          mediumUrl: url,
          thumbnailUrl: url,
          width: 0,
          height: 0,
          size: buffer.length,
          format: ext,
          path: key,
        },
      };
    }

    // تولید شناسه یکتا
    const fileId = nanoid(12);
    const timestamp = Date.now();
    const baseKey = `${folder}/${timestamp}_${fileId}`;

    // آپلود ۳ اندازه به صورت موازی
    const contentType = "image/webp";
    const [url, mediumUrl, thumbnailUrl] = await Promise.all([
      storage.upload(processed.large, `${baseKey}_lg.webp`, contentType),
      storage.upload(processed.medium, `${baseKey}_med.webp`, contentType),
      storage.upload(processed.thumbnail, `${baseKey}_thumb.webp`, contentType),
    ]);

    // دریافت ابعاد تصویر
    const sharpFn = await getSharp();
    const metadata = await sharpFn(processed.large).metadata();

    return {
      success: true,
      message: "تصویر با موفقیت آپلود و پردازش شد",
      data: {
        id: fileId,
        url,
        mediumUrl,
        thumbnailUrl,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: processed.large.length,
        format: "webp",
        path: `${baseKey}_lg.webp`,
      },
    };
  } catch (error) {
    console.error("خطا در آپلود تصویر:", error);
    return {
      success: false,
      message: "خطا در پردازش یا آپلود تصویر. لطفاً مجدداً تلاش کنید",
    };
  }
}

/**
 * آپلود چند فایل تصویری
 */
export async function uploadImages(
  files: File[],
  folder: string
): Promise<ApiResponse<UploadResult[]>> {
  // اعتبارسنجی تعداد
  const countValidation = validateFileCount(files);
  if (!countValidation.valid) {
    return { success: false, message: countValidation.error! };
  }

  // آپلود هر فایل
  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadImage(file, folder);
    if (result.success && result.data) {
      results.push(result.data);
    } else {
      errors.push(`${file.name}: ${result.message}`);
    }
  }

  if (results.length === 0) {
    return {
      success: false,
      message: "هیچ فایلی آپلود نشد",
      errors: { files: errors },
    };
  }

  return {
    success: true,
    message: `${results.length} از ${files.length} فایل با موفقیت آپلود شد`,
    data: results,
  };
}

/**
 * حذف فایل‌های مرتبط با یک آیتم
 */
export async function deleteUploadedFiles(
  urls: string[],
  storage: IStorageProvider = getDefaultStorage()
): Promise<void> {
  const deletePromises = urls.map(async (url) => {
    // استخراج مسیر فایل از URL
    const key = url.replace(/^\/uploads\//, "");
    if (key && !url.startsWith("http")) {
      await storage.delete(key);
    }
  });

  await Promise.allSettled(deletePromises);
}

// ============================================================================
// تابع کمکی برای دریافت ارائه‌دهنده پیش‌فرض
// ============================================================================

/**
 * دریافت ارائه‌دهنده ذخیره‌سازی پیش‌فرض
 * بر اساس متغیرهای محیطی
 */
function getDefaultStorage(): IStorageProvider {
  // فقط وقتی S3 فعال است که صراحتاً انتخاب شده باشد؛
  // در غیر این صورت (حتی با وجود مقادیر نمونه در env) از ذخیره‌سازی محلی استفاده می‌شود.
  const provider = (process.env.FILE_STORAGE_PROVIDER || process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (provider === "s3") {
    const keyId = process.env.AWS_ACCESS_KEY_ID || "";
    const looksPlaceholder = !keyId || /your-|example|test|xxx/i.test(keyId);
    if (!process.env.S3_BUCKET_NAME || looksPlaceholder) {
      console.warn("S3 requested but not configured — falling back to local storage");
      return new LocalStorageProvider();
    }
    return new S3StorageProvider();
  }

  // به صورت پیش‌فرض: ذخیره‌سازی محلی
  return new LocalStorageProvider();
}
