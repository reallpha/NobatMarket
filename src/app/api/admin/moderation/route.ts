import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================================
// بازبینی آثار توسط ادمین
// PUT { type: "portfolio" | "flash", id, action: "approve" | "reject", reason? }
// DELETE ?type=...&id=...
// ============================================================================

async function getArtistUserId(type: string, id: string): Promise<string | null> {
  try {
    if (type === "portfolio") {
      const item = await db.portfolioItem.findUnique({
        where: { id },
        select: { artistProfile: { select: { userId: true } } },
      });
      return item?.artistProfile.userId ?? null;
    }
    if (type === "flash") {
      const item = await db.flashTattoo.findUnique({
        where: { id },
        select: { artistProfile: { select: { userId: true } } },
      });
      return item?.artistProfile.userId ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function notifyArtist(
  userId: string | null,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  if (!userId) return;
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: "WARNING",
        link: link || null,
      },
    });
  } catch (err) {
    console.error("خطا در ارسال اعلان:", err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, action, reason } = body as {
      type?: string;
      id?: string;
      action?: string;
      reason?: string;
    };

    if (!type || !id || !action) {
      return NextResponse.json(
        { error: "type, id و action الزامی است" },
        { status: 400 }
      );
    }

    const artistUserId = await getArtistUserId(type, id);

    if (type === "portfolio") {
      const item = await db.portfolioItem.findUnique({
        where: { id },
        select: { id: true, title: true },
      });
      if (!item) {
        return NextResponse.json({ error: "نمونه‌کار یافت نشد" }, { status: 404 });
      }

      if (action === "approve") {
        await db.portfolioItem.update({
          where: { id },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        await notifyArtist(
          artistUserId,
          "نمونه‌کار شما تأیید شد ✅",
          `نمونه‌کار «${item.title}» توسط ادمین تأیید و منتشر شد.`,
          "/artist/dashboard/portfolio"
        );
        return NextResponse.json({ success: true, message: "نمونه‌کار تأیید و منتشر شد" });
      }

      if (action === "reject") {
        await db.portfolioItem.update({
          where: { id },
          data: { status: "ARCHIVED", publishedAt: null },
        });
        await notifyArtist(
          artistUserId,
          "نمونه‌کار شما رد شد ❌",
          `نمونه‌کار «${item.title}» رد شد.${
            reason?.trim() ? `\n\nدلیل رد: ${reason.trim()}` : ""
          }`,
          "/artist/dashboard/portfolio"
        );
        return NextResponse.json({ success: true, message: "نمونه‌کار رد شد" });
      }
    }

    if (type === "flash") {
      const flash = await db.flashTattoo.findUnique({
        where: { id },
        select: { id: true, title: true },
      });
      if (!flash) {
        return NextResponse.json({ error: "تتوی فلش یافت نشد" }, { status: 404 });
      }

      if (action === "approve") {
        await db.flashTattoo.update({
          where: { id },
          data: { status: "APPROVED", approvedAt: new Date(), isAvailable: true },
        });
        await notifyArtist(
          artistUserId,
          "تتوی فلش شما تأیید شد ✅",
          `تتوی فلش «${flash.title}» توسط ادمین تأیید و منتشر شد.`,
          "/artist/dashboard/flash"
        );
        return NextResponse.json({ success: true, message: "تتوی فلش تأیید و منتشر شد" });
      }

      if (action === "reject") {
        await db.flashTattoo.update({
          where: { id },
          data: { status: "REJECTED", isAvailable: false },
        });
        await notifyArtist(
          artistUserId,
          "تتوی فلش شما رد شد ❌",
          `تتوی فلش «${flash.title}» رد شد.${
            reason?.trim() ? `\n\nدلیل رد: ${reason.trim()}` : ""
          }`,
          "/artist/dashboard/flash"
        );
        return NextResponse.json({ success: true, message: "تتوی فلش رد شد" });
      }
    }

    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  } catch (err: any) {
    console.error("Moderation error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// حذف اثر
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "type و id الزامی است" },
        { status: 400 }
      );
    }

    if (type === "portfolio") {
      await db.portfolioItem.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "نمونه‌کار حذف شد" });
    }

    if (type === "flash") {
      await db.flashTattoo.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "تتوی فلش حذف شد" });
    }

    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  } catch (err: any) {
    console.error("Moderation delete error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}