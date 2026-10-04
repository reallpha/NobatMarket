/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// کلاینت دادهٔ نمایشی — جایگزین Prisma در نسخهٔ پیش‌نمایش
//
// هیچ پایگاه داده‌ای وجود ندارد: همهٔ رکوردها در حافظهٔ همان پروسه (Worker)
// نگهداری می‌شوند و با هر بار بالا آمدن مجدد، از داده‌های نمونه بازسازی می‌شوند.
// API این کلاینت دقیقاً مثل Prisma است تا کد سرویس‌ها بدون تغییر کار کند.
//
// ریست خودکار ۲۴ ساعته:
//   بازدیدکننده‌های پیش‌نمایش می‌توانند تنظیمات/رکوردها را تغییر دهند. برای اینکه
//   نمایش همیشه «دست‌نخورده» بماند، هر ۲۴ ساعت (و همچنین با هر بار بالا آمدن
//   مجدد Worker) داده‌ها از نو ساخته می‌شوند و همهٔ تغییرات پاک می‌شوند.
// ============================================================================

import { buildTables } from "@/lib/demo/fixtures";
import { createMockClient, type Tables } from "@/lib/demo/engine";

/** فاصلهٔ ریست خودکار داده‌های نمایشی (۲۴ ساعت) */
const DEMO_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

const globalStore = globalThis as unknown as {
  __tyDemoTables?: Tables;
  __tyDemoDb?: any;
  __tyDemoBuiltAt?: number;
};

/**
 * کپی عمیق جدول‌ها
 *
 * داده‌های نمونه در fixtures به‌صورت ثابت‌های ماژول تعریف شده‌اند؛ بدون کپی،
 * هر ویرایش (مثلاً تغییر تنظیمات توسط بازدیدکننده) روی خودِ داده‌های اصلی نوشته
 * می‌شد و دیگر ریست‌کردن هیچ‌وقت به حالت اولیه برنمی‌گشت.
 */
function cloneTables(tables: Tables): Tables {
  const cloned: Tables = {};
  for (const [name, rows] of Object.entries(tables)) {
    try {
      cloned[name] = structuredClone(rows);
    } catch {
      // اگر جدولی داده‌ای غیرقابل‌کلون داشت، همان مرجع قبلی حفظ می‌شود
      cloned[name] = rows;
    }
  }
  return cloned;
}

function buildDemoDb(): any {
  const tables = cloneTables(buildTables());
  globalStore.__tyDemoTables = tables;
  globalStore.__tyDemoDb = createMockClient(tables);
  globalStore.__tyDemoBuiltAt = Date.now();
  return globalStore.__tyDemoDb;
}

/** ریست دستی داده‌های نمایشی (مثلاً از پنل مدیریت یا اسکریپت‌های نگهداری) */
export function resetDemoDb(): any {
  return buildDemoDb();
}

/** اگر داده‌ها قدیمی‌تر از ۲۴ ساعت شده باشند، از نو ساخته می‌شوند */
function freshDb(): any {
  const builtAt = globalStore.__tyDemoBuiltAt;
  if (!globalStore.__tyDemoDb || !builtAt || Date.now() - builtAt > DEMO_RESET_INTERVAL_MS) {
    return buildDemoDb();
  }
  return globalStore.__tyDemoDb;
}

/**
 * کلاینت دادهٔ نمایشی (شبیه PrismaClient)
 *
 * یک Proxy سبک روی کلاینت است تا پیش از هر دسترسی، انقضای ۲۴ ساعته بررسی شود؛
 * بنابراین ریست به‌صورت خودکار و بدون نیاز به cron اتفاق می‌افتد.
 */
export const db: any = new Proxy(
  {},
  {
    get(_target, property) {
      const client = freshDb();
      const value = client[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
    has(_target, property) {
      return property in freshDb();
    },
    ownKeys() {
      return Reflect.ownKeys(freshDb());
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Object.getOwnPropertyDescriptor(freshDb(), property);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  }
);

export default db;
