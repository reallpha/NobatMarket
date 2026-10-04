import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateContactInput } from "@/lib/sanitize";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

// Origin validation — blocks CSRF from external origins
function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) return true; // Some clients don't send origin
  const host = req.headers.get("host") || "";
  return origin.includes(host) || origin.includes("localhost");
}

export async function POST(req: NextRequest) {
  try {
    // CSRF: validate origin
    if (!validateOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "درخواست نامعتبر" },
        { status: 403 }
      );
    }

    // Rate limit: 3 messages per 5 minutes per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const rateLimit = enforceRateLimit(`contact:${ip}`, {
      maxRequests: 3,
      windowMs: 5 * 60 * 1000,
      message: "تعداد پیام‌ها بیش از حد مجاز است. لطفاً ۵ دقیقه صبر کنید.",
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimit.error },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate and sanitize input
    const validation = validateContactInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validation.data!;

    const contactMessage = await db.contactMessage.create({
      data: { name, email, subject: subject || null, message },
    });

    return NextResponse.json({
      success: true,
      message: "پیام شما با موفقیت ارسال شد",
      data: { id: contactMessage.id },
    });
  } catch (err) {
    console.error("Contact message error:", err);
    return NextResponse.json(
      { success: false, message: "خطا در ارسال پیام" },
      { status: 500 }
    );
  }
}

// GET requires admin auth — only admins can view messages
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter"); // "unread", "replied", or null

    const where: Record<string, unknown> = {};
    if (filter === "unread") where.read = false;
    if (filter === "replied") where.replied = true;

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      where,
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (err) {
    console.error("Fetch messages error:", err);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت پیام‌ها" },
      { status: 500 }
    );
  }
}
