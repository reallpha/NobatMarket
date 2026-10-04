// ============================================================================
// اعتبارسنجی‌های Zod - فرم‌ها و ورودی‌ها
// ============================================================================

import { z } from "zod";

// ============================================================================
// فرم‌های احراز هویت
// ============================================================================

/**
 * اعتبارسنجی فرم ورود
 */
export const loginSchema = z.object({
  phone: z
    .string()
    .min(11, "شماره موبایل باید ۱۱ رقم باشد")
    .max(11, "شماره موبایل باید ۱۱ رقم باشد")
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .max(100, "رمز عبور بیش از حد طولانی است"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * اعتبارسنجی فرم ثبت‌نام
 */
export const registerSchema = z
  .object({
    phone: z
      .string()
      .min(11, "شماره موبایل باید ۱۱ رقم باشد")
      .max(11, "شماره موبایل باید ۱۱ رقم باشد")
      .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .max(100, "رمز عبور بیش از حد طولانی است")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "رمز عبور باید شامل حروف بزرگ، کوچک و اعداد باشد"
      ),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(2, "نام نمایشی باید حداقل ۲ کاراکتر باشد")
      .max(50, "نام نمایشی بیش از حد طولانی است"),
    role: z.enum(["CLIENT", "ARTIST"], {
      required_error: "نوع حساب را انتخاب کنید",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزهای عبور مطابقت ندارند",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * اعتبارسنجی کد تأیید
 */
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, "کد تأیید باید ۶ رقم باشد")
    .regex(/^\d+$/, "کد تأیید باید شامل اعداد باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

// ============================================================================
// فرم‌های پروفایل
// ============================================================================

/**
 * اعتبارسنجی به‌روزرسانی پروفایل کاربر
 */
export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام بیش از حد طولانی است"),
  // تصاویر نمونهٔ پیش‌نمایش از مسیر پروکسی خودمان سرو می‌شوند (مثل /api/image-proxy?url=...)
  avatarUrl: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/api/image-proxy?") ||
        z.string().url().safeParse(value).success,
      "آدرس تصویر معتبر نیست"
    )
    .optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

/**
 * اعتبارسنجی ایجاد پروفایل هنرمند
 */
export const createArtistProfileSchema = z.object({
  bio: z
    .string()
    .min(10, "بیوگرافی باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "بیوگرافی بیش از حد طولانی است"),
  city: z
    .string()
    .min(2, "نام شهر الزامی است")
    .max(50, "نام شهر بیش از حد طولانی است"),
  styles: z
    .array(z.string())
    .min(1, "حداقل یک سبک تتو انتخاب کنید")
    .max(4, "حداکثر ۴ دسته‌بندی قابل انتخاب است"),
  experienceYears: z
    .number()
    .min(0, "سال‌های تجربه نمی‌تواند منفی باشد")
    .max(50, "سال‌های تجربه بیش از حد مجاز است"),
  basePrice: z
    .number()
    .min(0, "قیمت پایه نمی‌تواند منفی باشد")
    .max(100_000_000, "قیمت بیش از حد مجاز است"),
  studioId: z.string().optional().or(z.literal("")),
});

export type CreateArtistProfileInput = z.infer<typeof createArtistProfileSchema>;

/**
 * اعتبارسنجی ویرایش پروفایل هنرمند
 */
export const updateArtistProfileSchema = z.object({
  bio: z
    .string()
    .min(10, "بیوگرافی باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "بیوگرافی بیش از حد طولانی است")
    .optional(),
  city: z
    .string()
    .min(2, "نام شهر الزامی است")
    .max(50, "نام شهر بیش از حد طولانی است")
    .optional(),
  styles: z
    .array(z.string())
    .min(1, "حداقل یک سبک تتو انتخاب کنید")
    .max(4, "حداکثر ۴ دسته‌بندی قابل انتخاب است")
    .optional(),
  experienceYears: z
    .number()
    .min(0, "سال‌های تجربه نمی‌تواند منفی باشد")
    .max(50, "سال‌های تجربه بیش از حد مجاز است")
    .optional(),
  basePrice: z
    .number()
    .min(0, "قیمت پایه نمی‌تواند منفی باشد")
    .max(100_000_000, "قیمت بیش از حد مجاز است")
    .optional(),
  studioId: z.string().optional().or(z.literal("")),
});

export type UpdateArtistProfileInput = z.infer<typeof updateArtistProfileSchema>;

/**
 * اعتبارسنجی ویرایش پروفایل کاربر (نسخه قدیمی - نگهداری برای سازگاری)
 */
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "نام نمایشی باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام نمایشی بیش از حد طولانی است"),
  firstName: z.string().max(50, "نام بیش از حد طولانی است").optional(),
  lastName: z.string().max(50, "نام خانوادگی بیش از حد طولانی است").optional(),
  city: z.string().max(50, "نام شهر بیش از حد طولانی است").optional(),
  province: z.string().max(50, "نام استان بیش از حد طولانی است").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * اعتبارسنجی پروفایل هنرمند (نسخه قدیمی - نگهداری برای سازگاری)
 */
export const artistProfileSchema = z.object({
  artistName: z
    .string()
    .min(2, "نام هنری باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام هنری بیش از حد طولانی است"),
  shortBio: z.string().max(150, "بیو کوتاه بیش از حد طولانی است").optional(),
  fullBio: z.string().max(2000, "بیو کامل بیش از حد طولانی است").optional(),
  specializations: z
    .array(z.string())
    .min(1, "حداقل یک سبک تتو انتخاب کنید"),
  minPrice: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  maxPrice: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  averageSessionDuration: z
    .number()
    .min(30, "حداقل مدت جلسه ۳۰ دقیقه است")
    .max(480, "حداکثر مدت جلسه ۸ ساعت است")
    .optional(),
});

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;

// ============================================================================
// فرم‌های رزرو
// ============================================================================

/**
 * اعتبارسنجی ایجاد رزرو
 */
export const bookingSchema = z.object({
  artistId: z.string().min(1, "شناسه هنرمند الزامی است"),
  serviceId: z.string().optional(),
  scheduledDate: z.string().min(1, "تاریخ رزرو الزامی است"),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "ساعت معتبر نیست"),
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(100, "عنوان بیش از حد طولانی است"),
  description: z.string().max(1000, "توضیحات بیش از حد طولانی است").optional(),
  size: z.enum([
    "SMALL",
    "MEDIUM",
    "LARGE",
    "EXTRA_LARGE",
    "HALF_SLEEVE",
    "FULL_SLEEVE",
  ]).optional(),
  style: z.string().optional(),
  bodyPlacement: z
    .string()
    .max(100, "مکان تتو بیش از حد طولانی است")
    .optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// ============================================================================
// فرم‌های درخواست سفارشی
// ============================================================================

/**
 * اعتبارسنجی درخواست سفارشی
 */
export const customRequestSchema = z.object({
  artistId: z.string().min(1, "شناسه هنرمند الزامی است"),
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(100, "عنوان بیش از حد طولانی است"),
  description: z
    .string()
    .min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "توضیحات بیش از حد طولانی است"),
  preferredSize: z.string().optional(),
  preferredStyle: z.string().optional(),
  bodyPlacement: z.string().max(100).optional(),
  budget: z.number().min(0, "بودجه نمی‌تواند منفی باشد").optional(),
  preferredStartDate: z.string().optional(),
  isFlexibleWithDate: z.boolean().default(true),
});

export type CustomRequestInput = z.infer<typeof customRequestSchema>;

// ============================================================================
// فرم‌های پیام
// ============================================================================

/**
 * اعتبارسنجی ارسال پیام
 */
export const messageSchema = z.object({
  conversationId: z.string().min(1, "شناسه مکالمه الزامی است"),
  content: z
    .string()
    .min(1, "پیام نمی‌تواند خالی باشد")
    .max(5000, "پیام بیش از حد طولانی است"),
  attachments: z.array(z.string()).max(5, "حداکثر ۵ فایل پیوست").optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// ============================================================================
// فرم‌های نظر
// ============================================================================

/**
 * اعتبارسنجی ثبت نظر
 */
export const reviewSchema = z.object({
  recipientId: z.string().min(1, "شناسه دریافت‌کننده الزامی است"),
  bookingId: z.string().optional(),
  portfolioItemId: z.string().optional(),
  rating: z
    .number()
    .min(1, "حداقل رتبه ۱ است")
    .max(5, "حداکثر رتبه ۵ است"),
  creativityRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  comment: z
    .string()
    .min(10, "نظر باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "نظر بیش از حد طولانی است"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
