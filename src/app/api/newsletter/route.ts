import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripHtml } from "@/lib/sanitize";

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = stripHtml(body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "ایمیل معتبر وارد کنید" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({
          success: true,
          message: "شما قبلاً عضو خبرنامه شدید",
          alreadySubscribed: true,
        });
      }
      // Reactivate if was unsubscribed
      await db.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true },
      });
      return NextResponse.json({
        success: true,
        message: "عضویت شما مجدداً فعال شد",
      });
    }

    // Create new subscriber
    await db.newsletterSubscriber.create({
      data: { email },
    });

    return NextResponse.json({
      success: true,
      message: "عضویت شما در خبرنامه ثبت شد",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در ثبت عضویت" },
      { status: 500 }
    );
  }
}

// GET - List all subscribers (admin only)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [subscribers, total] = await Promise.all([
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.newsletterSubscriber.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: subscribers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// DELETE - Unsubscribe (admin)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    await db.newsletterSubscriber.delete({ where: { id } });
  } else {
    const body = await request.json();
    if (body.email) {
      await db.newsletterSubscriber.delete({ where: { email: body.email } });
    }
  }

  return NextResponse.json({ success: true });
}
