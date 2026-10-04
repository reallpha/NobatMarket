// ============================================================================
// داده‌های نمونه (Seed Data) - پلتفرم نوبت مارکت
// شامل اطلاعات واقعی و حرفه‌ای به زبان فارسی
// ============================================================================

import { PrismaClient, UserRole, UserStatus, TattooStyle, TattooSize, BookingStatus, PaymentStatus, DayOfWeek, PortfolioStatus, CustomRequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// توابع کمکی
// ============================================================================

function generateBookingNumber(): string {
  const prefix = "TY";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// تابع اصلی seed
// ============================================================================

async function main() {
  console.log("🎨 شروع ذخیره داده‌های نمونه نوبت مارکت...\n");

  // ============================================================================
  // ۱. ساخت کاربران
  // ============================================================================
  console.log("👤 در حال ساخت کاربران...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // ادمین
  const admin = await prisma.user.create({
    data: {
      phone: "09991234567",
      email: "admin@nobat-market.com",
      passwordHash,
      displayName: "مدیر سیستم",
      firstName: "مدیر",
      lastName: "نوبت مارکت",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      city: "تهران",
      province: "تهران",
      preferredLanguage: "fa",
    },
  });
  console.log(`  ✅ ادمین: ${admin.displayName}`);

  // مشتریان
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        phone: "09121111111",
        email: "negar.k@gmail.com",
        passwordHash,
        displayName: "نگار کیانی",
        firstName: "نگار",
        lastName: "کیانی",
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        gender: "FEMALE",
        city: "تهران",
        province: "تهران",
        preferredLanguage: "fa",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09122222222",
        email: "arash.m@gmail.com",
        passwordHash,
        displayName: "آرش محمدی",
        firstName: "آرش",
        lastName: "محمدی",
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        gender: "MALE",
        city: "اصفهان",
        province: "اصفهان",
        preferredLanguage: "fa",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09123333333",
        email: "sara.h@gmail.com",
        passwordHash,
        displayName: "سارا حسینی",
        firstName: "سارا",
        lastName: "حسینی",
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        gender: "FEMALE",
        city: "شیراز",
        province: "فارس",
        preferredLanguage: "fa",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09124444444",
        email: "mehdi.a@gmail.com",
        passwordHash,
        displayName: "مهدی احمدی",
        firstName: "مهدی",
        lastName: "احمدی",
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        gender: "MALE",
        city: "تبریز",
        province: "آذربایجان شرقی",
        preferredLanguage: "fa",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09125555555",
        email: "zahra.r@gmail.com",
        passwordHash,
        displayName: "زهرا رضایی",
        firstName: "زهرا",
        lastName: "رضایی",
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        gender: "FEMALE",
        city: "تهران",
        province: "تهران",
        preferredLanguage: "fa",
      },
    }),
  ]);
  console.log(`  ✅ ${clients.length} مشتری ایجاد شد`);

  // هنرمندان
  const artists = await Promise.all([
    prisma.user.create({
      data: {
        phone: "09131111111",
        email: "sara.ink@gmail.com",
        passwordHash,
        displayName: "سارا اینک",
        firstName: "سارا",
        lastName: "اینک",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
        gender: "FEMALE",
        city: "تهران",
        province: "تهران",
        preferredLanguage: "fa",
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09132222222",
        email: "reza.inkmaster@gmail.com",
        passwordHash,
        displayName: "رضا اینک‌مستر",
        firstName: "رضا",
        lastName: "کریمی",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
        gender: "MALE",
        city: "تهران",
        province: "تهران",
        preferredLanguage: "fa",
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/indoor-tour.jpg",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09133333333",
        email: "ali.needles@gmail.com",
        passwordHash,
        displayName: "علی نیدلز",
        firstName: "علی",
        lastName: "نصیری",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
        gender: "MALE",
        city: "اصفهان",
        province: "اصفهان",
        preferredLanguage: "fa",
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/kitchen-bar.jpg",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09134444444",
        email: "maryam.arts@gmail.com",
        passwordHash,
        displayName: "مریم آرتس",
        firstName: "مریم",
        lastName: "صالحی",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
        gender: "FEMALE",
        city: "شیراز",
        province: "فارس",
        preferredLanguage: "fa",
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/jazz.jpg",
      },
    }),
    prisma.user.create({
      data: {
        phone: "09135555555",
        email: "amir.darklines@gmail.com",
        passwordHash,
        displayName: "امیر دارک‌لاینز",
        firstName: "امیر",
        lastName: "رضوانی",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
        gender: "MALE",
        city: "تبریز",
        province: "آذربایجان شرقی",
        preferredLanguage: "fa",
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/bicycle.jpg",
      },
    }),
  ]);
  console.log(`  ✅ ${artists.length} هنرمند ایجاد شد`);

  // ============================================================================
  // ۲. ساخت پروفایل‌های هنرمند
  // ============================================================================
  console.log("\n🎨 در حال ساخت پروفایل‌های هنرمند...");

  const artistProfiles = await Promise.all([
    // سارا اینک - متخصص مینیمال و بلک‌ورک
    prisma.artistProfile.create({
      data: {
        userId: artists[0].id,
        artistName: "سارا اینک",
        slug: "sara-ink",
        shortBio: "متخصص تتوهای مینیمال و بلک‌ورک",
        fullBio: "من سارا هستم، هنرمند تتو با بیش از ۷ سال تجربه در سبک‌های مینیمال و بلک‌ورک. علاقه‌ام به هنر از دوران کودکی شروع شد و امروز توانسته‌ام با ترکیب هنر سنتی ایرانی و تکنیک‌های مدرن، آثار منحصربفردی خلق کنم. هر تتو برایم داستانی دارد و تلاش می‌کنم تا بهترین نتیجه را برای مشتریانم به ارمغان بیاورم.",
        experienceYears: 7,
        specializations: [TattooStyle.MINIMAL, TattooStyle.BLACKWORK, TattooStyle.LINE_ART, TattooStyle.DOTWORK],
        isVerified: true,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        minPrice: BigInt(2000000),     // ۲ میلیون تومان
        maxPrice: BigInt(15000000),    // ۱۵ میلیون تومان
        averageSessionDuration: 120,
        completedBookings: 156,
        totalEarnings: BigInt(250000000), // ۲۵۰ میلیون تومان
        followerCount: 12400,
        platformFeePercent: 15.0,
        satisfactionScore: 94.5,
        instagramUrl: "https://instagram.com/sara.ink",
        telegramUrl: "https://t.me/sara_ink",
      },
    }),

    // رضا اینک‌مستر - متخصص رئالیسم و پرتره
    prisma.artistProfile.create({
      data: {
        userId: artists[1].id,
        artistName: "رضا اینک‌مستر",
        slug: "reza-inkmaster",
        shortBio: "استاد رئالیسم و پرتره‌های هنری",
        fullBio: "رضا کریمی هستم، معروف به اینک‌مستر. با ۱۲ سال تجربه حرفه‌ای در سبک رئالیسم و پرتره، یکی از شناخته‌شده‌ترین هنرمندان تتو در تهران هستم. تخصص من در تتوهای پرتره، حیوانات و مناظر طبیعی است. از تکنیک‌های پیشرفته سایه‌زنی و رنگ‌آمیزی برای خلق آثار فوق‌العاده واقع‌گرایانه استفاده می‌کنم.",
        experienceYears: 12,
        specializations: [TattooStyle.REALISM, TattooStyle.BLACK_AND_GREY, TattooStyle.COLOR, TattooStyle.OLD_SCHOOL],
        isVerified: true,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        minPrice: BigInt(5000000),     // ۵ میلیون تومان
        maxPrice: BigInt(25000000),    // ۲۵ میلیون تومان
        averageSessionDuration: 180,
        completedBookings: 312,
        totalEarnings: BigInt(680000000), // ۶۸۰ میلیون تومان
        followerCount: 28500,
        platformFeePercent: 12.0,
        satisfactionScore: 97.2,
        instagramUrl: "https://instagram.com/reza.inkmaster",
        telegramUrl: "https://t.me/reza_inkmaster",
      },
    }),

    // علی نیدلز - متخصص ژئومتریک و آبستره
    prisma.artistProfile.create({
      data: {
        userId: artists[2].id,
        artistName: "علی نیدلز",
        slug: "ali-needles",
        shortBio: "هنرمند ژئومتریک و آبستره مدرن",
        fullBio: "علی نصیری هستم، هنرمند تتو از اصفهان. تخصص من در سبک‌های ژئومتریک، آبستره و سیمبلیک است. با الهام از معماری اصفهان و هنرهای اسلامی، طرح‌هایی منحصربفرد خلق می‌کنم که ترکیبی از هنر سنتی و مدرن هستند. هر طرح با دقت و حوصله فراوان و با رعایت اصول بهداشتی انجام می‌شود.",
        experienceYears: 5,
        specializations: [TattooStyle.GEOMETRIC, TattooStyle.ABSTRACT, TattooStyle.DOTWORK, TattooStyle.MINIMAL],
        isVerified: true,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        minPrice: BigInt(1500000),     // ۱.۵ میلیون تومان
        maxPrice: BigInt(10000000),    // ۱۰ میلیون تومان
        averageSessionDuration: 150,
        completedBookings: 89,
        totalEarnings: BigInt(120000000), // ۱۲۰ میلیون تومان
        followerCount: 7800,
        platformFeePercent: 15.0,
        satisfactionScore: 91.8,
        instagramUrl: "https://instagram.com/ali.needles",
      },
    }),

    // مریم آرتس - متخصص واتروکالر و فلورال
    prisma.artistProfile.create({
      data: {
        userId: artists[3].id,
        artistName: "مریم آرتس",
        slug: "maryam-arts",
        shortBio: "خالق تتوهای واتروکالر و فلورال",
        fullBio: "مریم صالحی هستم، هنرمند تتو از شیراز. علاقه‌ام به رنگ‌ها و طبیعت باعث شد تا در سبک واتروکالر و فلورال تخصص پیدا کنم. هر تتو من مثل یک تابلوی نقاشی است که با جوهر و سوزن خلق می‌شود. از گل‌ها، پروانه‌ها و عناصر طبیعی برای طراحی استفاده می‌کنم.",
        experienceYears: 4,
        specializations: [TattooStyle.WATERCOLOR, TattooStyle.MINIMAL, TattooStyle.LINE_ART, TattooStyle.COLOR],
        isVerified: false,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        minPrice: BigInt(1000000),     // ۱ میلیون تومان
        maxPrice: BigInt(8000000),     // ۸ میلیون تومان
        averageSessionDuration: 120,
        completedBookings: 54,
        totalEarnings: BigInt(65000000), // ۶۵ میلیون تومان
        followerCount: 4200,
        platformFeePercent: 15.0,
        satisfactionScore: 93.1,
        instagramUrl: "https://instagram.com/maryam.arts",
        telegramUrl: "https://t.me/maryam_arts",
      },
    }),

    // امیر دارک‌لاینز - متخصص بلک‌ورک و تریبل
    prisma.artistProfile.create({
      data: {
        userId: artists[4].id,
        artistName: "امیر دارک‌لاینز",
        slug: "amir-darklines",
        shortBio: "استاد بلک‌ورک و تریبل",
        fullBio: "امیر رضوانی هستم، معروف به دارک‌لاینز. با ۸ سال تجربه در سبک‌های بلک‌ورک، تریبل و دات‌ورک، آثار قدرتمند و چشمگیری خلق می‌کنم. الهام‌بخش من فرهنگ‌های بومی و هنرهای آفریقایی و مائوری است. هر تتو با جزئیات بالا و تکنیک‌های پیشرفته اجرا می‌شود.",
        experienceYears: 8,
        specializations: [TattooStyle.BLACKWORK, TattooStyle.TRIBAL, TattooStyle.DOTWORK, TattooStyle.GEOMETRIC],
        isVerified: true,
        isAcceptingBookings: true,
        acceptsCustomRequests: true,
        minPrice: BigInt(3000000),     // ۳ میلیون تومان
        maxPrice: BigInt(18000000),    // ۱۸ میلیون تومان
        averageSessionDuration: 160,
        completedBookings: 201,
        totalEarnings: BigInt(420000000), // ۴۲۰ میلیون تومان
        followerCount: 15600,
        platformFeePercent: 13.0,
        satisfactionScore: 95.7,
        instagramUrl: "https://instagram.com/amir.darklines",
        telegramUrl: "https://t.me/amir_darklines",
      },
    }),
  ]);
  console.log(`  ✅ ${artistProfiles.length} پروفایل هنرمند ایجاد شد`);

  // ============================================================================
  // ۳. ساخت استودیوها
  // ============================================================================
  console.log("\n🏠 در حال ساخت استودیوها...");

  const studios = await Promise.all([
    prisma.studio.create({
      data: {
        name: "استودیو اینک‌هاوس",
        slug: "inkhouse-studio",
        description: "لوکس‌ترین استودیوی تتو در تهران",
        fullDescription: "اینک‌هاوس یکی از لوکس‌ترین و حرفه‌ای‌ترین استودیوهای تتو در تهران است. با تیمی از بهترین هنرمندان و تجهیزات پیشرفته، محیطی امن، بهداشتی و حرفه‌ای برای خلق بهترین تتوها فراهم کرده‌ایم. هر مشتری تجربه‌ای منحصربفرد و فراموش‌نشدنی خواهد داشت.",
        address: "خیابان ولیعصر، نبش کوچه گل",
        city: "تهران",
        province: "تهران",
        phone: "02112345678",
        email: "info@inkhouse-studio.com",
        latitude: 35.7219,
        longitude: 51.3825,
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spaghetti.jpg",
          "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg",
        ],
        isActive: true,
        isVerified: true,
        averageRating: 4.8,
        reviewCount: 245,
        artistCount: 3,
        instagramUrl: "https://instagram.com/inkhouse.tehran",
      },
    }),
    prisma.studio.create({
      data: {
        name: "استودیو هنر سیاه",
        slug: "black-art-studio",
        description: "استودیوی تخصصی بلک‌ورک و دات‌ورک",
        fullDescription: "استودیو هنر سیاه با تمرکز بر سبک‌های بلک‌ورک و دات‌ورک، فضایی مینیمال و حرفه‌ای برای علاقه‌مندان به این سبک‌ها فراهم کرده است. تیم ما از بهترین هنرمندان این حوزه تشکیل شده و هر پروژه با دقت و حوصله اجرا می‌شود.",
        address: "خیابان کریم‌خان زند، پلاک ۱۲۳",
        city: "تهران",
        province: "تهران",
        phone: "02187654321",
        email: "info@blackart-studio.com",
        latitude: 35.6892,
        longitude: 51.3890,
        images: [],
        isActive: true,
        isVerified: true,
        averageRating: 4.6,
        reviewCount: 178,
        artistCount: 2,
        instagramUrl: "https://instagram.com/blackart.tehran",
      },
    }),
    prisma.studio.create({
      data: {
        name: "آتلیه نیدلز اصفهان",
        slug: "needles-isfahan",
        description: "استودیوی خلاق با الهام از هنر اصفهان",
        fullDescription: "آتلیه نیدلز با الهام از معماری و هنرهای اصفهان، طرح‌های منحصربفردی خلق می‌کند. فضای آرام و هنری استودیو، تجربه‌ای لذت‌بخش از تتو را برای مشتریان فراهم می‌کند.",
        address: "خیابان چهارباغ عباسی، روبروی هتل عباسی",
        city: "اصفهان",
        province: "اصفهان",
        phone: "03112345678",
        email: "info@needles-isfahan.com",
        latitude: 32.6546,
        longitude: 51.6680,
        images: [],
        isActive: true,
        isVerified: true,
        averageRating: 4.9,
        reviewCount: 120,
        artistCount: 1,
      },
    }),
  ]);
  console.log(`  ✅ ${studios.length} استودیو ایجاد شد`);

  // ============================================================================
  // ۴. اتصال هنرمندان به استودیوها
  // ============================================================================
  console.log("\n🔗 در حال اتصال هنرمندان به استودیوها...");

  await prisma.studioArtist.createMany({
    data: [
      { artistProfileId: artistProfiles[0].id, studioId: studios[0].id, isActive: true, studioSharePercent: 30 },
      { artistProfileId: artistProfiles[1].id, studioId: studios[0].id, isActive: true, studioSharePercent: 25 },
      { artistProfileId: artistProfiles[1].id, studioId: studios[1].id, isActive: false, studioSharePercent: 30, endDate: new Date("2024-01-01") },
      { artistProfileId: artistProfiles[2].id, studioId: studios[2].id, isActive: true, studioSharePercent: 20 },
      { artistProfileId: artistProfiles[4].id, studioId: studios[1].id, isActive: true, studioSharePercent: 28 },
    ],
  });
  console.log("  ✅ اتصال هنرمندان به استودیوها انجام شد");

  // ============================================================================
  // ۵. ساخت سرویس‌ها
  // ============================================================================
  console.log("\n📋 در حال ساخت سرویس‌ها...");

  const services = await Promise.all([
    // سرویس‌های سارا اینک
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        name: "تتو مینیمال کوچک",
        description: "تتو مینیمال با خطوط ظریف، مناسب برای طرح‌های ساده و شیک",
        basePrice: BigInt(2000000),
        maxPrice: BigInt(5000000),
        durationMinutes: 60,
        supportedSizes: ["SMALL", "MEDIUM"],
        isActive: true,
        bookingCount: 89,
      },
    }),
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        name: "بلک‌ورک متوسط",
        description: "تتو بلک‌ورک با جزئیات بالا و سایه‌زنی حرفه‌ای",
        basePrice: BigInt(4000000),
        maxPrice: BigInt(10000000),
        durationMinutes: 120,
        supportedSizes: ["MEDIUM", "LARGE"],
        isActive: true,
        bookingCount: 67,
      },
    }),

    // سرویس‌های رضا اینک‌مستر
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[1].id,
        name: "پرتره رئالیسم",
        description: "تتو پرتره با تکنیک رئالیسم، مناسب برای چهره و حیوانات",
        basePrice: BigInt(8000000),
        maxPrice: BigInt(25000000),
        durationMinutes: 240,
        supportedSizes: ["MEDIUM", "LARGE", "EXTRA_LARGE"],
        isActive: true,
        bookingCount: 145,
      },
    }),
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[1].id,
        name: "نیم‌آستین رئالیست",
        description: "طراحی و اجرای نیم‌آستین با سبک رئالیسم",
        basePrice: BigInt(15000000),
        maxPrice: BigInt(35000000),
        durationMinutes: 360,
        supportedSizes: ["HALF_SLEEVE"],
        isActive: true,
        bookingCount: 42,
      },
    }),

    // سرویس‌های علی نیدلز
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[2].id,
        name: "ژئومتریک هندسی",
        description: "تتو ژئومتریک با طرح‌های هندسی دقیق و متقارن",
        basePrice: BigInt(1500000),
        maxPrice: BigInt(8000000),
        durationMinutes: 90,
        supportedSizes: ["SMALL", "MEDIUM", "LARGE"],
        isActive: true,
        bookingCount: 56,
      },
    }),

    // سرویس‌های مریم آرتس
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[3].id,
        name: "واتروکالر فلورال",
        description: "تتو واتروکالر با طرح‌های گل و طبیعت",
        basePrice: BigInt(1000000),
        maxPrice: BigInt(6000000),
        durationMinutes: 90,
        supportedSizes: ["SMALL", "MEDIUM", "LARGE"],
        isActive: true,
        bookingCount: 38,
      },
    }),

    // سرویس‌های امیر دارک‌لاینز
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[4].id,
        name: "بلک‌ورک سنگین",
        description: "تتو بلک‌ورک با پوشش کامل و جزئیات پیچیده",
        basePrice: BigInt(5000000),
        maxPrice: BigInt(18000000),
        durationMinutes: 180,
        supportedSizes: ["LARGE", "EXTRA_LARGE", "HALF_SLEEVE", "FULL_SLEEVE"],
        isActive: true,
        bookingCount: 98,
      },
    }),
    prisma.service.create({
      data: {
        artistProfileId: artistProfiles[4].id,
        name: "تریبل سنتی",
        description: "تتو تریبل با الهام از هنرهای بومی و سنتی",
        basePrice: BigInt(3000000),
        maxPrice: BigInt(12000000),
        durationMinutes: 150,
        supportedSizes: ["MEDIUM", "LARGE", "EXTRA_LARGE"],
        isActive: true,
        bookingCount: 73,
      },
    }),
  ]);
  console.log(`  ✅ ${services.length} سرویس ایجاد شد`);

  // ============================================================================
  // ۶. ساخت پورتفولیو
  // ============================================================================
  console.log("\n🖼️  در حال ساخت پورتفولیو...");

  const portfolioItems = await Promise.all([
    // پورتفولیو سارا اینک
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        title: "پروانه مینیمال",
        description: "طراحی پروانه با خطوط ظریف و ساده، مناسب مچ دست",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg",
        ],
        style: TattooStyle.MINIMAL,
        size: TattooSize.SMALL,
        durationMinutes: 45,
        price: BigInt(2500000),
        tags: ["پروانه", "مینیمال", "مچ دست", "خطی"],
        isCustom: false,
        likeCount: 234,
        saveCount: 89,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-08-15"),
      },
    }),
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        title: "گل رز بلک‌ورک",
        description: "گل رز با تکنیک بلک‌ورک و سایه‌زنی عمیق",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/car-interior-design.jpg",
        ],
        style: TattooStyle.BLACKWORK,
        size: TattooSize.MEDIUM,
        durationMinutes: 90,
        price: BigInt(4500000),
        tags: ["گل رز", "بلک‌ورک", "سایه‌زنی"],
        isCustom: false,
        likeCount: 187,
        saveCount: 65,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-09-01"),
      },
    }),
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        title: "هلال ماه دات‌ورک",
        description: "هلال ماه با تکنیک دات‌ورک و نقاط ریز",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg",
        ],
        style: TattooStyle.DOTWORK,
        size: TattooSize.SMALL,
        durationMinutes: 60,
        price: BigInt(3000000),
        tags: ["هلال", "دات‌ورک", "نقطه‌ای", "آسمان"],
        isCustom: false,
        likeCount: 312,
        saveCount: 124,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-09-10"),
      },
    }),

    // پورتفولیو رضا اینک‌مستر
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[1].id,
        title: "پرتره چهره زن",
        description: "پرتره واقع‌گرایانه از چهره یک زن جوان",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/people/indoor-tour.jpg",
        ],
        style: TattooStyle.REALISM,
        size: TattooSize.LARGE,
        durationMinutes: 240,
        price: BigInt(12000000),
        tags: ["پرتره", "رئالیسم", "چهره", "واقع‌گرایانه"],
        isCustom: true,
        likeCount: 567,
        saveCount: 234,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-07-20"),
      },
    }),
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[1].id,
        title: "شیر رئالیست",
        description: "تتو شیر با جزئیات بالا و رنگ‌آمیزی حرفه‌ای",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/people/kitchen-bar.jpg",
        ],
        style: TattooStyle.REALISM,
        size: TattooSize.EXTRA_LARGE,
        durationMinutes: 300,
        price: BigInt(18000000),
        tags: ["شیر", "حیوانات", "رئالیسم", "رنگی"],
        isCustom: true,
        likeCount: 892,
        saveCount: 345,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-08-05"),
      },
    }),

    // پورتفولیو علی نیدلز
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[2].id,
        title: "ماندالای ژئومتریک",
        description: "ماندالای هندسی با الگوهای دقیق و متقارن",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/people/jazz.jpg",
        ],
        style: TattooStyle.GEOMETRIC,
        size: TattooSize.LARGE,
        durationMinutes: 150,
        price: BigInt(6000000),
        tags: ["ماندالا", "ژئومتریک", "هندسی", "متقارن"],
        isCustom: false,
        likeCount: 445,
        saveCount: 198,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-08-20"),
      },
    }),

    // پورتفولیو مریم آرتس
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[3].id,
        title: "دسته گل واتروکالر",
        description: "دسته گل رنگارنگ با تکنیک واتروکالر",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spaghetti.jpg",
        ],
        style: TattooStyle.WATERCOLOR,
        size: TattooSize.MEDIUM,
        durationMinutes: 120,
        price: BigInt(4000000),
        tags: ["گل", "واتروکالر", "رنگی", "طبیعت"],
        isCustom: true,
        likeCount: 356,
        saveCount: 145,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-09-05"),
      },
    }),

    // پورتفولیو امیر دارک‌لاینز
    prisma.portfolioItem.create({
      data: {
        artistProfileId: artistProfiles[4].id,
        title: "آستین بلک‌ورک کامل",
        description: "آستین کامل بلک‌ورک با طرح‌های تریبل و سیمبلیک",
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/samples/people/bicycle.jpg",
        ],
        style: TattooStyle.BLACKWORK,
        size: TattooSize.FULL_SLEEVE,
        durationMinutes: 600,
        price: BigInt(30000000),
        tags: ["آستین", "بلک‌ورک", "تریبل", "سیمبلیک"],
        isCustom: true,
        likeCount: 1234,
        saveCount: 567,
        status: PortfolioStatus.PUBLISHED,
        publishedAt: new Date("2024-06-15"),
      },
    }),
  ]);
  console.log(`  ✅ ${portfolioItems.length} آیتم پورتفولیو ایجاد شد`);

  // ============================================================================
  // ۷. ساخت تتوهای فلش
  // ============================================================================
  console.log("\n⚡ در حال ساخت تتوهای فلش...");

  const flashTattoos = await Promise.all([
    prisma.flashTattoo.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        title: "گربه مینیمال",
        description: "طرح مینیمال گربه با خطوط ظریف",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg",
        style: TattooStyle.MINIMAL,
        suggestedSize: TattooSize.SMALL,
        price: BigInt(1500000),
        isAvailable: true,
        isExclusive: true,
        soldCount: 0,
        viewCount: 234,
        tags: ["گربه", "مینیمال", "حیوانات"],
        colors: ["سیاه"],
      },
    }),
    prisma.flashTattoo.create({
      data: {
        artistProfileId: artistProfiles[0].id,
        title: "گل گاوزبان",
        description: "طرح گل گاوزبان با جزئیات ظریف",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/car-interior-design.jpg",
        style: TattooStyle.LINE_ART,
        suggestedSize: TattooSize.MEDIUM,
        price: BigInt(2000000),
        isAvailable: true,
        isExclusive: false,
        soldCount: 3,
        viewCount: 456,
        tags: ["گل", "گاوزبان", "خطی", "طبیعت"],
        colors: ["سیاه"],
      },
    }),
    prisma.flashTattoo.create({
      data: {
        artistProfileId: artistProfiles[1].id,
        title: "عقاب رئالیست",
        description: "عقاب با جزئیات بالا و واقع‌گرایانه",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/indoor-tour.jpg",
        style: TattooStyle.REALISM,
        suggestedSize: TattooSize.LARGE,
        price: BigInt(8000000),
        isAvailable: true,
        isExclusive: true,
        soldCount: 0,
        viewCount: 891,
        tags: ["عقاب", "پرنده", "رئالیسم"],
        colors: ["قهوه‌ای", "طلایی", "سیاه"],
      },
    }),
    prisma.flashTattoo.create({
      data: {
        artistProfileId: artistProfiles[2].id,
        title: "مثلث مقدس",
        description: "مثلث هندسی با الگوی فیبوناچی",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/jazz.jpg",
        style: TattooStyle.GEOMETRIC,
        suggestedSize: TattooSize.SMALL,
        price: BigInt(1800000),
        isAvailable: true,
        isExclusive: false,
        soldCount: 7,
        viewCount: 567,
        tags: ["مثلث", "هندسی", "فیبوناچی"],
        colors: ["سیاه"],
      },
    }),
    prisma.flashTattoo.create({
      data: {
        artistProfileId: artistProfiles[3].id,
        title: "پروانه واتروکالر",
        description: "پروانه رنگارنگ با تکنیک واتروکالر",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/spaghetti.jpg",
        style: TattooStyle.WATERCOLOR,
        suggestedSize: TattooSize.MEDIUM,
        price: BigInt(3000000),
        isAvailable: true,
        isExclusive: false,
        soldCount: 5,
        viewCount: 723,
        tags: ["پروانه", "واتروکالر", "رنگی"],
        colors: ["صورتی", "بنفش", "آبی"],
      },
    }),
  ]);
  console.log(`  ✅ ${flashTattoos.length} تتوی فلش ایجاد شد`);

  // ============================================================================
  // ۸. ساخت رزروها
  // ============================================================================
  console.log("\n📅 در حال ساخت رزروها...");

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        clientId: clients[0].id,
        artistId: artists[0].id,
        serviceId: services[0].id,
        scheduledDate: new Date("2024-10-15"),
        startTime: "14:00",
        endTime: "15:00",
        title: "تتو مینیمال پروانه",
        description: "می‌خواهم یک پروانه مینیمال روی مچ دستم بزنم",
        size: TattooSize.SMALL,
        style: TattooStyle.MINIMAL,
        bodyPlacement: "مچ دست راست",
        agreedPrice: BigInt(2500000),
        estimatedDuration: 60,
        status: BookingStatus.COMPLETED,
        completedAt: new Date("2024-10-15"),
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        clientId: clients[1].id,
        artistId: artists[1].id,
        serviceId: services[2].id,
        scheduledDate: new Date("2024-10-20"),
        startTime: "10:00",
        endTime: "14:00",
        title: "پرتره چهره مادر",
        description: "می‌خواهم پرتره مادرم را به صورت رئالیست بزنم",
        referenceImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/people/indoor-tour.jpg",
        size: TattooSize.LARGE,
        style: TattooStyle.REALISM,
        bodyPlacement: "بازوی چپ",
        agreedPrice: BigInt(15000000),
        estimatedDuration: 240,
        status: BookingStatus.CONFIRMED,
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        clientId: clients[2].id,
        artistId: artists[3].id,
        serviceId: services[5].id,
        scheduledDate: new Date("2024-10-25"),
        startTime: "11:00",
        endTime: "13:00",
        title: "دسته گل واتروکالر",
        description: "یک دسته گل رنگارنگ با سبک واتروکالر",
        size: TattooSize.MEDIUM,
        style: TattooStyle.WATERCOLOR,
        bodyPlacement: "شانه راست",
        agreedPrice: BigInt(5000000),
        estimatedDuration: 120,
        status: BookingStatus.REQUESTED,
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        clientId: clients[3].id,
        artistId: artists[4].id,
        serviceId: services[6].id,
        scheduledDate: new Date("2024-09-10"),
        startTime: "09:00",
        endTime: "12:00",
        title: "نیم‌آستین بلک‌ورک",
        description: "طراحی و اجرای نیم‌آستین با طرح‌های تریبل",
        size: TattooSize.HALF_SLEEVE,
        style: TattooStyle.BLACKWORK,
        bodyPlacement: "بازوی راست",
        agreedPrice: BigInt(18000000),
        estimatedDuration: 180,
        status: BookingStatus.COMPLETED,
        completedAt: new Date("2024-09-10"),
      },
    }),
  ]);
  console.log(`  ✅ ${bookings.length} رزرو ایجاد شد`);

  // ============================================================================
  // ۹. ساخت پرداخت‌ها
  // ============================================================================
  console.log("\n💰 در حال ساخت پرداخت‌ها...");

  await prisma.payment.createMany({
    data: [
      {
        paymentNumber: "PAY-001",
        bookingId: bookings[0].id,
        amount: BigInt(2500000),
        platformFee: BigInt(375000),   // ۱۵٪ کارمزد
        artistNetAmount: BigInt(2125000),
        method: "ZARINPAL",
        status: PaymentStatus.PAID,
        gatewayTransactionId: "zarin-12345",
        gatewayRefId: "ref-12345",
        trackingCode: "12345678",
        paidAt: new Date("2024-10-14"),
      },
      {
        paymentNumber: "PAY-002",
        bookingId: bookings[3].id,
        amount: BigInt(18000000),
        platformFee: BigInt(2340000),  // ۱۳٪ کارمزد
        artistNetAmount: BigInt(15660000),
        method: "ZARINPAL",
        status: PaymentStatus.PAID,
        gatewayTransactionId: "zarin-67890",
        gatewayRefId: "ref-67890",
        trackingCode: "87654321",
        paidAt: new Date("2024-09-09"),
      },
    ],
  });
  console.log("  ✅ پرداخت‌ها ایجاد شد");

  // ============================================================================
  // ۱۰. ساخت نظرات
  // ============================================================================
  console.log("\n⭐ در حال ساخت نظرات...");

  await prisma.review.createMany({
    data: [
      {
        authorId: clients[0].id,
        recipientId: artists[0].id,
        bookingId: bookings[0].id,
        rating: 5,
        creativityRating: 5,
        professionalismRating: 5,
        cleanlinessRating: 5,
        communicationRating: 5,
        comment: "سارا واقعاً هنرمند فوق‌العاده‌ای هست! کارش تمیز و دقیق بود. محیط استودیو هم خیلی حرفه‌ای و بهداشتی بود. حتماً بازم میام.",
        isVerified: true,
      },
      {
        authorId: clients[3].id,
        recipientId: artists[4].id,
        bookingId: bookings[3].id,
        rating: 5,
        creativityRating: 5,
        professionalismRating: 4,
        cleanlinessRating: 5,
        communicationRating: 5,
        comment: "امیر حرفه‌ای‌ترین هنرمندیه که دیدم. بلک‌ورکش بی‌نقصه و خیلی صبورانه طرح رو اجرا کرد.",
        isVerified: true,
      },
      {
        authorId: clients[2].id,
        recipientId: artists[2].id,
        portfolioItemId: portfolioItems[5].id,
        rating: 4,
        comment: "ماندالای ژئومتریکش خیلی قشنگه. دقیت و نظم در کارش معلومه.",
        isVerified: true,
      },
    ],
  });
  console.log("  ✅ نظرات ایجاد شد");

  // ============================================================================
  // ۱۱. ساخت کیف پول و تراکنش‌ها
  // ============================================================================
  console.log("\n💳 در حال ساخت کیف پول‌ها...");

  const wallets = await Promise.all([
    prisma.wallet.create({
      data: {
        ownerId: artists[0].id,
        balance: BigInt(45000000),    // ۴۵ میلیون تومان
        withdrawableBalance: BigInt(30000000),
        pendingBalance: BigInt(15000000),
        totalDeposited: BigInt(50000000),
        bankName: "بانک ملت",
        accountHolderName: "سارا اینک",
      },
    }),
    prisma.wallet.create({
      data: {
        ownerId: artists[1].id,
        balance: BigInt(120000000),   // ۱۲۰ میلیون تومان
        withdrawableBalance: BigInt(80000000),
        pendingBalance: BigInt(40000000),
        totalDeposited: BigInt(150000000),
        bankName: "بانک صادرات",
        accountHolderName: "رضا کریمی",
      },
    }),
  ]);
  console.log(`  ✅ ${wallets.length} کیف پول ایجاد شد`);

  // ============================================================================
  // ۱۲. ساخت جلسات در دسترس
  // ============================================================================
  console.log("\n🕐 در حال ساخت جلسات در دسترس...");

  await prisma.availability.createMany({
    data: [
      // سارا اینک - شنبه تا چهارشنبه
      { artistProfileId: artistProfiles[0].id, dayOfWeek: "SATURDAY", startTime: "10:00", endTime: "18:00", isActive: true },
      { artistProfileId: artistProfiles[0].id, dayOfWeek: "SUNDAY", startTime: "10:00", endTime: "18:00", isActive: true },
      { artistProfileId: artistProfiles[0].id, dayOfWeek: "MONDAY", startTime: "10:00", endTime: "18:00", isActive: true },
      { artistProfileId: artistProfiles[0].id, dayOfWeek: "TUESDAY", startTime: "10:00", endTime: "18:00", isActive: true },
      { artistProfileId: artistProfiles[0].id, dayOfWeek: "WEDNESDAY", startTime: "10:00", endTime: "16:00", isActive: true },

      // رضا اینک‌مستر - شنبه تا پنجشنبه
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "19:00", isActive: true },
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "SUNDAY", startTime: "09:00", endTime: "19:00", isActive: true },
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "MONDAY", startTime: "09:00", endTime: "19:00", isActive: true },
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "19:00", isActive: true },
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "19:00", isActive: true },
      { artistProfileId: artistProfiles[1].id, dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "14:00", isActive: true },

      // علی نیدلز - شنبه تا چهارشنبه
      { artistProfileId: artistProfiles[2].id, dayOfWeek: "SATURDAY", startTime: "11:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[2].id, dayOfWeek: "SUNDAY", startTime: "11:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[2].id, dayOfWeek: "MONDAY", startTime: "11:00", endTime: "20:00", isActive: true },

      // امیر دارک‌لاینز - شنبه تا پنجشنبه
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "SATURDAY", startTime: "08:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "SUNDAY", startTime: "08:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "MONDAY", startTime: "08:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "TUESDAY", startTime: "08:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "20:00", isActive: true },
      { artistProfileId: artistProfiles[4].id, dayOfWeek: "THURSDAY", startTime: "08:00", endTime: "15:00", isActive: true },
    ],
  });
  console.log("  ✅ جلسات در دسترس ایجاد شد");

  // ============================================================================
  // ۱۳. ساخت درخواست‌های سفارشی
  // ============================================================================
  console.log("\n📝 در حال ساخت درخواست‌های سفارشی...");

  await prisma.customRequest.createMany({
    data: [
      {
        clientId: clients[0].id,
        artistId: artistProfiles[0].id,
        title: "تتو ستاره روی گردن",
        description: "می‌خواهم یک ستاره کوچک و مینیمال روی گردنم بزنم. طرح ساده و ظریف باشد.",
        referenceImages: [],
        preferredSize: TattooSize.SMALL,
        preferredStyle: TattooStyle.MINIMAL,
        bodyPlacement: "گردن - پشت گوش چپ",
        budget: BigInt(3000000),
        isFlexibleWithDate: true,
        quotedPrice: BigInt(2000000),
        quoteNotes: "ستاره ۵ پر مینیمال، قیمت مناسب‌تر از لیست قیمت",
        status: CustomRequestStatus.QUOTE_SENT,
      },
      {
        clientId: clients[1].id,
        artistId: artistProfiles[1].id,
        title: "پرتره حیوان خانگی",
        description: "می‌خواهم پرتره سگم را به صورت واقع‌گرایانه بزنم. عکس‌های خوبی از سگم دارم.",
        referenceImages: ["https://res.cloudinary.com/demo/image/upload/v1/samples/people/bicycle.jpg"],
        preferredSize: TattooSize.MEDIUM,
        preferredStyle: TattooStyle.REALISM,
        bodyPlacement: "ساعد راست",
        budget: BigInt(10000000),
        isFlexibleWithDate: false,
        preferredStartDate: new Date("2024-11-01"),
        quotedPrice: BigInt(12000000),
        quoteNotes: "پرتره واقعی با جزئیات بالا، نیاز به ۲ جلسه",
        status: CustomRequestStatus.ACCEPTED,
      },
    ],
  });
  console.log("  ✅ درخواست‌های سفارشی ایجاد شد");

  // ============================================================================
  // ۱۴. فالو کردن هنرمندان
  // ============================================================================
  console.log("\n❤️  در حال ثبت فالوورها...");

  await prisma.artistFollower.createMany({
    data: [
      { userId: clients[0].id, artistProfileId: artistProfiles[0].id },
      { userId: clients[0].id, artistProfileId: artistProfiles[1].id },
      { userId: clients[1].id, artistProfileId: artistProfiles[1].id },
      { userId: clients[1].id, artistProfileId: artistProfiles[4].id },
      { userId: clients[2].id, artistProfileId: artistProfiles[2].id },
      { userId: clients[2].id, artistProfileId: artistProfiles[3].id },
      { userId: clients[3].id, artistProfileId: artistProfiles[4].id },
      { userId: clients[4].id, artistProfileId: artistProfiles[0].id },
      { userId: clients[4].id, artistProfileId: artistProfiles[2].id },
    ],
  });
  console.log("  ✅ فالوورها ثبت شد");

  // ============================================================================
  // ۱۵. ذخیره علاقه‌مندی‌ها
  // ============================================================================
  console.log("\n📌 در حال ثبت علاقه‌مندی‌ها...");

  await prisma.savedPortfolio.createMany({
    data: [
      { userId: clients[0].id, portfolioItemId: portfolioItems[2].id }, // هلال ماه
      { userId: clients[1].id, portfolioItemId: portfolioItems[3].id }, // پرتره
      { userId: clients[2].id, portfolioItemId: portfolioItems[6].id }, // واتروکالر
      { userId: clients[3].id, portfolioItemId: portfolioItems[7].id }, // بلک‌ورک
      { userId: clients[4].id, portfolioItemId: portfolioItems[1].id }, // گل رز
    ],
  });
  console.log("  ✅ علاقه‌مندی‌ها ثبت شد");

  // ============================================================================
  // خلاصه
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ ذخیره داده‌های نمونه نوبت مارکت با موفقیت انجام شد!");
  console.log("=".repeat(60));
  console.log(`
📊 خلاصه:
  👤 کاربران:       ${1 + clients.length + artists.length} نفر
  🎨 پروفایل هنرمند: ${artistProfiles.length} پروفایل
  🏠 استودیوها:      ${studios.length} استودیو
  📋 سرویس‌ها:       ${services.length} سرویس
  🖼️  پورتفولیو:      ${portfolioItems.length} آیتم
  ⚡ تتو فلش:        ${flashTattoos.length} طرح
  📅 رزروها:         ${bookings.length} رزرو
  💳 کیف پول:        ${wallets.length} کیف پول

🔑 اطلاعات ورود (تمام کاربران):
  رمز عبور: password123

🔑 شماره موبایل نمونه:
  ادمین:       09991234567
  مشتری ۱:     09121111111 (نگار کیانی)
  مشتری ۲:     09122222222 (آرش محمدی)
  هنرمند ۱:    09131111111 (سارا اینک)
  هنرمند ۲:    09132222222 (رضا اینک‌مستر)
  `);
}

// ============================================================================
// اجرای seed
// ============================================================================

main()
  .catch((e) => {
    console.error("❌ خطا در اجرای seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
