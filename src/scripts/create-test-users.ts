// ============================================================================
// اسکریپت ایجاد کاربران تستی - نوبت مارکت
// اجرا: npx tsx src/scripts/create-test-users.ts
// ============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const TEST_USERS = [
  {
    phone: "09121111111",
    displayName: "مدیر سیستم",
    password: "admin123",
    role: "ADMIN" as const,
  },
  {
    phone: "09122222222",
    displayName: "علی هنرمند",
    password: "artist123",
    role: "ARTIST" as const,
  },
  {
    phone: "09123333333",
    displayName: "سارا مشتری",
    password: "client123",
    role: "CLIENT" as const,
  },
];

async function main() {
  console.log("🔄 در حال ایجاد کاربران تستی...\n");

  for (const userData of TEST_USERS) {
    // بررسی وجود کاربر
    const existing = await db.user.findUnique({
      where: { phone: userData.phone },
    });

    if (existing) {
      console.log(`  ⏭️  ${userData.displayName} (${userData.phone}) - قبلاً وجود دارد`);
      continue;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const user = await db.user.create({
      data: {
        phone: userData.phone,
        displayName: userData.displayName,
        passwordHash,
        role: userData.role,
        status: "ACTIVE",
        preferredLanguage: "fa",
      },
    });

    console.log(`  ✅ ${userData.displayName} (${userData.phone}) - نقش: ${userData.role}`);

    // اگر هنرمند است، ArtistProfile بساز
    if (userData.role === "ARTIST") {
      await db.artistProfile.create({
        data: {
          userId: user.id,
          bio: "هنرمند حرفه‌ای تتو با ۵ سال تجربه در سبک‌های رئالیسم و فاین‌لاین",
          city: "تهران",
          experienceYears: 5,
          styles: ["رئالیسم", "فاین‌لاین", "مینیمال"],
          basePrice: 2000000n,
          isVerified: true,
          satisfactionScore: 4.8,
          totalReviews: 12,
          plan: "FREE" as const,
        },
      });
      console.log(`    → ArtistProfile ایجاد شد`);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 اطلاعات ورود به سیستم:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("  🔹 ادمین:");
  console.log("     شماره: 09121111111");
  console.log("     رمز:   admin123");
  console.log("     آدرس:  /admin/dashboard");
  console.log("");
  console.log("  🔹 هنرمند:");
  console.log("     شماره: 09122222222");
  console.log("     رمز:   artist123");
  console.log("     آدرس:  /artist/dashboard");
  console.log("");
  console.log("  🔹 مشتری:");
  console.log("     شماره: 09123333333");
  console.log("     رمز:   client123");
  console.log("     آدرس:  /client/dashboard");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
