import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.read !== undefined) updateData.read = body.read;
    if (body.replied !== undefined) updateData.replied = body.replied;

    const updated = await db.contactMessage.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update message error:", err);
    return NextResponse.json({ success: false, message: "خطا" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    await db.contactMessage.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete message error:", err);
    return NextResponse.json({ success: false, message: "خطا" }, { status: 500 });
  }
}
