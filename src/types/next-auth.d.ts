// ============================================================================
// تایپ‌های سفارشی NextAuth - نوبت مارکت
// ============================================================================

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: string;
      status: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    role: string;
    status: string;
  }
}
