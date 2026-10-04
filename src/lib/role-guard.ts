// ============================================================================
// نگهبان نقش (Role Guard) - Auth.js v5
// تابع کمکی برای بررسی دسترسی در Server Actions و API Routes
// ============================================================================

import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types";
import { redirect } from "next/navigation";

// ============================================================================
// انوم نقش‌ها
// ============================================================================

export type AllowedRole = "CLIENT" | "ARTIST" | "ADMIN";

// ============================================================================
// توابع کمکی پاسخ
// ============================================================================

function errorResponse(message: string): ApiResponse<never> {
  return { success: false, message } as ApiResponse<never>;
}

// ============================================================================
// تابع اصلی requireRole (Auth.js v5)
// ============================================================================

/**
 * بررسی نقش کاربر فعلی (Auth.js v5 pattern)
 *
 * @example
 * ```ts
 * "use server";
 * import { requireRole } from "@/lib/role-guard";
 *
 * export async function someAction() {
 *   const auth = await requireRole("ADMIN");
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 * }
 * ```
 */
export async function requireRole(
  ...allowedRoles: AllowedRole[]
): Promise<
  | {
      user: {
        id: string;
        phone: string;
        role: string;
        displayName: string;
      };
      error: null;
    }
  | { user: null; error: ApiResponse<never> }
> {
  try {
    // Auth.js v5: استفاده از auth() به جای getServerSession
    const session = await auth();

    if (!session?.user?.id) {
      return {
        user: null,
        error: errorResponse("برای دسترسی به این بخش باید وارد شوید"),
      };
    }

    const userRole = session.user.role;

    if (!allowedRoles.includes(userRole as AllowedRole)) {
      return {
        user: null,
        error: errorResponse("شما دسترسی به این بخش را ندارید"),
      };
    }

    return {
      user: {
        id: session.user.id,
        phone: session.user.phone,
        role: session.user.role,
        displayName: session.user.name || "کاربر",
      },
      error: null,
    };
  } catch (err) {
    console.error("خطا در بررسی نقش:", err);
    return {
      user: null,
      error: errorResponse("خطا در بررسی احراز هویت"),
    };
  }
}

/**
 * بررسی نقش کاربر (نسخه ساده‌تر) - Auth.js v5
 * اگر کاربر نقش مناسب نداشته باشد، redirect انجام می‌دهد
 */
export async function requireRoleOrRedirect(
  ...allowedRoles: AllowedRole[]
): Promise<{
  id: string;
  phone: string;
  role: string;
  displayName: string;
}> {
  const authResult = await requireRole(...allowedRoles);

  if (authResult.error) {
    redirect("/login?error=access_denied");
  }

  return authResult.user!;
}

/**
 * فقط بررسی ورود بودن کاربر (بدون بررسی نقش) - Auth.js v5
 */
export async function requireAuth(): Promise<
  | {
      user: {
        id: string;
        phone: string;
        role: string;
        displayName: string;
      };
      error: null;
    }
  | { user: null; error: ApiResponse<never> }
> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        user: null,
        error: errorResponse("برای دسترسی به این بخش باید وارد شوید"),
      };
    }

    return {
      user: {
        id: session.user.id,
        phone: session.user.phone,
        role: session.user.role,
        displayName: session.user.name || "کاربر",
      },
      error: null,
    };
  } catch (err) {
    console.error("خطا در بررسی احراز هویت:", err);
    return {
      user: null,
      error: errorResponse("خطا در بررسی احراز هویت"),
    };
  }
}
