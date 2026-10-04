/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// داده‌های نمایشی نوبت مارکت (Demo Dataset)
//
// این فایل همان داده‌های نمونهٔ واقعی پروژه (prisma/seed.ts) را به‌همراه
// رکوردهای تکمیلی برای همهٔ بخش‌های پنل (چت، اعلان، مالی، مجله، CMS و ...)
// بازتولید می‌کند تا کل پلتفرم بدون پایگاه داده قابل مشاهده و تست باشد.
// ============================================================================

import type { Tables } from "./engine";
import { demoPhoto } from "./images";

// ─── ابزارهای کمکی ───────────────────────────────────────────────────────────

// ─── تصاویر نمونه ────────────────────────────────────────────────────────────
// همهٔ تصاویر از دامنهٔ خودِ ورکر سرو می‌شوند (نسخهٔ WebP محلی)؛ مرورگر کاربر
// هیچ درخواستی به دامنه‌های بیرونی — که از ایران بدون فیلترشکن باز نمی‌شوند —
// نمی‌فرستد. قبلاً همین تصاویر از طریق پروکسی از pexels می‌آمدند که برای هر
// تصویر یک رفت‌وبرگشت به سرور بیرونی لازم داشت؛ حالا بار اول و بار صدم یکی است.
const PEXELS = (id: string, w: 400 | 800 = 800) => demoPhoto(id, w);

const AVATAR = (id: string) => demoPhoto(id, 400);

const SAMPLE = (name: string) => `/image/sample/${encodeURIComponent(name)}`;
// پسوند ورودی هرچه باشد (.jpg/.png)، فایل واقعی با فرمت بهینهٔ WebP سرو می‌شود
const CATEGORY = (name: string) =>
  `/image/categories/${encodeURIComponent(name.replace(/\.(jpe?g|png)$/i, ".webp"))}`;

const NOW = Date.now();
const DAY = 86_400_000;
/** تاریخ نسبی: n روز از امروز (تا «امروز/آینده/گذشته» همیشه درست بماند) */
const at = (offsetDays: number, hour = 10, minute = 0) => {
  const d = new Date(NOW + offsetDays * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const ago = (days: number, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000);

const SAMPLE_IMAGES = [
  "بلک‌ورک  طرح انتزاعیتزئینی (علی نیدلز).webp",
  "بلک‌ورک  گل سرخ (حسن بلک).webp",
  "دات‌ورک  قلب آناتومیک (لیلا لاین).webp",
  "دات‌ورک  ماه کامل (لیلا لاین).webp",
  "رئالیسم  ستاره دریایی (سارا اینک).webp",
  "رنگی  منشور هندسی رنگی (امیر دارک‌لاینز).webp",
  "سیاه و خاکستری  حلقه هندسی (مریم آرتس).webp",
  "فاین‌لاین  پروانه زیبا (امیر دارک‌لاینز).webp",
];

function sampleAt(i: number): string {
  return SAMPLE(SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]);
}

// ============================================================================
// کاربران
// ============================================================================

const AV = {
  admin: AVATAR("2379004"),
  negar: AVATAR("774909"),
  arash: AVATAR("220453"),
  sara: AVATAR("1239291"),
  mehdi: AVATAR("614810"),
  zahra: AVATAR("415829"),
  pouya: AVATAR("1043471"),
  elham: AVATAR("712513"),
  hossein: AVATAR("1222271"),
  nima: AVATAR("3785079"),
  saraInk: AVATAR("2379005"),
  reza: AVATAR("1516680"),
  ali: AVATAR("1681010"),
  maryam: AVATAR("1858175"),
  amir: AVATAR("1704488"),
  behnam: AVATAR("1438761"),
  negin: AVATAR("1805164"),
};

const users = [
  {
    id: "usr_admin",
    phone: "09991234567",
    email: "admin@nobat-market.com",
    passwordHash: "$2a$12$demo",
    displayName: "مدیر سیستم",
    firstName: "مدیر",
    lastName: "نوبت مارکت",
    avatarUrl: AV.admin,
    coverUrl: PEXELS("3184292", 800),
    role: "ADMIN",
    status: "ACTIVE",
    gender: "MALE",
    city: "تهران",
    province: "تهران",
    bio: "مدیر پلتفرم نوبت مارکت",
    preferredLanguage: "fa",
    totalBookings: 0,
    averageRating: 0,
    reviewCount: 0,
    lastSeenAt: ago(0, 1),
    createdAt: ago(420),
    updatedAt: ago(0, 1),
  },
  ...[
    ["usr_client_1", "09121111111", "negar.k@gmail.com", "نگار کیانی", "نگار", "کیانی", AV.negar, "FEMALE", "تهران", "تهران", 6],
    ["usr_client_2", "09122222222", "arash.m@gmail.com", "آرش محمدی", "آرش", "محمدی", AV.arash, "MALE", "اصفهان", "اصفهان", 4],
    ["usr_client_3", "09123333333", "sara.h@gmail.com", "سارا حسینی", "سارا", "حسینی", AV.sara, "FEMALE", "شیراز", "فارس", 3],
    ["usr_client_4", "09124444444", "mehdi.a@gmail.com", "مهدی احمدی", "مهدی", "احمدی", AV.mehdi, "MALE", "تبریز", "آذربایجان شرقی", 5],
    ["usr_client_5", "09125555555", "zahra.r@gmail.com", "زهرا رضایی", "زهرا", "رضایی", AV.zahra, "FEMALE", "تهران", "تهران", 2],
    ["usr_client_6", "09126666666", "pouya.k@gmail.com", "پویا کریمی", "پویا", "کریمی", AV.pouya, "MALE", "مشهد", "خراسان رضوی", 4],
    ["usr_client_7", "09127777777", "elham.n@gmail.com", "الهام نوری", "الهام", "نوری", AV.elham, "FEMALE", "کرج", "البرز", 1],
    ["usr_client_8", "09128888888", "hossein.m@gmail.com", "حسین مرادی", "حسین", "مرادی", AV.hossein, "MALE", "قم", "قم", 2],
  ].map(([id, phone, email, displayName, firstName, lastName, avatarUrl, gender, city, province, bookings]) => ({
    id: id as string,
    phone: phone as string,
    email: email as string,
    passwordHash: "$2a$12$demo",
    displayName: displayName as string,
    firstName: firstName as string,
    lastName: lastName as string,
    avatarUrl: avatarUrl as string,
    coverUrl: PEXELS("3184418", 800),
    role: "CLIENT",
    status: "ACTIVE",
    gender: gender as string,
    city: city as string,
    province: province as string,
    bio: null,
    preferredLanguage: "fa",
    totalBookings: bookings as number,
    averageRating: 0,
    reviewCount: 0,
    lastSeenAt: ago(1, 3),
    createdAt: ago(300),
    updatedAt: ago(2),
  })),
  {
    id: "usr_client_9",
    phone: "09129999999",
    email: "nima.t@gmail.com",
    passwordHash: "$2a$12$demo",
    displayName: "نیما تهرانی",
    firstName: "نیما",
    lastName: "تهرانی",
    avatarUrl: AV.nima,
    role: "CLIENT",
    status: "SUSPENDED",
    gender: "MALE",
    city: "رشت",
    province: "گیلان",
    bio: null,
    preferredLanguage: "fa",
    totalBookings: 1,
    averageRating: 0,
    reviewCount: 0,
    lastSeenAt: ago(30),
    createdAt: ago(120),
    updatedAt: ago(20),
  },
  ...[
    ["usr_artist_1", "09131111111", "sara.ink@gmail.com", "سارا اینک", "سارا", "اینک", AV.saraInk, "FEMALE", "تهران", "تهران", "ACTIVE"],
    ["usr_artist_2", "09132222222", "reza.inkmaster@gmail.com", "رضا اینک‌مستر", "رضا", "کریمی", AV.reza, "MALE", "تهران", "تهران", "ACTIVE"],
    ["usr_artist_3", "09133333333", "ali.needles@gmail.com", "علی نیدلز", "علی", "نصیری", AV.ali, "MALE", "اصفهان", "اصفهان", "ACTIVE"],
    ["usr_artist_4", "09134444444", "maryam.arts@gmail.com", "مریم آرتس", "مریم", "صالحی", AV.maryam, "FEMALE", "شیراز", "فارس", "ACTIVE"],
    ["usr_artist_5", "09135555555", "amir.darklines@gmail.com", "امیر دارک‌لاینز", "امیر", "رضوانی", AV.amir, "MALE", "تبریز", "آذربایجان شرقی", "ACTIVE"],
    ["usr_artist_6", "09136666666", "behnam.style@gmail.com", "بهنام استایل", "بهنام", "اکبری", AV.behnam, "MALE", "کرج", "البرز", "PENDING_VERIFICATION"],
    ["usr_artist_7", "09137777777", "negin.lines@gmail.com", "نگین لاینز", "نگین", "شریفی", AV.negin, "FEMALE", "مشهد", "خراسان رضوی", "PENDING_VERIFICATION"],
  ].map(([id, phone, email, displayName, firstName, lastName, avatarUrl, gender, city, province, status]) => ({
    id: id as string,
    phone: phone as string,
    email: email as string,
    passwordHash: "$2a$12$demo",
    displayName: displayName as string,
    firstName: firstName as string,
    lastName: lastName as string,
    avatarUrl: avatarUrl as string,
    coverUrl: PEXELS("1674040", 800),
    role: "ARTIST",
    status: status as string,
    gender: gender as string,
    city: city as string,
    province: province as string,
    bio: null,
    preferredLanguage: "fa",
    totalBookings: 40,
    averageRating: 4.8,
    reviewCount: 12,
    lastSeenAt: ago(0, 4),
    createdAt: ago(360),
    updatedAt: ago(0, 4),
  })),
];

// ============================================================================
// پروفایل هنرمندان
// ============================================================================

const artistSeed = [
  {
    id: "ap_1",
    userId: "usr_artist_1",
    artistName: "سارا اینک",
    slug: "sara-ink",
    shortBio: "متخصص تتوهای مینیمال و بلک‌ورک",
    fullBio:
      "من سارا هستم، هنرمند تتو با بیش از ۷ سال تجربه در سبک‌های مینیمال و بلک‌ورک. علاقه‌ام به هنر از دوران کودکی شروع شد و امروز توانسته‌ام با ترکیب هنر سنتی ایرانی و تکنیک‌های مدرن، آثار منحصربفردی خلق کنم. هر تتو برایم داستانی دارد.",
    experienceYears: 7,
    specializations: ["MINIMAL", "BLACKWORK", "LINE_ART", "DOTWORK"],
    isVerified: true,
    minPrice: 2000000n,
    maxPrice: 15000000n,
    averageSessionDuration: 120,
    completedBookings: 156,
    totalEarnings: 250000000n,
    followerCount: 12400,
    platformFeePercent: 15,
    satisfactionScore: 94.5,
    city: "تهران",
    instagramUrl: "https://instagram.com/sara.ink",
    telegramUrl: "https://t.me/sara_ink",
  },
  {
    id: "ap_2",
    userId: "usr_artist_2",
    artistName: "رضا اینک‌مستر",
    slug: "reza-inkmaster",
    shortBio: "استاد رئالیسم و پرتره‌های هنری",
    fullBio:
      "رضا کریمی هستم، معروف به اینک‌مستر. با ۱۲ سال تجربه حرفه‌ای در سبک رئالیسم و پرتره، یکی از شناخته‌شده‌ترین هنرمندان تتو در تهران هستم. تخصص من در تتوهای پرتره، حیوانات و مناظر طبیعی است.",
    experienceYears: 12,
    specializations: ["REALISM", "BLACK_AND_GREY", "COLOR", "OLD_SCHOOL"],
    isVerified: true,
    minPrice: 5000000n,
    maxPrice: 25000000n,
    averageSessionDuration: 180,
    completedBookings: 312,
    totalEarnings: 680000000n,
    followerCount: 28500,
    platformFeePercent: 12,
    satisfactionScore: 97.2,
    city: "تهران",
    instagramUrl: "https://instagram.com/reza.inkmaster",
    telegramUrl: "https://t.me/reza_inkmaster",
  },
  {
    id: "ap_3",
    userId: "usr_artist_3",
    artistName: "علی نیدلز",
    slug: "ali-needles",
    shortBio: "هنرمند ژئومتریک و آبستره مدرن",
    fullBio:
      "علی نصیری هستم، هنرمند تتو از اصفهان. تخصص من در سبک‌های ژئومتریک، آبستره و سیمبلیک است. با الهام از معماری اصفهان و هنرهای اسلامی، طرح‌هایی منحصربفرد خلق می‌کنم.",
    experienceYears: 5,
    specializations: ["GEOMETRIC", "ABSTRACT", "DOTWORK", "MINIMAL"],
    isVerified: true,
    minPrice: 1500000n,
    maxPrice: 10000000n,
    averageSessionDuration: 150,
    completedBookings: 89,
    totalEarnings: 120000000n,
    followerCount: 7800,
    platformFeePercent: 15,
    satisfactionScore: 91.8,
    city: "اصفهان",
    instagramUrl: "https://instagram.com/ali.needles",
    telegramUrl: null,
  },
  {
    id: "ap_4",
    userId: "usr_artist_4",
    artistName: "مریم آرتس",
    slug: "maryam-arts",
    shortBio: "خالق تتوهای واتروکالر و فلورال",
    fullBio:
      "مریم صالحی هستم، هنرمند تتو از شیراز. علاقه‌ام به رنگ‌ها و طبیعت باعث شد تا در سبک واتروکالر و فلورال تخصص پیدا کنم. هر تتو من مثل یک تابلوی نقاشی است که با جوهر و سوزن خلق می‌شود.",
    experienceYears: 4,
    specializations: ["WATERCOLOR", "MINIMAL", "LINE_ART", "COLOR"],
    isVerified: false,
    minPrice: 1000000n,
    maxPrice: 8000000n,
    averageSessionDuration: 120,
    completedBookings: 54,
    totalEarnings: 65000000n,
    followerCount: 4200,
    platformFeePercent: 15,
    satisfactionScore: 93.1,
    city: "شیراز",
    instagramUrl: "https://instagram.com/maryam.arts",
    telegramUrl: "https://t.me/maryam_arts",
  },
  {
    id: "ap_5",
    userId: "usr_artist_5",
    artistName: "امیر دارک‌لاینز",
    slug: "amir-darklines",
    shortBio: "استاد بلک‌ورک و تریبل",
    fullBio:
      "امیر رضوانی هستم، معروف به دارک‌لاینز. با ۸ سال تجربه در سبک‌های بلک‌ورک، تریبل و دات‌ورک، آثار قدرتمند و چشمگیری خلق می‌کنم. الهام‌بخش من فرهنگ‌های بومی و هنرهای آفریقایی و مائوری است.",
    experienceYears: 8,
    specializations: ["BLACKWORK", "TRIBAL", "DOTWORK", "GEOMETRIC"],
    isVerified: true,
    minPrice: 3000000n,
    maxPrice: 18000000n,
    averageSessionDuration: 160,
    completedBookings: 201,
    totalEarnings: 420000000n,
    followerCount: 15600,
    platformFeePercent: 13,
    satisfactionScore: 95.7,
    city: "تبریز",
    instagramUrl: "https://instagram.com/amir.darklines",
    telegramUrl: "https://t.me/amir_darklines",
  },
  {
    id: "ap_6",
    userId: "usr_artist_6",
    artistName: "بهنام استایل",
    slug: "behnam-style",
    shortBio: "سبک نئو ترادیشنال و ژاپنی",
    fullBio:
      "بهنام اکبری هستم از کرج. روی سبک‌های نئو ترادیشنال و ژاپنی کار می‌کنم و در انتظار تأیید پروفایل توسط تیم نوبت مارکت هستم.",
    experienceYears: 3,
    specializations: ["NEO_TRADITIONAL", "JAPANESE"],
    isVerified: false,
    minPrice: 1200000n,
    maxPrice: 9000000n,
    averageSessionDuration: 120,
    completedBookings: 0,
    totalEarnings: 0n,
    followerCount: 320,
    platformFeePercent: 15,
    satisfactionScore: 0,
    city: "کرج",
    instagramUrl: null,
    telegramUrl: null,
  },
  {
    id: "ap_7",
    userId: "usr_artist_7",
    artistName: "نگین لاینز",
    slug: "negin-lines",
    shortBio: "فاین‌لاین و مینیمال ظریف",
    fullBio:
      "نگین شریفی هستم از مشهد. تخصصم فاین‌لاین و طرح‌های مینیمال ظریف است. پروفایلم در انتظار تأیید است.",
    experienceYears: 2,
    specializations: ["LINE_ART", "MINIMAL"],
    isVerified: false,
    minPrice: 800000n,
    maxPrice: 6000000n,
    averageSessionDuration: 90,
    completedBookings: 0,
    totalEarnings: 0n,
    followerCount: 145,
    platformFeePercent: 15,
    satisfactionScore: 0,
    city: "مشهد",
    instagramUrl: null,
    telegramUrl: null,
  },
];

const artistProfiles = artistSeed.map((a, i) => ({
  ...a,
  isAcceptingBookings: true,
  acceptsCustomRequests: true,
  plan: "FREE",
  maxPortfolioItems: 20,
  maxFlashItems: 10,
  websiteUrl: null,
  planExpiresAt: null,
  createdAt: ago(340 - i * 10),
  updatedAt: ago(1 + i),
}));

// ============================================================================
// استودیوها
// ============================================================================

const studios = [
  {
    id: "std_1",
    name: "استودیو اینک‌هاوس",
    slug: "inkhouse-studio",
    description: "لوکس‌ترین استودیوی تتو در تهران",
    fullDescription:
      "اینک‌هاوس یکی از لوکس‌ترین و حرفه‌ای‌ترین استودیوهای تتو در تهران است. با تیمی از بهترین هنرمندان و تجهیزات پیشرفته، محیطی امن، بهداشتی و حرفه‌ای برای خلق بهترین تتوها فراهم کرده‌ایم.",
    address: "خیابان ولیعصر، نبش کوچه گل، پلاک ۱۲",
    city: "تهران",
    province: "تهران",
    phone: "02112345678",
    email: "info@inkhouse-studio.com",
    latitude: 35.7219,
    longitude: 51.3825,
    coverImage: CATEGORY("REALISM.jpg"),
    images: [CATEGORY("BLACKWORK.jpg"), CATEGORY("COLOR.jpg"), CATEGORY("MINIMAL.jpg")],
    isActive: true,
    isVerified: true,
    averageRating: 4.8,
    reviewCount: 245,
    artistCount: 3,
    instagramUrl: "https://instagram.com/inkhouse.tehran",
    telegramUrl: null,
    websiteUrl: null,
    createdAt: ago(400),
    updatedAt: ago(5),
  },
  {
    id: "std_2",
    name: "استودیو هنر سیاه",
    slug: "black-art-studio",
    description: "استودیوی تخصصی بلک‌ورک و دات‌ورک",
    fullDescription:
      "استودیو هنر سیاه با تمرکز بر سبک‌های بلک‌ورک و دات‌ورک، فضایی مینیمال و حرفه‌ای برای علاقه‌مندان به این سبک‌ها فراهم کرده است.",
    address: "خیابان کریم‌خان زند، پلاک ۱۲۳",
    city: "تهران",
    province: "تهران",
    phone: "02187654321",
    email: "info@blackart-studio.com",
    latitude: 35.6892,
    longitude: 51.389,
    coverImage: CATEGORY("BLACKWORK.jpg"),
    images: [CATEGORY("DOTWORK.jpg"), CATEGORY("TRIBAL.jpg")],
    isActive: true,
    isVerified: true,
    averageRating: 4.6,
    reviewCount: 178,
    artistCount: 2,
    instagramUrl: "https://instagram.com/blackart.tehran",
    telegramUrl: null,
    websiteUrl: null,
    createdAt: ago(380),
    updatedAt: ago(9),
  },
  {
    id: "std_3",
    name: "آتلیه نیدلز اصفهان",
    slug: "needles-isfahan",
    description: "استودیوی خلاق با الهام از هنر اصفهان",
    fullDescription:
      "آتلیه نیدلز با الهام از معماری و هنرهای اصفهان، طرح‌های منحصربفردی خلق می‌کند. فضای آرام و هنری استودیو، تجربه‌ای لذت‌بخش از تتو را برای مشتریان فراهم می‌کند.",
    address: "خیابان چهارباغ عباسی، روبروی هتل عباسی",
    city: "اصفهان",
    province: "اصفهان",
    phone: "03112345678",
    email: "info@needles-isfahan.com",
    latitude: 32.6546,
    longitude: 51.668,
    coverImage: CATEGORY("GEOMETRIC.jpg"),
    images: [CATEGORY("LINE ART.jpg")],
    isActive: true,
    isVerified: true,
    averageRating: 4.9,
    reviewCount: 120,
    artistCount: 1,
    instagramUrl: null,
    telegramUrl: null,
    websiteUrl: null,
    createdAt: ago(300),
    updatedAt: ago(12),
  },
];

const studioArtists = [
  { id: "sa_1", artistProfileId: "ap_1", studioId: "std_1", isActive: true, studioSharePercent: 30, startDate: ago(300), endDate: null, createdAt: ago(300) },
  { id: "sa_2", artistProfileId: "ap_2", studioId: "std_1", isActive: true, studioSharePercent: 25, startDate: ago(320), endDate: null, createdAt: ago(320) },
  { id: "sa_3", artistProfileId: "ap_3", studioId: "std_3", isActive: true, studioSharePercent: 20, startDate: ago(250), endDate: null, createdAt: ago(250) },
  { id: "sa_4", artistProfileId: "ap_5", studioId: "std_2", isActive: true, studioSharePercent: 28, startDate: ago(280), endDate: null, createdAt: ago(280) },
  { id: "sa_5", artistProfileId: "ap_4", studioId: "std_1", isActive: false, studioSharePercent: 30, startDate: ago(200), endDate: ago(30), createdAt: ago(200) },
];

// ============================================================================
// سرویس‌ها
// ============================================================================

const serviceSeed = [
  ["sv_1", "ap_1", "تتو مینیمال کوچک", "تتو مینیمال با خطوط ظریف، مناسب برای طرح‌های ساده و شیک", 2000000n, 5000000n, 60, ["SMALL", "MEDIUM"], 89],
  ["sv_2", "ap_1", "بلک‌ورک متوسط", "تتو بلک‌ورک با جزئیات بالا و سایه‌زنی حرفه‌ای", 4000000n, 10000000n, 120, ["MEDIUM", "LARGE"], 67],
  ["sv_3", "ap_1", "فاین‌لاین ظریف", "طرح‌های خطی بسیار ظریف با جزئیات دقیق", 1800000n, 4500000n, 90, ["SMALL", "MEDIUM"], 54],
  ["sv_4", "ap_2", "پرتره رئالیسم", "تتو پرتره با تکنیک رئالیسم، مناسب برای چهره و حیوانات", 8000000n, 25000000n, 240, ["MEDIUM", "LARGE", "EXTRA_LARGE"], 145],
  ["sv_5", "ap_2", "نیم‌آستین رئالیست", "طراحی و اجرای نیم‌آستین با سبک رئالیسم", 15000000n, 35000000n, 360, ["HALF_SLEEVE"], 42],
  ["sv_6", "ap_2", "تتو کوچک رئالیسم", "تتو رئالیست کوچک برای طرح‌های ساده", 3000000n, 8000000n, 90, ["SMALL", "MEDIUM"], 78],
  ["sv_7", "ap_3", "ژئومتریک هندسی", "تتو ژئومتریک با طرح‌های هندسی دقیق و متقارن", 1500000n, 8000000n, 90, ["SMALL", "MEDIUM", "LARGE"], 56],
  ["sv_8", "ap_3", "ماندالا و دات‌ورک", "طرح ماندالا با تکنیک نقطه‌گذاری دقیق", 2500000n, 9000000n, 150, ["MEDIUM", "LARGE"], 34],
  ["sv_9", "ap_4", "واتروکالر فلورال", "تتو واتروکالر با طرح‌های گل و طبیعت", 1000000n, 6000000n, 90, ["SMALL", "MEDIUM", "LARGE"], 38],
  ["sv_10", "ap_4", "مینیمال گل و برگ", "طرح‌های مینیمال از گل و برگ با خطوط ساده", 900000n, 3500000n, 60, ["SMALL"], 26],
  ["sv_11", "ap_5", "بلک‌ورک سنگین", "تتو بلک‌ورک با پوشش کامل و جزئیات پیچیده", 5000000n, 18000000n, 180, ["LARGE", "EXTRA_LARGE", "HALF_SLEEVE", "FULL_SLEEVE"], 98],
  ["sv_12", "ap_5", "تریبل سنتی", "تتو تریبل با الهام از هنرهای بومی و سنتی", 3000000n, 12000000n, 150, ["MEDIUM", "LARGE", "EXTRA_LARGE"], 73],
];

const services = serviceSeed.map(
  ([id, artistProfileId, name, description, basePrice, maxPrice, durationMinutes, supportedSizes, bookingCount], i) => ({
    id,
    artistProfileId,
    name,
    description,
    basePrice,
    maxPrice,
    durationMinutes,
    supportedSizes,
    isActive: true,
    bookingCount,
    cancellationNoticeHours: 24,
    depositType: "PERCENTAGE",
    depositValue: 30n,
    createdAt: ago(200 - i * 3),
    updatedAt: ago(4 + i),
  })
);

// ============================================================================
// پورتفولیو
// ============================================================================

const portfolioSeed = [
  ["pf_1", "ap_1", "پروانه مینیمال", "طراحی پروانه با خطوط ظریف و ساده، مناسب مچ دست", "MINIMAL", "SMALL", 45, 2500000n, ["پروانه", "مینیمال", "مچ دست", "خطی"], 234, 89, "PUBLISHED"],
  ["pf_2", "ap_1", "گل رز بلک‌ورک", "گل رز با تکنیک بلک‌ورک و سایه‌زنی عمیق", "BLACKWORK", "MEDIUM", 90, 4500000n, ["گل رز", "بلک‌ورک", "سایه‌زنی"], 187, 65, "PUBLISHED"],
  ["pf_3", "ap_1", "هلال ماه دات‌ورک", "هلال ماه با تکنیک دات‌ورک و نقاط ریز", "DOTWORK", "SMALL", 60, 3000000n, ["هلال", "دات‌ورک", "نقطه‌ای"], 312, 124, "PUBLISHED"],
  ["pf_4", "ap_2", "پرتره چهره زن", "پرتره واقع‌گرایانه از چهره یک زن جوان", "REALISM", "LARGE", 240, 12000000n, ["پرتره", "رئالیسم", "چهره"], 567, 234, "PUBLISHED"],
  ["pf_5", "ap_2", "شیر رئالیست", "تتو شیر با جزئیات بالا و رنگ‌آمیزی حرفه‌ای", "REALISM", "EXTRA_LARGE", 300, 18000000n, ["شیر", "حیوانات", "رئالیسم"], 892, 345, "PUBLISHED"],
  ["pf_6", "ap_3", "ماندالای ژئومتریک", "ماندالای هندسی با الگوهای دقیق و متقارن", "GEOMETRIC", "LARGE", 150, 6000000n, ["ماندالا", "ژئومتریک", "متقارن"], 445, 198, "PUBLISHED"],
  ["pf_7", "ap_4", "دسته گل واتروکالر", "دسته گل رنگارنگ با تکنیک واتروکالر", "WATERCOLOR", "MEDIUM", 120, 4000000n, ["گل", "واتروکالر", "رنگی"], 356, 145, "PUBLISHED"],
  ["pf_8", "ap_5", "آستین بلک‌ورک کامل", "آستین کامل بلک‌ورک با طرح‌های تریبل و سیمبلیک", "BLACKWORK", "FULL_SLEEVE", 600, 30000000n, ["آستین", "بلک‌ورک", "تریبل"], 1234, 567, "PUBLISHED"],
  ["pf_9", "ap_2", "چشم رئالیست", "تتو چشم با جزئیات خیره‌کننده", "REALISM", "MEDIUM", 120, 7000000n, ["چشم", "رئالیسم"], 623, 210, "PUBLISHED"],
  ["pf_10", "ap_3", "حلقه هندسی", "طرح حلقه‌های متقاطع هندسی", "GEOMETRIC", "MEDIUM", 100, 4200000n, ["هندسی", "حلقه"], 288, 96, "PUBLISHED"],
  ["pf_11", "ap_5", "قلب آناتومیک", "قلب آناتومیک با تکنیک دات‌ورک", "DOTWORK", "MEDIUM", 140, 5200000n, ["قلب", "دات‌ورک"], 512, 188, "PUBLISHED"],
  ["pf_12", "ap_4", "پروانه فاین‌لاین", "پروانه زیبا با خطوط بسیار ظریف", "LINE_ART", "SMALL", 50, 1600000n, ["پروانه", "فاین‌لاین"], 402, 173, "PUBLISHED"],
  ["pf_13", "ap_2", "پرتره سگ خانگی", "پرتره واقع‌گرایانه از حیوان خانگی", "REALISM", "MEDIUM", 180, 9000000n, ["حیوانات", "پرتره"], 341, 129, "DRAFT"],
  ["pf_14", "ap_5", "طرح انتزاعی تزئینی", "طرح انتزاعی با خطوط تزئینی", "BLACKWORK", "LARGE", 200, 11500000n, ["انتزاعی", "تزئینی"], 176, 58, "DRAFT"],
  ["pf_15", "ap_1", "ستاره دریایی", "ستاره دریایی رئالیست کوچک", "REALISM", "SMALL", 70, 3200000n, ["دریا", "رئالیسم"], 219, 77, "PUBLISHED"],
  ["pf_16", "ap_3", "منشور هندسی رنگی", "منشور رنگی با طرح‌های هندسی", "COLOR", "LARGE", 180, 8500000n, ["رنگی", "هندسی", "منشور"], 397, 141, "PUBLISHED"],
  // آثار اضافی برای پوشش همهٔ سبک‌ها
  ["pf_17", "ap_1", "عقاب سیاه", "عقاب بلک‌ورک با جزئیات بالا", "BLACK_AND_GREY", "MEDIUM", 150, 6500000n, ["عقاب", "سیاه و خاکستری"], 445, 190, "PUBLISHED"],
  ["pf_18", "ap_2", "گل رز خاکستری", "گل رز با سایه‌زنی خاکستری", "BLACK_AND_GREY", "SMALL", 60, 3200000n, ["گل رز", "خاکستری"], 312, 120, "PUBLISHED"],
  ["pf_19", "ap_3", "پروانه ظریف", "پروانه با خطوط فاین‌لاین بسیار ظریف", "FINE_LINE", "SMALL", 45, 2800000n, ["پروانه", "فاین‌لاین"], 567, 234, "PUBLISHED"],
  ["pf_20", "ap_4", "گل گاوزبان", "گل گاوزبان با تکنیک واتروکالر", "WATERCOLOR", "MEDIUM", 90, 4200000n, ["گل", "واتروکالر"], 234, 98, "PUBLISHED"],
  ["pf_21", "ap_5", "اسکلت", "اسکلت با تکنیک بلک‌ورک", "OLD_SCHOOL", "LARGE", 180, 9500000n, ["اسکلت", "کلاسیک"], 345, 145, "PUBLISHED"],
  ["pf_22", "ap_1", "گل رز نئو", "گل رز با سبک نئو ترادیشنال", "NEO_TRADITIONAL", "MEDIUM", 120, 5800000n, ["گل رز", "نئو"], 456, 189, "PUBLISHED"],
  ["pf_23", "ap_2", "اژدها ژاپنی", "اژدها با سبک ژاپنی سنتی", "JAPANESE", "LARGE", 240, 15000000n, ["اژدها", "ژاپنی"], 678, 290, "PUBLISHED"],
  ["pf_24", "ap_3", "تریبل سنتی", "طرح تریبل با الهام از هنرهای بومی", "TRIBAL", "LARGE", 150, 7500000n, ["تریبل", "بومی"], 389, 167, "PUBLISHED"],
  ["pf_25", "ap_4", "انتزاعی رنگی", "طرح انتزاعی با رنگ‌های زنده", "ABSTRACT", "MEDIUM", 100, 4800000n, ["انتزاعی", "رنگی"], 267, 112, "PUBLISHED"],
];

const portfolioItems = portfolioSeed.map(
  ([id, artistProfileId, title, description, style, size, durationMinutes, price, tags, likeCount, saveCount, status], i) => ({
    id,
    artistProfileId,
    title,
    description,
    images: [sampleAt(i), i % 3 === 0 ? sampleAt(i + 3) : null].filter(Boolean),
    videoUrl: null,
    style,
    size,
    durationMinutes,
    price,
    tags,
    isCustom: i % 3 === 1,
    likeCount,
    saveCount,
    status,
    sortOrder: i,
    publishedAt: status === "PUBLISHED" ? ago(90 - i * 4) : null,
    createdAt: ago(95 - i * 4),
    updatedAt: ago(10 + i),
  })
);

// ============================================================================
// تتوهای فلش
// ============================================================================

const flashSeed = [
  ["fl_1", "ap_1", "گربه مینیمال", "طرح مینیمال گربه با خطوط ظریف", "MINIMAL", "SMALL", 1500000n, true, 0, 234, ["گربه", "مینیمال", "حیوانات"], ["سیاه"], "APPROVED"],
  ["fl_2", "ap_1", "گل گاوزبان", "طرح گل گاوزبان با جزئیات ظریف", "LINE_ART", "MEDIUM", 2000000n, false, 3, 456, ["گل", "گاوزبان", "خطی"], ["سیاه"], "APPROVED"],
  ["fl_3", "ap_2", "عقاب رئالیست", "عقاب با جزئیات بالا و واقع‌گرایانه", "REALISM", "LARGE", 8000000n, true, 0, 891, ["عقاب", "پرنده", "رئالیسم"], ["قهوه‌ای", "طلایی", "سیاه"], "APPROVED"],
  ["fl_4", "ap_3", "مثلث مقدس", "مثلث هندسی با الگوی فیبوناچی", "GEOMETRIC", "SMALL", 1800000n, true, 7, 567, ["مثلث", "هندسی", "فیبوناچی"], ["سیاه"], "APPROVED"],
  ["fl_5", "ap_4", "پروانه واتروکالر", "پروانه رنگارنگ با تکنیک واتروکالر", "WATERCOLOR", "MEDIUM", 3000000n, true, 5, 723, ["پروانه", "واتروکالر", "رنگی"], ["صورتی", "بنفش", "آبی"], "APPROVED"],
  ["fl_6", "ap_5", "ماه کامل دات‌ورک", "ماه کامل با تکنیک نقطه‌گذاری", "DOTWORK", "MEDIUM", 4200000n, true, 2, 612, ["ماه", "دات‌ورک"], ["سیاه"], "APPROVED"],
  ["fl_7", "ap_2", "قلب آناتومیک فلش", "طرح آمادهٔ قلب آناتومیک", "REALISM", "MEDIUM", 6500000n, true, 1, 388, ["قلب", "رئالیسم"], ["قرمز", "سیاه"], "APPROVED"],
  ["fl_8", "ap_3", "مارپیچ هندسی", "مارپیچ طلایی با تناسبات هندسی", "GEOMETRIC", "SMALL", 2200000n, true, 4, 254, ["مارپیچ", "طلایی"], ["سیاه"], "APPROVED"],
  ["fl_9", "ap_5", "طرح اختصاصی اژدها", "اژدهای بلک‌ورک اختصاصی — فقط یک بار فروخته می‌شود", "BLACKWORK", "LARGE", 14500000n, true, 0, 1204, ["اژدها", "بلک‌ورک", "اختصاصی"], ["سیاه"], "PENDING"],
  ["fl_10", "ap_1", "ستاره دریایی فلش", "ستاره دریایی مینیمال", "MINIMAL", "SMALL", 1200000n, true, 0, 96, ["دریا", "مینیمال"], ["آبی"], "PENDING"],
];

const flashTattoos = flashSeed.map(
  ([id, artistProfileId, title, description, style, suggestedSize, price, isAvailable, soldCount, viewCount, tags, colors, status], i) => ({
    id,
    artistProfileId,
    title,
    description,
    imageUrl: sampleAt(i + 2),
    alternativeImageUrl: null,
    style,
    suggestedSize,
    price,
    isAvailable,
    status,
    approvedAt: status === "APPROVED" ? ago(60 - i * 3) : null,
    isExclusive: i % 4 === 0,
    soldCount,
    viewCount,
    tags,
    colors,
    createdAt: ago(70 - i * 3),
    updatedAt: ago(3 + i),
  })
);

// ============================================================================
// در دسترس بودن و مرخصی
// ============================================================================

const weekdays = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];
const availability: any[] = [];
let avIdx = 0;
for (const ap of ["ap_1", "ap_2", "ap_3", "ap_4", "ap_5"]) {
  for (const day of weekdays) {
    avIdx += 1;
    availability.push({
      id: `avl_${avIdx}`,
      artistProfileId: ap,
      dayOfWeek: day,
      startTime: ap === "ap_2" ? "09:00" : "10:00",
      endTime: day === "WEDNESDAY" ? "16:00" : "18:00",
      isActive: true,
      note: null,
      createdAt: ago(200),
      updatedAt: ago(20),
    });
  }
}

const timeOffs = [
  { id: "to_1", artistProfileId: "ap_2", startDate: at(12), endDate: at(14), title: "سفر کاری", note: "در دسترس نیستم", createdAt: ago(10) },
  { id: "to_2", artistProfileId: "ap_1", startDate: at(20), endDate: at(21), title: "مرخصی", note: null, createdAt: ago(6) },
  { id: "to_3", artistProfileId: "ap_5", startDate: at(5), endDate: at(6), title: "شرکت در نمایشگاه", note: null, createdAt: ago(9) },
];

// ============================================================================
// رزروها
// ============================================================================

type BookingSeed = [
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  bigint,
  number,
  string,
  string,
  string,
  string,
  string?
];

const bookingSeed: BookingSeed[] = [
  ["bkg_1", "usr_client_1", "usr_artist_2", "sv_4", "پرتره رئالیست پدربزرگ", 2, "10:00", "14:00", 12000000n, 240, "CONFIRMED", "LARGE", "REALISM", "بازوی راست", "پرتره پدربزرگم را می‌خواهم با جزئیات بالا بزنم"],
  ["bkg_2", "usr_client_1", "usr_artist_2", "sv_6", "تتو رئالیسم کوچک", -20, "11:00", "12:30", 4500000n, 90, "COMPLETED", "SMALL", "REALISM", "مچ دست چپ", "یک طرح کوچک از گل رز"],
  ["bkg_3", "usr_client_1", "usr_artist_5", "sv_11", "نیم‌آستین بلک‌ورک", -60, "09:00", "12:00", 18000000n, 180, "COMPLETED", "HALF_SLEEVE", "BLACKWORK", "بازوی راست", "طراحی و اجرای نیم‌آستین با طرح‌های تریبل"],
  ["bkg_4", "usr_client_2", "usr_artist_2", "sv_4", "پرتره چهره مادر", 1, "10:00", "14:00", 15000000n, 240, "PENDING_ARTIST", "LARGE", "REALISM", "بازوی چپ", "می‌خواهم پرتره مادرم را به صورت رئالیست بزنم"],
  ["bkg_5", "usr_client_3", "usr_artist_4", "sv_9", "دسته گل واتروکالر", 4, "11:00", "13:00", 5000000n, 120, "REQUESTED", "MEDIUM", "WATERCOLOR", "شانه راست", "یک دسته گل رنگارنگ با سبک واتروکالر"],
  ["bkg_6", "usr_client_4", "usr_artist_5", "sv_12", "تریبل سنتی روی ساعد", 3, "09:00", "11:30", 8500000n, 150, "RESCHEDULE_PENDING", "LARGE", "TRIBAL", "ساعد چپ", "طرح تریبل با الهام از هنر بومی"],
  ["bkg_7", "usr_client_5", "usr_artist_2", "sv_5", "نیم‌آستین رئالیست", 0, "13:00", "19:00", 32000000n, 360, "IN_PROGRESS", "HALF_SLEEVE", "REALISM", "بازوی چپ", "نیم‌آستین رئالیست با طرح طبیعت"],
  ["bkg_8", "usr_client_6", "usr_artist_1", "sv_1", "تتو مینیمال ستاره", -3, "14:00", "15:00", 2500000n, 60, "COMPLETED", "SMALL", "MINIMAL", "مچ دست راست", "ستاره کوچک مینیمال"],
  ["bkg_9", "usr_client_7", "usr_artist_1", "sv_3", "فاین‌لاین گل", 6, "10:00", "11:30", 3200000n, 90, "CONFIRMED", "SMALL", "LINE_ART", "دور مچ دست", "گل ظریف با خطوط نازک"],
  ["bkg_10", "usr_client_8", "usr_artist_3", "sv_7", "ژئومتریک هندسی", 5, "12:00", "13:30", 5000000n, 90, "PENDING_ARTIST", "MEDIUM", "GEOMETRIC", "ساق پا", "طرح هندسی متقارن"],
  ["bkg_11", "usr_client_2", "usr_artist_3", "sv_8", "ماندالا و دات‌ورک", -15, "15:00", "17:30", 7000000n, 150, "COMPLETED", "MEDIUM", "DOTWORK", "پشت شانه", "ماندالا با نقطه‌گذاری دقیق"],
  ["bkg_12", "usr_client_3", "usr_artist_5", "sv_11", "آستین بلک‌ورک", 10, "09:00", "12:00", 16500000n, 180, "CONFIRMED", "HALF_SLEEVE", "BLACKWORK", "بازوی راست", "ادامهٔ آستین قبلی"],
  ["bkg_13", "usr_client_4", "usr_artist_2", "sv_6", "تتو کوچک رئالیسم", -45, "16:00", "17:30", 3800000n, 90, "CANCELLED_BY_CLIENT", "SMALL", "REALISM", "گردن", "منصرف شدم"],
  ["bkg_14", "usr_client_5", "usr_artist_1", "sv_2", "بلک‌ورک گل رز", -30, "11:00", "13:00", 6500000n, 120, "CANCELLED_BY_ARTIST", "MEDIUM", "BLACKWORK", "ساعد", "هنرمند به دلیل سفر لغو کرد"],
  ["bkg_15", "usr_client_6", "usr_artist_4", "sv_10", "مینیمال گل و برگ", -8, "13:00", "14:00", 1800000n, 60, "NO_SHOW", "SMALL", "MINIMAL", "مچ دست", "مشتری حاضر نشد"],
  ["bkg_16", "usr_client_7", "usr_artist_3", "sv_7", "ژئومتریک کوچک", 8, "14:30", "16:00", 2800000n, 90, "REQUESTED", "SMALL", "GEOMETRIC", "مچ دست چپ", "طرح کوچک هندسی"],
  ["bkg_17", "usr_client_8", "usr_artist_5", "sv_12", "تریبل روی پشت", 14, "09:30", "12:00", 11000000n, 150, "PENDING_ARTIST", "EXTRA_LARGE", "TRIBAL", "پشت کمر", "طرح بزرگ تریبل"],
  ["bkg_18", "usr_client_1", "usr_artist_1", "sv_1", "مینیمال پروانه", -5, "10:00", "11:00", 2200000n, 60, "COMPLETED", "SMALL", "MINIMAL", "مچ دست راست", "پروانه مینیمال ظریف"],
  ["bkg_19", "usr_client_2", "usr_artist_1", "sv_1", "متوسط ژئومتریک", -18, "12:00", "14:00", 6500000n, 120, "COMPLETED", "MEDIUM", "GEOMETRIC", "ساعد راست", "طرح انتزاعی تزئینی"],
  ["bkg_20", "usr_client_3", "usr_artist_5", "sv_12", "تریبل روی ساعد", -12, "15:30", "18:00", 9800000n, 150, "COMPLETED", "LARGE", "TRIBAL", "ساعد راست", "طرح روی ساعد"],
  ["bkg_21", "usr_client_5", "usr_artist_3", "sv_8", "دات‌ورک قلب", -25, "13:00", "15:30", 4700000n, 150, "COMPLETED", "MEDIUM", "DOTWORK", "جناق سینه", "قلب آناتومیک"],
  ["bkg_22", "usr_client_4", "usr_artist_4", "sv_9", "واتروکالر پروانه", -35, "10:30", "12:00", 3600000n, 120, "COMPLETED", "MEDIUM", "WATERCOLOR", "شانه چپ", "پروانه رنگی"],
  // رزروهای تازه‌تکمیل‌شده (تا آمار «این ماه» در داشبوردها زنده باشد)
  ["bkg_23", "usr_client_2", "usr_artist_2", "sv_6", "تتو رئالیسم کوچک", -5, "11:00", "12:30", 4800000n, 90, "COMPLETED", "SMALL", "REALISM", "مچ دست راست", "طرح کوچک از گل رز"],
  ["bkg_24", "usr_client_5", "usr_artist_2", "sv_4", "پرتره رئالیست دخترم", -2, "10:00", "14:00", 13000000n, 240, "COMPLETED", "LARGE", "REALISM", "بازوی چپ", "پرتره دخترم با جزئیات بالا"]
];

/** استودیوی هر هنرمند */
const artistStudio: Record<string, string> = { ap_1: "std_1", ap_2: "std_1", ap_3: "std_3", ap_4: "std_1", ap_5: "std_2" };
const serviceArtist: Record<string, string> = Object.fromEntries(serviceSeed.map((s) => [s[0] as string, s[1] as string]));

const bookings = bookingSeed.map(
  ([id, clientId, artistId, serviceId, title, offset, startTime, endTime, agreedPrice, estimatedDuration, status, size, style, bodyPlacement, description], i) => {
    const ap = serviceArtist[serviceId];
    const completed = status === "COMPLETED";
    return {
      id,
      bookingNumber: `TY-${(2400 + i * 7).toString(36).toUpperCase()}-${id.replace("bkg_", "")}`,
      clientId,
      artistId,
      studioId: artistStudio[ap] || null,
      serviceId,
      availabilityId: null,
      scheduledDate: at(offset, parseInt(startTime.split(":")[0], 10)),
      startTime,
      endTime,
      title,
      description,
      location: studios.find((s) => s.id === artistStudio[ap])?.address || null,
      latitude: null,
      longitude: null,
      size,
      style,
      bodyPlacement,
      referenceImageUrl: i % 3 === 0 ? sampleAt(i) : null,
      designImageUrl: null,
      colorType: i % 4 === 0 ? "COLOR" : "BLACK",
      agreedPrice,
      estimatedDuration,
      status,
      cancellationReason: status.startsWith("CANCELLED") ? "لغو شده" : null,
      artistNotes: null,
      adminNotes: null,
      customRequestId: null,
      createdAt: ago(Math.max(1, -offset + 12)),
      updatedAt: ago(Math.max(0.5, -offset + 2)),
      completedAt: completed ? at(offset, 16) : null,
    };
  }
);

// ============================================================================
// پرداخت‌ها
// ============================================================================

const DEPOSIT_PERCENT = 0.3;

const payments: any[] = [];
let payIdx = 0;
for (const b of bookings) {
  payIdx += 1;
  const price = b.agreedPrice as bigint;
  const deposit = BigInt(Math.round(Number(price) * DEPOSIT_PERCENT));
  const remainder = price - deposit;
  const fee = BigInt(Math.round(Number(price) * 0.15));
  const isPaidBooking = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status as string);
  const daysUntil = ((b.scheduledDate as Date).getTime() - NOW) / DAY;

  payments.push({
    id: `pay_${payIdx}_d`,
    paymentNumber: `PAY-${1000 + payIdx}`,
    bookingId: b.id,
    walletId: null,
    amount: deposit,
    platformFee: fee,
    studioFee: 0n,
    artistNetAmount: deposit - fee > 0n ? deposit - fee : 0n,
    method: "ZARINPAL",
    status: isPaidBooking ? "PAID" : b.status === "CANCELLED_BY_CLIENT" ? "CANCELLED" : "PENDING",
    purpose: "DEPOSIT",
    gatewayTransactionId: isPaidBooking ? `zarin-${2000 + payIdx}` : null,
    gatewayRefId: isPaidBooking ? `ref-${2000 + payIdx}` : null,
    gatewayResponse: null,
    trackingCode: isPaidBooking ? `${34500000 + payIdx * 137}` : null,
    note: "بیعانه (سهم پلتفرم)",
    paidAt: isPaidBooking ? ago(Math.max(1, 7 + daysUntil)) : null,
    refundedAt: b.status === "CANCELLED_BY_ARTIST" ? ago(2) : null,
    createdAt: ago(Math.max(1, 9 + daysUntil)),
    updatedAt: ago(1),
    transactionId: null,
  });

  if (b.status === "COMPLETED") {
    payments.push({
      id: `pay_${payIdx}_r`,
      paymentNumber: `PAY-${1000 + payIdx}-R`,
      bookingId: b.id,
      walletId: null,
      amount: remainder,
      platformFee: 0n,
      studioFee: 0n,
      artistNetAmount: remainder,
      method: "ZARINPAL",
      status: "PAID",
      purpose: "REMAINDER",
      gatewayTransactionId: `zarin-${4000 + payIdx}`,
      gatewayRefId: `ref-${4000 + payIdx}`,
      gatewayResponse: null,
      trackingCode: `${45600000 + payIdx * 211}`,
      note: "باقی‌مانده (سهم هنرمند)",
      paidAt: ago(Math.max(0.5, 2)),
      refundedAt: null,
      createdAt: ago(3),
      updatedAt: ago(1),
      transactionId: null,
    });
  }
}

// ============================================================================
// نظرها
// ============================================================================

const reviews = [
  {
    id: "rev_1",
    authorId: "usr_client_1",
    recipientId: "usr_artist_1",
    bookingId: "bkg_18",
    portfolioItemId: "pf_1",
    rating: 5,
    score: 98,
    creativityRating: 5,
    professionalismRating: 5,
    cleanlinessRating: 5,
    communicationRating: 5,
    comment: "سارا واقعاً هنرمند فوق‌العاده‌ای هست! کارش تمیز و دقیق بود. محیط استودیو هم خیلی حرفه‌ای و بهداشتی بود. حتماً بازم میام.",
    artistReply: "ممنون از اعتمادتون نگار جان 🌸",
    artistReplyAt: ago(4),
    isVerified: true,
    createdAt: ago(5),
    updatedAt: ago(4),
  },
  {
    id: "rev_2",
    authorId: "usr_client_1",
    recipientId: "usr_artist_5",
    bookingId: "bkg_3",
    portfolioItemId: "pf_8",
    rating: 5,
    score: 97,
    creativityRating: 5,
    professionalismRating: 4,
    cleanlinessRating: 5,
    communicationRating: 5,
    comment: "امیر حرفه‌ای‌ترین هنرمندیه که دیدم. بلک‌ورکش بی‌نقصه و خیلی صبورانه طرح رو اجرا کرد.",
    artistReply: null,
    artistReplyAt: null,
    isVerified: true,
    createdAt: ago(50),
    updatedAt: ago(50),
  },
  {
    id: "rev_3",
    authorId: "usr_client_3",
    recipientId: "usr_artist_3",
    bookingId: "bkg_11",
    portfolioItemId: "pf_6",
    rating: 4,
    score: 88,
    creativityRating: 5,
    professionalismRating: 4,
    cleanlinessRating: 4,
    communicationRating: 4,
    comment: "ماندالای ژئومتریکش خیلی قشنگه. دقت و نظم در کارش معلومه.",
    artistReply: "سپاس از شما 🙏",
    artistReplyAt: ago(10),
    isVerified: true,
    createdAt: ago(13),
    updatedAt: ago(10),
  },
  {
    id: "rev_4",
    authorId: "usr_client_2",
    recipientId: "usr_artist_3",
    bookingId: "bkg_11",
    portfolioItemId: null,
    rating: 5,
    score: 95,
    creativityRating: 5,
    professionalismRating: 5,
    cleanlinessRating: 5,
    communicationRating: 5,
    comment: "کار تمیز و سریع، بدون درد اضافه. پیشنهاد می‌کنم.",
    artistReply: null,
    artistReplyAt: null,
    isVerified: true,
    createdAt: ago(14),
    updatedAt: ago(14),
  },
  {
    id: "rev_5",
    authorId: "usr_client_5",
    recipientId: "usr_artist_2",
    bookingId: "bkg_7",
    portfolioItemId: "pf_4",
    rating: 5,
    score: 99,
    creativityRating: 5,
    professionalismRating: 5,
    cleanlinessRating: 5,
    communicationRating: 5,
    comment: "رضا استاد بی‌رقیب پرتره است. نتیجه دقیقاً همون چیزی شد که می‌خواستم.",
    artistReply: null,
    artistReplyAt: null,
    isVerified: true,
    createdAt: ago(2),
    updatedAt: ago(2),
  },
  {
    id: "rev_6",
    authorId: "usr_client_6",
    recipientId: "usr_artist_1",
    bookingId: "bkg_8",
    portfolioItemId: "pf_3",
    rating: 5,
    score: 96,
    creativityRating: 5,
    professionalismRating: 5,
    cleanlinessRating: 4,
    communicationRating: 5,
    comment: "دقت سارا در جزئیات فوق‌العاده است.",
    artistReply: null,
    artistReplyAt: null,
    isVerified: false,
    createdAt: ago(2),
    updatedAt: ago(2),
  },
  {
    id: "rev_7",
    authorId: "usr_client_4",
    recipientId: "usr_artist_4",
    bookingId: "bkg_22",
    portfolioItemId: "pf_7",
    rating: 4,
    score: 90,
    creativityRating: 4,
    professionalismRating: 5,
    cleanlinessRating: 5,
    communicationRating: 4,
    comment: "رنگ‌های واتروکالرش زنده و زیباست.",
    artistReply: null,
    artistReplyAt: null,
    isVerified: false,
    createdAt: ago(1),
    updatedAt: ago(1),
  },
];

// ============================================================================
// کیف پول، تراکنش‌ها و برداشت‌ها
// ============================================================================

const wallets = [
  {
    id: "wal_1",
    ownerId: "usr_artist_1",
    balance: 45000000n,
    withdrawableBalance: 30000000n,
    pendingBalance: 15000000n,
    frozenBalance: 0n,
    totalDeposited: 50000000n,
    totalWithdrawn: 5000000n,
    lastFourCardNumber: "4321",
    iban: "IR820540102680020817909002",
    accountHolderName: "سارا اینک",
    bankName: "بانک ملت",
    isActive: true,
    createdAt: ago(300),
    updatedAt: ago(1),
  },
  {
    id: "wal_2",
    ownerId: "usr_artist_2",
    balance: 120000000n,
    withdrawableBalance: 80000000n,
    pendingBalance: 40000000n,
    frozenBalance: 0n,
    totalDeposited: 150000000n,
    totalWithdrawn: 30000000n,
    lastFourCardNumber: "8812",
    iban: "IR190170000000000000000000",
    accountHolderName: "رضا کریمی",
    bankName: "بانک صادرات",
    isActive: true,
    createdAt: ago(310),
    updatedAt: ago(1),
  },
  {
    id: "wal_3",
    ownerId: "usr_artist_5",
    balance: 68000000n,
    withdrawableBalance: 42000000n,
    pendingBalance: 26000000n,
    frozenBalance: 0n,
    totalDeposited: 96000000n,
    totalWithdrawn: 28000000n,
    lastFourCardNumber: "5510",
    iban: "IR330190000000000000000000",
    accountHolderName: "امیر رضوانی",
    bankName: "بانک پاسارگاد",
    isActive: true,
    createdAt: ago(280),
    updatedAt: ago(2),
  },
];

const transactions = [
  { id: "trx_1", walletId: "wal_2", userId: "usr_artist_2", type: "BOOKING_INCOME", amount: 10200000n, balanceBefore: 108000000n, balanceAfter: 118200000n, description: "درآمد رزرو پرتره چهره مادر", referenceId: "bkg_4", referenceType: "BOOKING", isCompleted: true, createdAt: ago(3) },
  { id: "trx_2", walletId: "wal_2", userId: "usr_artist_2", type: "WITHDRAWAL", amount: 30000000n, balanceBefore: 138200000n, balanceAfter: 108200000n, description: "برداشت به حساب بانکی صادرات", referenceId: "wdr_1", referenceType: "WITHDRAWAL", isCompleted: true, createdAt: ago(9) },
  { id: "trx_3", walletId: "wal_1", userId: "usr_artist_1", type: "BOOKING_INCOME", amount: 2125000n, balanceBefore: 42875000n, balanceAfter: 45000000n, description: "درآمد رزرو تتو مینیمال پروانه", referenceId: "bkg_18", referenceType: "BOOKING", isCompleted: true, createdAt: ago(5) },
  { id: "trx_4", walletId: "wal_1", userId: "usr_artist_1", type: "PLATFORM_FEE", amount: 375000n, balanceBefore: 45000000n, balanceAfter: 44625000n, description: "کارمزد پلتفرم نوبت مارکت", referenceId: "bkg_18", referenceType: "BOOKING", isCompleted: true, createdAt: ago(5) },
  { id: "trx_5", walletId: "wal_3", userId: "usr_artist_5", type: "BOOKING_INCOME", amount: 15300000n, balanceBefore: 52700000n, balanceAfter: 68000000n, description: "درآمد نیم‌آستین بلک‌ورک", referenceId: "bkg_3", referenceType: "BOOKING", isCompleted: true, createdAt: ago(48) },
  { id: "trx_6", walletId: "wal_2", userId: "usr_artist_2", type: "DEPOSIT", amount: 20000000n, balanceBefore: 88000000n, balanceAfter: 108000000n, description: "شارژ کیف پول", referenceId: null, referenceType: null, isCompleted: true, createdAt: ago(20) },
];

const withdrawalRequests = [
  { id: "wdr_1", walletId: "wal_2", amount: 30000000n, destinationIban: "IR190170000000000000000000", cardNumber: null, accountHolderName: "رضا کریمی", bankName: "بانک صادرات", isApproved: true, reviewedAt: ago(8), adminNote: "انتقال انجام شد", transferTrackingCode: "8842312", createdAt: ago(10), updatedAt: ago(8) },
  { id: "wdr_2", walletId: "wal_1", amount: 12000000n, destinationIban: "IR820540102680020817909002", cardNumber: null, accountHolderName: "سارا اینک", bankName: "بانک ملت", isApproved: null, reviewedAt: null, adminNote: null, transferTrackingCode: null, createdAt: ago(1), updatedAt: ago(1) },
  { id: "wdr_3", walletId: "wal_3", amount: 8000000n, destinationIban: "IR330190000000000000000000", cardNumber: null, accountHolderName: "امیر رضوانی", bankName: "بانک پاسارگاد", isApproved: false, reviewedAt: ago(4), adminNote: "شبا نیاز به اصلاح دارد", transferTrackingCode: null, createdAt: ago(6), updatedAt: ago(4) },
];

// ============================================================================
// گفتگوها، پیام‌ها و اعلان‌ها
// ============================================================================

const conversationSeed: [string, string, string, string, string][] = [
  ["cnv_1", "bkg_1", "usr_client_1", "usr_artist_2", "هماهنگی پرتره رئالیست"],
  ["cnv_2", "bkg_2", "usr_client_1", "usr_artist_2", "تتو رئالیسم کوچک"],
  ["cnv_3", "bkg_3", "usr_client_1", "usr_artist_5", "نیم‌آستین بلک‌ورک"],
  ["cnv_4", "bkg_4", "usr_client_2", "usr_artist_2", "پرتره چهره مادر"],
  ["cnv_5", "bkg_7", "usr_client_5", "usr_artist_2", "نیم‌آستین رئالیست"],
  ["cnv_6", "bkg_9", "usr_client_7", "usr_artist_1", "فاین‌لاین گل"],
  ["cnv_7", "bkg_12", "usr_client_3", "usr_artist_5", "آستین بلک‌ورک"],
  ["cnv_8", "bkg_8", "usr_client_6", "usr_artist_1", "تتو مینیمال ستاره"],
];

const messageSeed: [string, string, string, number][] = [
  ["cnv_1", "usr_client_1", "سلام، برای طراحی پرتره عکس رفرنس هم لازمه بفرستم؟", 2],
  ["cnv_1", "usr_artist_2", "سلام نگار جان 🌷 بله لطفاً ۲-۳ تا عکس واضح از روبه‌رو بفرست تا از بینشون بهترین رو انتخاب کنیم.", 2],
  ["cnv_1", "usr_client_1", "چشم، الان از پروفایلم آپلود می‌کنم. زمان جلسه همون دو روز دیگه ۱۰ صبح درسته؟", 1],
  ["cnv_1", "usr_artist_2", "بله دقیقاً. جلسه تقریباً ۴ ساعت طول می‌کشه، پس شب قبل خوب بخواب و صبحانه کامل بخور 😊", 1],
  ["cnv_2", "usr_client_1", "سلام، تتوی قبلی که زدیم خیلی خوب موند. الان می‌تونم برای جلسه بعدی بیام؟", 20],
  ["cnv_2", "usr_artist_2", "خوشحالم که راضی بودی 🙏 بعد از ۳۰ روز می‌تونیم جلسه بعدی رو بذاریم. از پنل رزرو کن تا زمان خالی ببینی.", 20],
  ["cnv_3", "usr_client_1", "سلام امیر جان، طرح نیم‌آستین رو نهایی کردیم؟", 45],
  ["cnv_3", "usr_artist_5", "سلام! بله طرح رو آماده کردم، توی جلسه نهایی‌سازی جزئیات خطوط رو با هم چک می‌کنیم.", 44],
  ["cnv_4", "usr_client_2", "سلام، امکان تغییر سایز پرتره به بزرگ‌تر هست؟", 1],
  ["cnv_5", "usr_client_5", "سلام رضا جان، امروز ساعت ۱۳ همون‌جا هستم. لطفاً محدوده پارکینگ رو بگو.", 0],
  ["cnv_5", "usr_artist_2", "سلام، بله. پارکینگ عمومی دو خیابون بالاتر هست، ۳ دقیقه پیاده. تا ۱۳ منتظرتم ✌️", 0],
  ["cnv_6", "usr_client_7", "سلام سارا جان، طرح فاین‌لاین رو توی سایز کوچیک می‌پسندی؟", 1],
  ["cnv_6", "usr_artist_1", "سلام 🥰 بله دقیقاً همون سایز مناسب این طرحه، روی مچ خیلی ظریف درمیاد.", 1],
  ["cnv_7", "usr_client_3", "سلام، برای ادامه آستین رنگ مشکی خالص استفاده می‌کنید؟", 3],
  ["cnv_7", "usr_artist_5", "سلام، بله مشکی خالص با سایه‌زنی خاکستری که با کار قبلی هماهنگ بمونه.", 3],
  ["cnv_8", "usr_client_6", "سلام، ستاره مینیمال رو زدی، نتیجه فوق‌العاده شد! ممنون 🙏", 2],
  ["cnv_8", "usr_artist_1", "خیلی ممنون! خوشحالم که دوست داشتی 🌟 مراقبت‌های بعد از تتو رو یادت باشه.", 2],
];

const conversations = conversationSeed.map(([id, bookingId, _c, _a, title], i) => {
  const msgs = messageSeed.filter((m) => m[0] === id);
  const last = msgs[msgs.length - 1];
  return {
    id,
    title,
    bookingId,
    requestId: null,
    isActive: true,
    lastMessageAt: last ? ago(last[3]) : ago(10 + i),
    lastMessagePreview: last ? last[2].slice(0, 80) : null,
    unreadCount: i === 0 ? 2 : i === 4 ? 1 : 0,
    createdAt: ago(40 - i * 3),
    updatedAt: last ? ago(last[3]) : ago(10 + i),
  };
});

const conversationParticipants: any[] = [];
conversationSeed.forEach(([id, _b, clientId, artistId], i) => {
  conversationParticipants.push({
    id: `cp_${i * 2 + 1}`,
    conversationId: id,
    userId: clientId,
    unreadCount: i === 1 ? 1 : 0,
    lastReadAt: ago(2),
    isMuted: false,
    isArchived: false,
    joinedAt: ago(40 - i * 3),
  });
  conversationParticipants.push({
    id: `cp_${i * 2 + 2}`,
    conversationId: id,
    userId: artistId,
    unreadCount: i === 0 ? 2 : 0,
    lastReadAt: ago(1),
    isMuted: false,
    isArchived: false,
    joinedAt: ago(40 - i * 3),
  });
});

let msgIdx = 0;
const messages = messageSeed.map(([conversationId, senderId, content, daysAgo]) => {
  msgIdx += 1;
  return {
    id: `msg_${msgIdx}`,
    conversationId,
    senderId,
    content,
    attachments: [],
    messageType: "text",
    status: "READ",
    isDeleted: false,
    createdAt: ago(daysAgo, 2),
    updatedAt: ago(daysAgo, 2),
  };
});

const notificationSeed: [string, string, string, string, boolean, string | null, number][] = [
  ["usr_client_1", "رزرو شما تأیید شد", "رزرو «پرتره رئالیست پدربزرگ» توسط رضا اینک‌مستر تأیید شد.", "BOOKING", false, "/client/bookings", 1],
  ["usr_client_1", "پرداخت بیعانه", "بیعانه رزرو «پرتره رئالیست پدربزرگ» با موفقیت پرداخت شد.", "PAYMENT", true, "/client/payments", 3],
  ["usr_client_1", "پیام جدید", "رضا اینک‌مستر به گفتگوی شما پیام داد.", "MESSAGE", false, "/client/inbox", 1],
  ["usr_client_2", "در انتظار تأیید هنرمند", "رزرو «پرتره چهره مادر» برای تأیید به هنرمند ارسال شد.", "BOOKING", false, "/client/bookings", 1],
  ["usr_client_3", "در انتظار پرداخت بیعانه", "برای ارسال رزرو «دسته گل واتروکالر» به هنرمند، بیعانه را پرداخت کنید. ۴ ساعت فرصت دارید.", "WARNING", false, "/client/payments", 0],
  ["usr_client_4", "درخواست تغییر زمان", "امیر دارک‌لاینز برای رزرو «تریبل سنتی روی ساعد» زمان جدیدی پیشنهاد داده است.", "WARNING", false, "/client/bookings", 1],
  ["usr_client_5", "جلسه امروز", "یادآوری: جلسه تتوی شما امروز ساعت ۱۳ آغاز می‌شود.", "INFO", false, "/client/bookings", 0],
  ["usr_client_6", "تتو تکمیل شد", "رزرو «تتو مینیمال ستاره» تکمیل شد. لطفاً نظر خود را ثبت کنید.", "SUCCESS", false, "/client/bookings", 2],
  ["usr_artist_2", "رزرو جدید تأیید‌شده", "ادمین رزرو «پرتره رئالیست پدربزرگ» را تأیید کرد و منتظر تأیید نهایی شماست.", "BOOKING", false, "/artist/dashboard/bookings", 1],
  ["usr_artist_2", "درخواست تغییر زمان", "برای رزرو «تریبل سنتی روی ساعد» درخواست تغییر زمان ثبت شده است.", "WARNING", false, "/artist/dashboard/bookings", 1],
  ["usr_artist_2", "پیام جدید", "نگار کیانی به گفتگوی شما پیام داد.", "MESSAGE", false, "/artist/inbox", 1],
  ["usr_artist_2", "تسویه انجام شد", "۳۰٬۰۰۰٬۰۰۰ تومان به حساب بانکی شما واریز شد.", "SUCCESS", true, "/artist/dashboard/payments", 9],
  ["usr_artist_1", "نمونه‌کار تأیید شد", "نمونه‌کار «پروانه مینیمال» توسط ادمین تأیید و منتشر شد.", "SUCCESS", true, "/artist/dashboard/portfolio", 4],
  ["usr_artist_5", "نمونه‌کار در انتظار تأیید", "۲ نمونه‌کار جدید شما در صف بررسی ادمین است.", "INFO", false, "/artist/dashboard/portfolio", 1],
  ["usr_artist_4", "تأیید پروفایل", "پروفایل شما در انتظار تأیید ادمین است. پس از تأیید، نشان تأیید روی پروفایلتان نمایش داده می‌شود.", "INFO", false, "/artist/profile", 2],
  ["usr_admin", "نمونه‌کار در انتظار بازبینی", "۲ نمونه‌کار جدید برای بازبینی ارسال شده است.", "INFO", false, "/admin/moderation", 0],
  ["usr_admin", "درخواست برداشت", "سارا اینک درخواست برداشت ۱۲٬۰۰۰٬۰۰۰ تومان ثبت کرده است.", "WARNING", false, "/admin/finance", 1],
  ["usr_admin", "هنرمند جدید", "بهنام استایل ثبت‌نام کرده و منتظر تأیید پروفایل است.", "INFO", false, "/admin/users", 2],
  ["usr_admin", "پیام تماس جدید", "یک پیام جدید از فرم تماس دریافت شد.", "INFO", false, "/admin/messages", 0],
  ["usr_admin", "رزرو در انتظار تأیید", "۳ رزرو در انتظار تأیید ادمین هستند.", "INFO", false, "/admin/bookings", 0],
];

const notifications = notificationSeed.map(([userId, title, message, type, isRead, link, daysAgo], i) => ({
  id: `ntf_${i + 1}`,
  userId,
  title,
  message,
  type,
  isRead,
  link,
  data: null,
  fileUrl: null,
  fileName: null,
  isTicket: false,
  senderId: null,
  createdAt: ago(daysAgo, 1),
  updatedAt: ago(daysAgo, 1),
}));

// اعلان تیکتی (پشتیبانی) برای نمونه
notifications.unshift({
  id: "ntf_ticket_1",
  userId: "usr_artist_2",
  title: "سؤال دربارهٔ تسویه حساب",
  message: "سلام، درخواست برداشت من چه زمانی تأیید می‌شود؟ ممنون می‌شوم بررسی کنید.",
  type: "INFO",
  isRead: false,
  link: null,
  data: null,
  fileUrl: null,
  fileName: null,
  isTicket: true,
  senderId: "usr_artist_2",
  createdAt: ago(0, 5),
  updatedAt: ago(0, 5),
} as any);

const notificationReplies = [
  { id: "nrp_1", notificationId: "ntf_ticket_1", senderId: "usr_admin", message: "سلام، درخواست شما در حال بررسی است و حداکثر تا ۴۸ ساعت آینده به حساب بانکی واریز می‌شود.", fileUrl: null, fileName: null, createdAt: ago(0, 3) },
];

// ============================================================================
// مجله، CMS و دیگر محتواها
// ============================================================================

const blogPosts = [
  {
    id: "bp_1",
    slug: "aftercare-guide",
    title: "راهنمای کامل مراقبت از تتو در ۱۴ روز اول",
    excerpt: "چه کارهایی باعث می‌شود تتوی تازه‌ات بهترین نتیجه را بدهد و چه کارهایی آن را خراب می‌کند؟",
    content:
      "## روز اول\nتتو را با پوشش پلاستیکی نگه دارید و بعد از ۴ تا ۶ ساعت با آب ولرم و صابون ملایم بشویید.\n\n## روز دوم تا هفتم\nروزی دو بار پماد مخصوص بزنید و از خاراندن محل تتو خودداری کنید.\n\n## هفته دوم\nپوسته‌ریزی طبیعی است. از استخر، سونا و آفتاب مستقیم پرهیز کنید.",
    coverImage: CATEGORY("MINIMAL.jpg"),
    authorId: "usr_admin",
    category: "AFTER_CARE",
    isPublished: true,
    isFeatured: true,
    isNotice: false,
    views: 1840,
    createdAt: ago(30),
    updatedAt: ago(29),
  },
  {
    id: "bp_2",
    slug: "realism-vs-blackwork",
    title: "رئالیسم یا بلک‌ورک؟ راهنمای انتخاب سبک",
    excerpt: "اگر بین دو سبک محبوب مردد هستید، این مقایسه به شما کمک می‌کند انتخاب درستی داشته باشید.",
    content:
      "## رئالیسم\nمناسب کسانی که به جزئیات و سایه‌های نرم علاقه دارند؛ زمان اجرای طولانی‌تری دارد.\n\n## بلک‌ورک\nکنتراست بالا و ماندگاری عالی؛ برای طرح‌های جسورانه و بزرگ ایده‌آل است.",
    coverImage: CATEGORY("REALISM.jpg"),
    authorId: "usr_admin",
    category: "STYLES",
    isPublished: true,
    isFeatured: false,
    isNotice: false,
    views: 1220,
    createdAt: ago(22),
    updatedAt: ago(22),
  },
  {
    id: "bp_3",
    slug: "price-guide",
    title: "قیمت تتو در ایران چگونه محاسبه می‌شود؟",
    excerpt: "عوامل مؤثر بر قیمت‌گذاری تتو و نکات مهم برای رزرو آگاهانه.",
    content:
      "قیمت تتو به اندازه، سبک، مدت زمان اجرا، تجربهٔ هنرمند و شهر بستگی دارد. در نوبت مارکت هر هنرمند سرویس‌های خودش را با قیمت شفاف منتشر می‌کند.",
    coverImage: CATEGORY("COLOR.jpg"),
    authorId: "usr_admin",
    category: "GUIDES",
    isPublished: true,
    isFeatured: false,
    isNotice: false,
    views: 2210,
    createdAt: ago(18),
    updatedAt: ago(18),
  },
  {
    id: "bp_4",
    slug: "new-features",
    title: "اطلاعیه: امکان رزرو آنلاین با بیعانه امن",
    excerpt: "از این پس می‌توانید بیعانه را آنلاین پرداخت کنید و رزرو شما تضمین شود.",
    content:
      "با پرداخت بیعانه، رزرو شما برای تأیید به هنرمند ارسال می‌شود و زمان انتخابی تا ۴ ساعت رزرو می‌ماند.",
    coverImage: CATEGORY("BLACKWORK.jpg"),
    authorId: "usr_admin",
    category: "ANNOUNCEMENT",
    isPublished: true,
    isFeatured: false,
    isNotice: true,
    views: 3210,
    createdAt: ago(9),
    updatedAt: ago(9),
  },
  {
    id: "bp_5",
    slug: "choose-artist",
    title: "۵ نکته برای انتخاب هنرمند تتوی مناسب",
    excerpt: "پورتفولیو، امتیاز، سبک و ارتباط؛ چه چیزهایی را قبل از رزرو بررسی کنیم؟",
    content:
      "۱. پورتفولیوی واقعی را ببینید.\n۲. نظر مشتریان قبلی را بخوانید.\n۳. سبک تخصصی هنرمند را بررسی کنید.\n۴. دربارهٔ بهداشت و محیط بپرسید.\n۵. قیمت شفاف را قبل از رزرو بدانید.",
    coverImage: CATEGORY("LINE ART.jpg"),
    authorId: "usr_admin",
    category: "GUIDES",
    isPublished: true,
    isFeatured: true,
    isNotice: false,
    views: 980,
    createdAt: ago(5),
    updatedAt: ago(5),
  },
  {
    id: "bp_6",
    slug: "draft-post",
    title: "پیش‌نویس: جدیدترین سبک‌های ۱۴۰۵",
    excerpt: "این مقاله هنوز منتشر نشده است.",
    content: "در حال آماده‌سازی...",
    coverImage: null,
    authorId: "usr_admin",
    category: "NEWS",
    isPublished: false,
    isFeatured: false,
    isNotice: false,
    views: 0,
    createdAt: ago(1),
    updatedAt: ago(1),
  },
];

const blogComments = [
  { id: "bc_1", postSlug: "aftercare-guide", userId: "usr_client_1", content: "خیلی کامل بود، ممنون! دقیقاً همین نکات رو رعایت کردم و پوستم عالی شد.", isApproved: true, likeCount: 12, dislikeCount: 0, parentId: null, createdAt: ago(20), updatedAt: ago(20) },
  { id: "bc_2", postSlug: "aftercare-guide", userId: "usr_client_2", content: "پماد مخصوصی پیشنهاد می‌کنید؟", isApproved: true, likeCount: 5, dislikeCount: 0, parentId: null, createdAt: ago(15), updatedAt: ago(15) },
  { id: "bc_3", postSlug: "aftercare-guide", userId: "usr_artist_1", content: "بهترین انتخاب پماد بی‌رنگ و بدون عطر است؛ همون چیزی که خودم به مشتریام می‌گم.", isApproved: true, likeCount: 18, dislikeCount: 1, parentId: "bc_2", createdAt: ago(14), updatedAt: ago(14) },
  { id: "bc_4", postSlug: "price-guide", userId: "usr_client_4", content: "خیلی شفاف توضیح دادید. قبلاً همیشه برای قیمت مردد بودم.", isApproved: true, likeCount: 9, dislikeCount: 0, parentId: null, createdAt: ago(10), updatedAt: ago(10) },
  { id: "bc_5", postSlug: "choose-artist", userId: "usr_client_6", content: "مینیمال و باکیفیت. ممنون از راهنمایی‌ها 🙏", isApproved: false, likeCount: 2, dislikeCount: 0, parentId: null, createdAt: ago(2), updatedAt: ago(2) },
];

const commentReactions = [
  { id: "cr_1", commentId: "bc_1", userId: "usr_client_3", type: "LIKE", createdAt: ago(19) },
  { id: "cr_2", commentId: "bc_3", userId: "usr_client_1", type: "LIKE", createdAt: ago(13) },
  { id: "cr_3", commentId: "bc_3", userId: "usr_client_5", type: "DISLIKE", createdAt: ago(12) },
  { id: "cr_4", commentId: "bc_4", userId: "usr_artist_2", type: "LIKE", createdAt: ago(9) },
];

const cmsPages = [
  {
    id: "cms_1",
    slug: "about",
    title: "درباره ما",
    content: "نوبت مارکت پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران است که ارائه‌دهندگان خدمات و مشتریان را به‌صورت امن به هم متصل می‌کند.",
    seoTitle: "درباره نوبت مارکت | پلتفرم رزرو نوبت ایران",
    seoDescription: "با نوبت مارکت ارائه‌دهنده خدمات مناسب خود را بر اساس نوع کسب‌وکار، شهر و امتیاز پیدا کنید و آنلاین رزرو کنید.",
    customHtml: null,
    customCss: null,
    customJs: null,
    isActive: true,
    showHeader: true,
    showFooter: true,
    createdAt: ago(400),
    updatedAt: ago(20),
  },
  {
    id: "cms_2",
    slug: "terms",
    title: "شرایط استفاده",
    content: "استفاده از نوبت مارکت به معنای پذیرش قوانین پلتفرم است. رزرو، پرداخت و لغو بر اساس قوانین پلتفرم انجام می‌شود.",
    seoTitle: "شرایط استفاده | نوبت مارکت",
    seoDescription: "قوانین و شرایط استفاده از پلتفرم نوبت مارکت",
    customHtml: null,
    customCss: null,
    customJs: null,
    isActive: true,
    showHeader: true,
    showFooter: true,
    createdAt: ago(400),
    updatedAt: ago(30),
  },
  {
    id: "cms_3",
    slug: "privacy",
    title: "حریم خصوصی",
    content: "اطلاعات کاربران نوبت مارکت محرمانه است و بدون اجازه در اختیار شخص ثالث قرار نمی‌گیرد.",
    seoTitle: "حریم خصوصی | نوبت مارکت",
    seoDescription: "سیاست حفظ حریم خصوصی کاربران نوبت مارکت",
    customHtml: null,
    customCss: null,
    customJs: null,
    isActive: true,
    showHeader: true,
    showFooter: true,
    createdAt: ago(400),
    updatedAt: ago(30),
  },
  {
    id: "cms_4",
    slug: "aftercare",
    title: "مراقبت بعد از تتو",
    content: "راهنمای کامل نگهداری از تتوی تازه.",
    seoTitle: "مراقبت بعد از تتو | نوبت مارکت",
    seoDescription: "نکات مهم برای مراقبت از تتو در روزهای اول",
    customHtml: null,
    customCss: null,
    customJs: null,
    isActive: true,
    showHeader: true,
    showFooter: true,
    createdAt: ago(200),
    updatedAt: ago(12),
  },
];

const waitlist = [
  { id: "wl_1", userId: "usr_client_1", artistProfileId: "ap_5", preferredStyle: "BLACKWORK", createdAt: ago(6) },
  { id: "wl_2", userId: "usr_client_2", artistProfileId: "ap_2", preferredStyle: "REALISM", createdAt: ago(3) },
  { id: "wl_3", userId: "usr_client_5", artistProfileId: "ap_4", preferredStyle: "WATERCOLOR", createdAt: ago(1) },
];

const clientNotes = [
  { id: "cn_1", artistId: "ap_2", clientId: "usr_client_1", note: "حساسیت پوستی خفیف دارد؛ از پماد بی‌عطر استفاده کند.", createdAt: ago(20) },
  { id: "cn_2", artistId: "ap_2", clientId: "usr_client_2", note: "ترجیح می‌دهد جلسات صبح برگزار شود.", createdAt: ago(9) },
  { id: "cn_3", artistId: "ap_1", clientId: "usr_client_6", note: "برای جلسه بعدی طرح ستاره بزرگ‌تر انتخاب کرده است.", createdAt: ago(2) },
];

const auditLogs = [
  { id: "al_1", adminId: "usr_admin", action: "APPROVED_PORTFOLIO", details: { itemId: "pf_1" }, createdAt: ago(4) },
  { id: "al_2", adminId: "usr_admin", action: "UPDATED_SETTINGS", details: { keys: ["DEPOSIT_PERCENT", "PAYMENT_MODE"] }, createdAt: ago(6) },
  { id: "al_3", adminId: "usr_admin", action: "APPROVED_ARTIST", details: { userId: "usr_artist_1" }, createdAt: ago(30) },
  { id: "al_4", adminId: "usr_admin", action: "SUSPEND_USER", details: { userId: "usr_client_9", reason: "تخلف در قوانین رزرو" }, createdAt: ago(20) },
  { id: "al_5", adminId: "usr_admin", action: "APPROVED_WITHDRAWAL", details: { requestId: "wdr_1", amount: 30000000 }, createdAt: ago(8) },
  { id: "al_6", adminId: "usr_admin", action: "REGISTERED_STUDIO", details: { studioId: "std_3" }, createdAt: ago(300) },
];

const contactMessages = [
  { id: "cm_1", name: "مریم رحیمی", email: "maryam.r@gmail.com", subject: "سؤال درباره رزرو گروهی", message: "سلام، آیا امکان رزرو گروهی برای سه نفر در یک روز وجود دارد؟", read: false, replied: false, createdAt: ago(0, 2), updatedAt: ago(0, 2) },
  { id: "cm_2", name: "سعید کاظمی", email: "saeed.k@gmail.com", subject: "همکاری به عنوان هنرمند", message: "سلام، من هنرمند تتو هستم و می‌خواهم در پلتفرم شما عضو شوم. مراحل چیست؟", read: true, replied: true, createdAt: ago(3), updatedAt: ago(2) },
  { id: "cm_3", name: "نیلوفر امینی", email: "niloofar.a@gmail.com", subject: "مشکل در پرداخت", message: "بیعانه را پرداخت کردم ولی وضعیت رزرو تغییر نکرده است.", read: false, replied: false, createdAt: ago(1), updatedAt: ago(1) },
  { id: "cm_4", name: "بابک شریفی", email: "babak.sh@gmail.com", subject: "پیشنهاد همکاری تبلیغاتی", message: "سلام، برای تبلیغات مشترک در اینستاگرام پیشنهادی دارم.", read: true, replied: false, createdAt: ago(5), updatedAt: ago(4) },
];

const newsletterSubscribers = [
  "ali.rezaei@example.com",
  "sara.mohammadi@example.com",
  "mahdi.karimi@example.com",
  "negar.ahmadi@example.com",
  "reza.hosseini@example.com",
  "zahra.naseri@example.com",
  "amir.rahimi@example.com",
  "elham.safari@example.com",
].map((email, i) => ({
  id: `ns_${i + 1}`,
  email,
  isActive: i !== 3,
  createdAt: ago(60 - i * 5),
}));

const customRequests = [
  {
    id: "crq_1",
    clientId: "usr_client_1",
    artistId: "ap_1",
    title: "تتو ستاره روی گردن",
    description: "می‌خواهم یک ستاره کوچک و مینیمال روی گردنم بزنم. طرح ساده و ظریف باشد.",
    referenceImages: [],
    preferredSize: "SMALL",
    preferredStyle: "MINIMAL",
    bodyPlacement: "گردن - پشت گوش چپ",
    budget: 3000000n,
    preferredStartDate: at(7),
    isFlexibleWithDate: true,
    quotedPrice: 2000000n,
    quoteNotes: "ستاره ۵ پر مینیمال، قیمت مناسب‌تر از لیست قیمت",
    quoteExpiry: at(10),
    status: "QUOTE_SENT",
    rejectionReason: null,
    bookingId: null,
    createdAt: ago(3),
    updatedAt: ago(2),
  },
  {
    id: "crq_2",
    clientId: "usr_client_2",
    artistId: "ap_2",
    title: "پرتره حیوان خانگی",
    description: "می‌خواهم پرتره سگم را به صورت واقع‌گرایانه بزنم. عکس‌های خوبی از سگم دارم.",
    referenceImages: [sampleAt(3)],
    preferredSize: "MEDIUM",
    preferredStyle: "REALISM",
    bodyPlacement: "ساعد راست",
    budget: 10000000n,
    preferredStartDate: at(20),
    isFlexibleWithDate: false,
    quotedPrice: 12000000n,
    quoteNotes: "پرتره واقعی با جزئیات بالا، نیاز به ۲ جلسه",
    quoteExpiry: at(25),
    status: "ACCEPTED",
    rejectionReason: null,
    bookingId: "bkg_4",
    createdAt: ago(6),
    updatedAt: ago(4),
  },
  {
    id: "crq_3",
    clientId: "usr_client_4",
    artistId: "ap_5",
    title: "طرح تریبل روی ساق",
    description: "طرح تریبل با الهام از هنر مائوری روی ساق پا.",
    referenceImages: [],
    preferredSize: "LARGE",
    preferredStyle: "TRIBAL",
    bodyPlacement: "ساق پا",
    budget: 9000000n,
    preferredStartDate: at(15),
    isFlexibleWithDate: true,
    quotedPrice: null,
    quoteNotes: null,
    quoteExpiry: null,
    status: "UNDER_REVIEW",
    rejectionReason: null,
    bookingId: null,
    createdAt: ago(2),
    updatedAt: ago(1),
  },
  {
    id: "crq_4",
    clientId: "usr_client_7",
    artistId: "ap_4",
    title: "دسته گل رنگی روی شانه",
    description: "دسته گل واتروکالر با رنگ‌های گرم.",
    referenceImages: [],
    preferredSize: "MEDIUM",
    preferredStyle: "WATERCOLOR",
    bodyPlacement: "شانه چپ",
    budget: 5000000n,
    preferredStartDate: at(9),
    isFlexibleWithDate: true,
    quotedPrice: null,
    quoteNotes: null,
    quoteExpiry: null,
    status: "NEW",
    rejectionReason: null,
    bookingId: null,
    createdAt: ago(0, 6),
    updatedAt: ago(0, 6),
  },
];

const savedPortfolio = [
  { id: "sp_1", userId: "usr_client_1", portfolioItemId: "pf_3", createdAt: ago(12) },
  { id: "sp_2", userId: "usr_client_1", portfolioItemId: "pf_5", createdAt: ago(8) },
  { id: "sp_3", userId: "usr_client_1", portfolioItemId: "pf_6", createdAt: ago(4) },
  { id: "sp_4", userId: "usr_client_2", portfolioItemId: "pf_4", createdAt: ago(9) },
  { id: "sp_5", userId: "usr_client_3", portfolioItemId: "pf_7", createdAt: ago(7) },
  { id: "sp_6", userId: "usr_client_4", portfolioItemId: "pf_8", createdAt: ago(6) },
  { id: "sp_7", userId: "usr_client_5", portfolioItemId: "pf_2", createdAt: ago(5) },
  { id: "sp_8", userId: "usr_client_6", portfolioItemId: "pf_1", createdAt: ago(3) },
];

const portfolioLikes = [
  { id: "pl_1", userId: "usr_client_1", portfolioItemId: "pf_1", createdAt: ago(10) },
  { id: "pl_2", userId: "usr_client_1", portfolioItemId: "pf_4", createdAt: ago(7) },
  { id: "pl_3", userId: "usr_client_2", portfolioItemId: "pf_6", createdAt: ago(6) },
  { id: "pl_4", userId: "usr_client_3", portfolioItemId: "pf_8", createdAt: ago(5) },
  { id: "pl_5", userId: "usr_client_4", portfolioItemId: "pf_3", createdAt: ago(4) },
];

const flashLikes = [
  { id: "flk_1", userId: "usr_client_1", flashTattooId: "fl_1", createdAt: ago(8) },
  { id: "flk_2", userId: "usr_client_2", flashTattooId: "fl_3", createdAt: ago(6) },
  { id: "flk_3", userId: "usr_client_3", flashTattooId: "fl_5", createdAt: ago(4) },
  { id: "flk_4", userId: "usr_client_5", flashTattooId: "fl_4", createdAt: ago(2) },
];

const artistFollowers = [
  { id: "af_1", userId: "usr_client_1", artistProfileId: "ap_1", createdAt: ago(30) },
  { id: "af_2", userId: "usr_client_1", artistProfileId: "ap_2", createdAt: ago(28) },
  { id: "af_3", userId: "usr_client_1", artistProfileId: "ap_5", createdAt: ago(20) },
  { id: "af_4", userId: "usr_client_2", artistProfileId: "ap_2", createdAt: ago(25) },
  { id: "af_5", userId: "usr_client_2", artistProfileId: "ap_5", createdAt: ago(22) },
  { id: "af_6", userId: "usr_client_3", artistProfileId: "ap_3", createdAt: ago(18) },
  { id: "af_7", userId: "usr_client_3", artistProfileId: "ap_4", createdAt: ago(15) },
  { id: "af_8", userId: "usr_client_4", artistProfileId: "ap_5", createdAt: ago(12) },
  { id: "af_9", userId: "usr_client_5", artistProfileId: "ap_1", createdAt: ago(10) },
  { id: "af_10", userId: "usr_client_5", artistProfileId: "ap_3", createdAt: ago(8) },
  { id: "af_11", userId: "usr_client_6", artistProfileId: "ap_1", createdAt: ago(6) },
  { id: "af_12", userId: "usr_client_7", artistProfileId: "ap_2", createdAt: ago(4) },
];

// ============================================================================
// تنظیمات سیستم
// ============================================================================

const settingsValues: Record<string, string> = {
  PLATFORM_NAME: "نوبت مارکت",
  PLATFORM_DESCRIPTION: "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران",
  ACTIVE_FONT: "SAHEL",
  REGISTRATION_ENABLED: "true",
  BOOKINGS_ENABLED: "true",
  PORTFOLIO_PUBLIC: "true",
  DEFAULT_COMMISSION_PERCENT: "15",
  DEPOSIT_PERCENT: "30",
  REQUIRE_DEPOSIT: "true",
  MIN_BOOKING_PRICE: "500000",
  MAX_BOOKING_PRICE: "100000000",
  MIN_WITHDRAWAL: "1000000",
  AUTO_PAYOUT: "false",
  FLASH_COMMISSION: "20",
  CANCELLATION_HOURS: "24",
  ALLOW_RESCHEDULE: "true",
  MAX_PENDING_BOOKINGS: "3",
  PAYMENT_MODE: "mock",
  ZARINPAL_MERCHANT_ID: "demo-merchant-id",
  ZARINPAL_SANDBOX: "true",
  ZARINPAL_CALLBACK_URL: "",
  SMS_ENABLED: "false",
  MELI_USERNAME: "demo",
  MELI_PASSWORD: "demo",
  MELI_SENDER_NUMBER: "10008466",
  MELI_API_KEY: "",
  RESEND_API_KEY: "",
  EMAIL_FROM: "noreply@nobat-market.com",
  NOTIFICATIONS_ENABLED: "true",
  PUSH_NOTIFICATIONS: "true",
  NOTIFY_ADMIN_ON_BOOKING: "true",
  INSTAGRAM_URL: "https://instagram.com/nobatmarket",
  TELEGRAM_URL: "https://t.me/nobatmarket",
  WHATSAPP_URL: "https://wa.me/989120000000",
  APARAT_URL: "https://aparat.com/nobatmarket",
  TWITTER_URL: "",
  SUPPORT_PHONE: "021-12345678",
  SUPPORT_EMAIL: "support@nobat-market.com",
  OFFICE_ADDRESS: "تهران، خیابان ولیعصر، برج نگین، طبقه ۵",
  CONTACT_TITLE: "با نوبت مارکت در تماس باشید",
  CONTACT_SUBTITLE: "پاسخگوی سؤال‌های شما درباره رزرو، پرداخت و همکاری هستیم",
  CONTACT_DESC: "تیم پشتیبانی نوبت مارکت در روزهای کاری از ساعت ۹ تا ۱۸ پاسخگوی شماست.",
  CONTACT_PHONE: "021-12345678",
  CONTACT_EMAIL: "support@nobat-market.com",
  CONTACT_ADDRESS: "تهران، خیابان ولیعصر، برج نگین، طبقه ۵",
  CONTACT_HOURS: "شنبه تا چهارشنبه ۹:۰۰ تا ۱۸:۰۰",
  CONTACT_FAQ: "پیش از تماس، بخش سوالات متداول را ببینید؛ شاید پاسخ سؤالتان همان‌جا باشد.",
  CONTACT_FORM_TITLE: "فرم تماس",
  CONTACT_FORM_SUBTITLE: "پیام‌تان را بنویسید؛ حداکثر تا یک روز کاری پاسخ می‌دهیم",
  CONTACT_RESPONSE_TITLE: "پاسخ سریع",
  CONTACT_RESPONSE_TEXT: "میانگین زمان پاسخ‌گویی ما کمتر از ۲۴ ساعت است.",
  MAINTENANCE_MODE: "false",
  DEBUG_MODE: "false",
  rateLimitEnabled: "false",
  SESSION_EXPIRY_DAYS: "30",
  MAX_SESSIONS: "3",
  RATING_CALC_INTERVAL: "24",
  MAX_UPLOAD_SIZE_MB: "10",
  ALLOWED_IMAGE_TYPES: "jpg,jpeg,png,webp",
  BLOG_ENABLED: "true",
  BLOG_POSTS_PER_PAGE: "6",
  MAGAZINE_FEATURED_POSTS: "3",
  FLASH_ENABLED: "true",
  FLASH_PAGE_ENABLED: "true",
  FLASH_SALE_DAYS: "30",
  MAX_FLASH_PER_ARTIST: "10",
  INSPIRATION_ENABLED: "true",
  STUDIOS_ENABLED: "true",
  CHAT_LINKS_ALLOWED: "false",
  CHAT_FILE_UPLOAD_ENABLED: "true",
  HOME_FEATURED_ARTISTS: "6",
  HOME_FEATURED_COUNT: "6",
  SEO_DEFAULT_TITLE: "نوبت مارکت | پلتفرم رزرو نوبت ایران",
  SEO_DEFAULT_DESCRIPTION: "با نوبت مارکت ارائه‌دهنده خدمات مناسب خود را بر اساس نوع کسب‌وکار، شهر و امتیاز پیدا کنید و آنلاین رزرو کنید.",
  SEO_KEYWORDS: "رزرو نوبت, نوبت آنلاین, رزرو وقت, کسب‌وکار, سالن زیبایی, آرایشگر",
  GOOGLE_SITE_VERIFICATION: "",
  GOOGLE_ANALYTICS_ID: "",
  GTM_ID: "",
  CUSTOM_ROBOTS_TXT: "",
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
};

const systemSettings = Object.entries(settingsValues).map(([key, value], i) => ({
  id: `set_${i + 1}`,
  key,
  value,
  description: null,
  updatedAt: ago(i % 7),
}));

// ============================================================================
// ساخت کل جدول‌ها
// ============================================================================

export function buildTables(): Tables {
  return {
    user: users as any,
    passwordHistory: [],
    artistProfile: artistProfiles as any,
    artistFollower: artistFollowers as any,
    savedPortfolio: savedPortfolio as any,
    portfolioLike: portfolioLikes as any,
    flashLike: flashLikes as any,
    studio: studios as any,
    studioArtist: studioArtists as any,
    service: services as any,
    portfolioItem: portfolioItems as any,
    flashTattoo: flashTattoos as any,
    availability: availability as any,
    timeOff: timeOffs as any,
    booking: bookings as any,
    customRequest: customRequests as any,
    payment: payments as any,
    review: reviews as any,
    wallet: wallets as any,
    transaction: transactions as any,
    withdrawalRequest: withdrawalRequests as any,
    conversation: conversations as any,
    conversationParticipant: conversationParticipants as any,
    message: messages as any,
    notification: notifications as any,
    notificationReply: notificationReplies as any,
    cmsPage: cmsPages as any,
    waitlist: waitlist as any,
    blogPost: blogPosts as any,
    blogComment: blogComments as any,
    commentReaction: commentReactions as any,
    clientNote: clientNotes as any,
    systemSetting: systemSettings as any,
    auditLog: auditLogs as any,
    contactMessage: contactMessages as any,
    newsletterSubscriber: newsletterSubscribers as any,
    searchIndex: [],
  };
}

/** خواندن سریع یک تنظیم بدون کوئری (برای ماژول‌های زیرساختی) */
export function settingsMap(): Record<string, string> {
  return { ...settingsValues };
}
