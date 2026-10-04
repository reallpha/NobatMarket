// ============================================================================
// Auth.js v5 - فایل پیکربندی (Config)
// این فایل شامل تنظیمات احراز هویت است که در سمت سرور استفاده می‌شود
// ============================================================================

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// ============================================================================
// پیکربندی اصلی Auth.js
// ============================================================================

export default {
  // ارائه‌دهندگان احراز هویت
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: {
          label: "شماره موبایل",
          type: "text",
          placeholder: "09123456789",
        },
        password: {
          label: "رمز عبور",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        // پاکسازی شماره موبایل
        const phone = (credentials.phone as string)
          .replace(/[\s\-()+]/g, "")
          .trim();

        // جستجوی کاربر
        const user = await db.user.findUnique({
          where: { phone },
          select: {
            id: true,
            phone: true,
            passwordHash: true,
            displayName: true,
            role: true,
            status: true,
          },
        });

        if (!user) {
          return null;
        }

        // بررسی وضعیت حساب (با انقضای خودکار مسدودیت ۷۲ ساعته)
        if (user.status === "SUSPENDED") {
          try {
            const recent = await db.auditLog.findMany({
              where: { action: "SUSPEND_72H" },
              orderBy: { createdAt: "desc" },
              take: 50,
              select: { details: true },
            });
            let tempUntil: number | null = null;
            for (const log of recent) {
              const d = log.details as unknown as { userId?: string; until?: string } | null;
              if (d?.userId === user.id && d?.until) {
                tempUntil = new Date(d.until).getTime();
                break;
              }
            }
            if (tempUntil && tempUntil <= Date.now()) {
              await db.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
              user.status = "ACTIVE" as typeof user.status;
            } else {
              return null;
            }
          } catch {
            return null;
          }
        }
        if (user.status === "INACTIVE") {
          return null;
        }

        // بررسی رمز عبور
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // بروزرسانی آخرین زمان آنلاین
        await db.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return {
          id: user.id,
          phone: user.phone,
          name: user.displayName,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],

  // صفحات سفارشی
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // کالبک‌ها
  callbacks: {
    // فراخوانی هنگام ایجاد توکن JWT
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as unknown as Record<string, string>).phone;
        token.role = (user as unknown as Record<string, string>).role;
        token.status = (user as unknown as Record<string, string>).status;
      }
      return token;
    },

    // فراخوانی هنگام ایجاد session
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },

    // اجازه دسترسی
    signIn() {
      return true;
    },

    // مدیریت redirect
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl) return url;
      } catch {
        // ignore
      }
      return baseUrl;
    },
  },

  // استراتژی جلسه: JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // ۳۰ روز
  },

  // کلید رمزگذاری
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthOptions;
