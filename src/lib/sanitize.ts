// ============================================================================
// Input Sanitization & Validation - نوبت مارکت
// ============================================================================

/**
 * حذف تگ‌های HTML از رشته (XSS Prevention)
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\\"/g, '"')
    .trim();
}

/**
 * اعتبارسنجی ایمیل
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * اعتبارسنجی شماره موبایل ایرانی
 */
export function isValidIranPhone(phone: string): boolean {
  const phoneRegex = /^09\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * محدود کردن طول رشته
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen);
}

/**
 * اعتبارسنجی و پاکسازی ورودی‌های فرم تماس
 */
export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export function validateContactInput(input: Partial<ContactInput>): {
  valid: boolean;
  error?: string;
  data?: ContactInput;
} {
  if (!input.name || typeof input.name !== "string") {
    return { valid: false, error: "نام الزامی است" };
  }
  if (!input.email || typeof input.email !== "string") {
    return { valid: false, error: "ایمیل الزامی است" };
  }
  if (!input.message || typeof input.message !== "string") {
    return { valid: false, error: "پیام الزامی است" };
  }

  const name = stripHtml(truncate(input.name, 100));
  const email = input.email.trim().toLowerCase();
  const message = stripHtml(truncate(input.message, 5000));
  const subject = input.subject ? stripHtml(truncate(input.subject, 50)) : undefined;

  if (name.length < 2) return { valid: false, error: "نام باید حداقل ۲ حرف باشد" };
  if (!isValidEmail(email)) return { valid: false, error: "ایمیل نامعتبر است" };
  if (message.length < 10) return { valid: false, error: "پیام باید حداقل ۱۰ حرف باشد" };

  const VALID_SUBJECTS = ["support", "booking", "payment", "artist", "partnership", "feedback", "other"];
  if (subject && !VALID_SUBJECTS.includes(subject)) {
    return { valid: false, error: "موضوع نامعتبر است" };
  }

  return {
    valid: true,
    data: { name, email, subject, message },
  };
}

/**
 * اعتبارسنجی ورودی‌های پروفایل
 */
export function sanitizeProfileInput(input: Record<string, unknown>): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  const stringFields = [
    "name", "firstName", "lastName", "email", "city", "province",
    "gender", "address", "postalCode", "bio", "avatarUrl", "coverUrl",
  ];

  for (const field of stringFields) {
    if (input[field] !== undefined) {
      if (typeof input[field] === "string") {
        result[field] = stripHtml(truncate(input[field] as string, field === "bio" ? 2000 : 200));
      } else {
        result[field] = null;
      }
    }
  }

  // Validate dateOfBirth
  if (input.dateOfBirth !== undefined) {
    const dob = input.dateOfBirth;
    if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      result.dateOfBirth = dob;
    } else {
      result.dateOfBirth = null;
    }
  }

  // Validate URLs
  for (const urlField of ["avatarUrl", "coverUrl"]) {
    const value = result[urlField];
    if (
      value &&
      !value.startsWith("/uploads/") &&
      !value.startsWith("/api/image-proxy?") &&
      !value.startsWith("http")
    ) {
      result[urlField] = null;
    }
  }

  return result;
}

/**
 * Detect common attack patterns in input
 */
export function containsAttackPattern(input: string): boolean {
  const patterns = [
    /(<script[\s>])/i,
    /(javascript:)/i,
    /(on\w+\s*=)/i,
    /(union\s+select)/i,
    /(insert\s+into)/i,
    /(delete\s+from)/i,
    /(drop\s+table)/i,
    /(\/etc\/passwd)/i,
    /(\/proc\/)/i,
    /(\\\\x00)/,
    /(\.\.\/)/,
    /(\.\.\\)/,
  ];
  return patterns.some((p) => p.test(input));
}
