"use server";

// ============================================================================
// سرویس یادداشت‌های مشتری (مینی CRM) - Server Actions
// ============================================================================

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/role-guard";
import type { ApiResponse } from "@/types";

function success<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, data } as ApiResponse<T>;
}

function error(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// Server Action: اضافه کردن یادداشت
// ============================================================================

export async function addClientNote(
  clientId: string,
  note: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    if (!note || note.length < 2) {
      return error("یادداشت باید حداقل ۲ کاراکتر باشد");
    }

    const clientNote = await db.clientNote.create({
      data: {
        artistId: profile.id,
        clientId,
        note,
      },
      select: { id: true },
    });

    return success("یادداشت اضافه شد", { id: clientNote.id });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: دریافت یادداشت‌های یک مشتری
// ============================================================================

export async function getClientNotes(
  clientId: string
): Promise<
  ApiResponse<{
    notes: {
      id: string;
      note: string;
      createdAt: string;
    }[];
  }>
> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    const notes = await db.clientNote.findMany({
      where: {
        artistId: profile.id,
        clientId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        note: true,
        createdAt: true,
      },
    });

    return success("یادداشت‌ها دریافت شد", {
      notes: notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}

// ============================================================================
// Server Action: حذف یادداشت
// ============================================================================

export async function deleteClientNote(noteId: string): Promise<ApiResponse> {
  try {
    const auth = await requireRole("ARTIST");
    if (auth.error) return auth.error;

    const profile = await db.artistProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true },
    });

    if (!profile) return error("پروفایل هنرمند یافت نشد");

    await db.clientNote.deleteMany({
      where: {
        id: noteId,
        artistId: profile.id,
      },
    });

    return success("یادداشت حذف شد");
  } catch (err: any) {
    console.error("خطا:", err);
    return error(err.message || "خطا");
  }
}
