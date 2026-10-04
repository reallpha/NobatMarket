import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { enforceRateLimit } from "@/lib/rate-limit";

// ============================================================================
// قوانین نوع فایل
// ----------------------------------------------------------------------------
// ⚠️ نکته امنیتی: فهرست زیر «جهان مجاز» سرور است و با تنظیمات ادمین جایگزین
// نمی‌شود، بلکه با آن «اشتراک» گرفته می‌شود. بنابراین ادمین می‌تواند فهرست را
// محدودتر کند ولی نمی‌تواند فرمت خطرناکی مثل SVG را فعال کند.
// ============================================================================
type MimeRule = { exts: string[]; magic: string[] };

const SAFE_IMAGE_RULES: Record<string, MimeRule> = {
  "image/jpeg": { exts: ["jpg", "jpeg", "jpe"], magic: ["ffd8ff"] },
  "image/png": { exts: ["png"], magic: ["89504e47"] },
  "image/webp": { exts: ["webp"], magic: ["52494646"] },
  "image/gif": { exts: ["gif"], magic: ["47494638"] },
  "image/avif": { exts: ["avif"], magic: [""] },
  "image/bmp": { exts: ["bmp"], magic: ["424d"] },
  "image/tiff": { exts: ["tif", "tiff"], magic: ["49492a00", "4d4d002a"] },
  "image/heic": { exts: ["heic", "heif"], magic: [""] },
};

const DEFAULT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FALLBACK_MAX_MB = 10;
/** سقف سخت سرور — حتی اگر ادمین عدد بزرگ‌تری بگذارد */
const HARD_MAX_MB = 50;

/**
 * قوانین مؤثر از تنظیمات ادمین:
 * MAX_UPLOAD_SIZE_MB و ALLOWED_IMAGE_TYPES
 */
async function resolveUploadRules(): Promise<{
  allowed: Record<string, MimeRule>;
  maxBytes: number;
  maxMb: number;
}> {
  const { getNumberSetting, getSetting } = await import(
    "@/lib/server-settings"
  );
  const [maxMbRaw, typesRaw] = await Promise.all([
    getNumberSetting("MAX_UPLOAD_SIZE_MB", FALLBACK_MAX_MB, {
      min: 1,
      max: HARD_MAX_MB,
    }),
    getSetting("ALLOWED_IMAGE_TYPES", "jpg,jpeg,png,webp"),
  ]);

  const wantedExts = new Set(
    typesRaw
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^\./, ""))
      .filter(Boolean)
  );

  const allowed: Record<string, MimeRule> = {};
  for (const [mime, rule] of Object.entries(SAFE_IMAGE_RULES)) {
    if (rule.exts.some((e) => wantedExts.has(e))) allowed[mime] = rule;
  }

  // اگر ادمین فهرست خالی/نامعتبر گذاشته بود، به پیش‌فرض امن برگرد
  const effective =
    Object.keys(allowed).length > 0
      ? allowed
      : Object.fromEntries(
          DEFAULT_IMAGE_TYPES.map((m) => [m, SAFE_IMAGE_RULES[m]])
        );

  const maxMb = Number.isFinite(maxMbRaw) ? maxMbRaw : FALLBACK_MAX_MB;
  return { allowed: effective, maxBytes: maxMb * 1024 * 1024, maxMb };
}

function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) return true;
  const host = req.headers.get("host") || "";
  return origin.includes(host) || origin.includes("localhost");
}

export async function POST(req: NextRequest) {
  try {
    // CSRF check
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 uploads per 10 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = enforceRateLimit(`upload:${ip}`, {
      maxRequests: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Upload limit exceeded" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // قوانین از تنظیمات ادمین (حجم و نوع فایل)
    const { allowed, maxBytes, maxMb } = await resolveUploadRules();

    // Validate file type
    const declaredType = file.type.toLowerCase();
    const normalizedType =
      declaredType === "image/jpg" || declaredType === "image/pjpeg"
        ? "image/jpeg"
        : declaredType;
    if (!allowed[normalizedType]) {
      return NextResponse.json(
        { error: "فرمت فایل مجاز نیست" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `حجم فایل بیش از حد مجاز (${maxMb} مگابایت)` },
        { status: 400 }
      );
    }

    // Validate filename (no path traversal)
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (originalName.includes("..") || originalName.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify file magic bytes (not just extension)
    const magicBytes = buffer.slice(0, 4).toString("hex");
    const expectedMagic = (allowed[normalizedType]?.magic ?? []).filter(Boolean);
    if (
      expectedMagic.length > 0 &&
      !expectedMagic.some((m) => magicBytes.startsWith(m))
    ) {
      return NextResponse.json({ error: "File content does not match type" }, { status: 400 });
    }

    // پسوند از فهرست مجاز سرور گرفته می‌شود، نه از نام فایل کاربر
    // (نام فایل می‌تواند کاراکترهای مسیر مانند «/» یا «..» داشته باشد).
    const ext = allowed[normalizedType]?.exts[0] ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
