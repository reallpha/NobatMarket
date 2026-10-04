// ============================================================================
// نوع‌های سبک Prisma برای نسخهٔ پیش‌نمایش (بدون پایگاه داده)
//
// در نسخهٔ اصلی، این نوع‌ها از کلاینت تولیدشدهٔ Prisma می‌آمدند. چون این نسخه
// هیچ پایگاه داده‌ای ندارد، یک جایگزین سبک اینجا تعریف می‌شود و از طریق
// مسیرهای tsconfig جای ماژول «@prisma/client» را می‌گیرد.
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

export namespace Prisma {
  export type ArtistProfileWhereInput = Record<string, any>;
  export type ArtistProfileOrderByWithRelationInput = Record<string, any>;
  export type PortfolioItemWhereInput = Record<string, any>;
  export type BookingWhereInput = Record<string, any>;
  export type UserWhereInput = Record<string, any>;
  export type GetPayload<T> = any;
  export type ArtistProfileGetPayload<T> = any;
  export type PortfolioItemGetPayload<T> = any;
  export type BookingGetPayload<T> = any;
  export type MessageGetPayload<T> = any;
  export type TransactionClient = any;
  export namespace NullableJsonNullValueInput {
    export type Value = any;
  }
}

export type PrismaClient = any;
