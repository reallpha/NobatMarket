import { z } from "zod";

export const registerSchema = z
  .object({
    phone: z
      .string()
      .min(1, "شماره موبایل الزامی است")
      .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .max(100),
    confirmPassword: z.string().min(1, "تکرار رمز عبور الزامی است"),
    displayName: z
      .string()
      .min(2, "نام نمایشی باید حداقل ۲ کاراکتر باشد")
      .max(100),
    role: z.enum(["CLIENT", "ARTIST"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن مطابقت ندارند",
    path: ["confirmPassword"],
  });

export const verifyCodeSchema = z.object({
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  code: z
    .string()
    .length(6, "کد تأیید باید ۶ رقمی باشد")
    .regex(/^\d+$/, "کد تأیید باید عددی باشد"),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  // تصاویر نمونهٔ پیش‌نمایش از مسیر پروکسی خودمان سرو می‌شوند (مثل /api/image-proxy?url=...)
  avatarUrl: z
    .string()
    .refine(
      (value) => value.startsWith("/api/image-proxy?") || /^https?:\/\//.test(value),
      "آدرس تصویر نامعتبر است"
    )
    .optional()
    .nullable(),
});

export const createArtistProfileSchema = z.object({
  bio: z.string().min(10, "بیوگرافی باید حداقل ۱۰ کاراکتر باشد").max(2000),
  city: z.string().min(2, " شهر الزامی است").max(50),
  styles: z.array(z.string()).min(1, "حداقل یک سبک انتخاب کنید").max(4, "حداکثر ۴ دسته‌بندی قابل انتخاب است"),
  experienceYears: z.number().min(0).max(50).optional(),
  basePrice: z.number().min(0).optional(),
  studioId: z.string().optional().nullable(),
});

export const updateArtistProfileSchema = z.object({
  bio: z.string().min(10).max(2000).optional(),
  city: z.string().min(2).max(50).optional(),
  styles: z.array(z.string()).min(1).max(4, "حداکثر ۴ دسته‌بندی قابل انتخاب است").optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  basePrice: z.number().min(0).optional(),
  studioId: z.string().optional().nullable(),
});
