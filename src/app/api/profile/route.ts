import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeProfileInput, containsAttackPattern } from "@/lib/sanitize";

function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) return true;
  const host = req.headers.get("host") || "";
  return origin.includes(host) || origin.includes("localhost");
}


export async function PUT(req: NextRequest) {
  try {
    if (!validateOrigin(req)) {
      return NextResponse.json({ success: false, message: "Invalid origin" }, { status: 403 });
    }
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "لطفاً وارد شوید" }, { status: 401 });
    }

    const body = await req.json();

    // Check for attack patterns in all string values
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string" && containsAttackPattern(value)) {
        return NextResponse.json({ success: false, message: "ورودی نامعتبر" }, { status: 400 });
      }
    }

    // Sanitize all inputs
    const sanitized = sanitizeProfileInput(body);

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      name: "displayName", firstName: "firstName", lastName: "lastName",
      email: "email", city: "city", province: "province", gender: "gender",
      address: "address", postalCode: "postalCode", bio: "bio",
      avatarUrl: "avatarUrl", coverUrl: "coverUrl", dateOfBirth: "dateOfBirth",
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (sanitized[key] !== undefined) {
        if (key === "dateOfBirth") {
          updateData[dbField] = sanitized[key] ? new Date(sanitized[key]!) : null;
        } else {
          updateData[dbField] = sanitized[key] || null;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: "هیچ فیلدی ارسال نشد" });
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, displayName: true, avatarUrl: true, coverUrl: true },
    });

    return NextResponse.json({ success: true, message: "پروفایل با موفقیت ذخیره شد", data: { user: updatedUser } });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ success: false, message: "خطا در ذخیره‌سازی" }, { status: 500 });
  }
}
