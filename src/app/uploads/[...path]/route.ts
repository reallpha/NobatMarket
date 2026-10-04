import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// ============================================================================
// سرو فایل‌های آپلودشده از دیسک
//
// در حالت standalone سرور استاتیک Next.js فقط فایل‌هایی را که هنگام بالا آمدن
// سرور وجود داشته‌اند سرو می‌کند؛ فایل‌های جدید آپلودشده تا ری‌استارت ۴۰۴
// می‌دادند. این مسیر فایل را مستقیم از پوشه uploads می‌خواند تا تصاویر جدید
// بلافاصله قابل نمایش باشند.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  pdf: "application/pdf",
  txt: "text/plain",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path || [];

  // ─── جلوگیری از Path Traversal ───
  for (const seg of segments) {
    if (!seg || seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\") || seg.includes("\0")) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }
  if (segments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadDir, ...segments);

  // اطمینان از اینکه مسیر نهایی داخل پوشه uploads است
  if (!filePath.startsWith(path.resolve(uploadDir) + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = (segments[segments.length - 1].split(".").pop() || "").toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
