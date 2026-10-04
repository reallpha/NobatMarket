// ============================================================================
// اسکریپت ساخت ۱۰ هنرمند تستی - نوبت مارکت
// ============================================================================
// اجرا: DATABASE_URL="postgresql://nobat-market:nobat_market_secret@localhost:5432/nobat_market" npx tsx prisma/seed-artists.ts
// ============================================================================

import { PrismaClient, UserRole, UserStatus, TattooStyle, PortfolioStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ARTISTS = [
  {
    user: {
      phone: "09011111111", email: "nika.tattoo@gmail.com",
      displayName: "نیکا تتو", firstName: "نیکا", lastName: "محمدی",
      city: "تهران", province: "تهران",
      avatarUrl: "https://picsum.photos/seed/avatar-nika/200/200",
    },
    profile: {
      artistName: "نیکا استودیو", slug: "nika-studio",
      shortBio: "متخصص تتوهای مینیمال و فاین‌لاین با جزئیات بی‌نظیر",
      fullBio: "نیکا هستم، هنرمند تتو از تهران. بیش از ۵ سال تجربه در سبک‌های مینیمال و فاین‌لاین دارم. هر خط برایم معنایی دارد و تلاش می‌کنم ظریف‌ترین و دقیق‌ترین آثار را خلق کنم. مشتریانم معمولاً به دنبال تتوهای کوچک و معنادار هستند.",
      experienceYears: 5, specializations: [TattooStyle.MINIMAL, TattooStyle.LINE_ART, TattooStyle.FINE_LINE],
      minPrice: BigInt(800000), maxPrice: BigInt(6000000),
      averageSessionDuration: 90, completedBookings: 134, followerCount: 8900,
      satisfactionScore: 96.2, isVerified: true,
      instagramUrl: "https://instagram.com/nika.tattoo",
    },
  },
  {
    user: {
      phone: "09022222222", email: "dara.ink@gmail.com",
      displayName: "دارا اینک", firstName: "دارا", lastName: "احمدی",
      city: "مشهد", province: "خراسان رضوی",
      avatarUrl: "https://picsum.photos/seed/avatar-dara/200/200",
    },
    profile: {
      artistName: "دارا آرت", slug: "dara-art",
      shortBio: "هنرمند رئالیسم و پرتره از مشهد",
      fullBio: "دارا احمدی هستم، هنرمند تتو از مشهد. تخصص من در سبک رئالیسم و پرتره است. با الهام از هنر کلاسیک و مدرن، آثار واقع‌گرایانه‌ای خلق می‌کنم که نفس را در سینه حبس می‌کند. هر پرتره داستانی دارد.",
      experienceYears: 10, specializations: [TattooStyle.REALISM, TattooStyle.BLACK_AND_GREY, TattooStyle.COLOR],
      minPrice: BigInt(4000000), maxPrice: BigInt(20000000),
      averageSessionDuration: 180, completedBookings: 267, followerCount: 22000,
      satisfactionScore: 97.8, isVerified: true,
      instagramUrl: "https://instagram.com/dara.ink",
    },
  },
  {
    user: {
      phone: "09033333333", email: "yasna.design@gmail.com",
      displayName: "یاسنا دیزاین", firstName: "یاسنا", lastName: "کاظمی",
      city: "اصفهان", province: "اصفهان",
      avatarUrl: "https://picsum.photos/seed/avatar-ziba/200/200",
    },
    profile: {
      artistName: "یاسنا کریتیو", slug: "yasna-creative",
      shortBio: "خالق تتوهای ژئومتریک و سیمبلیک با الهام از معماری ایرانی",
      fullBio: "یاسنا کاظمی هستم، هنرمند تتو از اصفهان. با الهام از معماری اصیل اصفهان و هنرهای اسلامی، طرح‌هایی منحصربفرد خلق می‌کنم. تخصص من در سبک‌های ژئومتریک، داتورک و سیمبلیک است.",
      experienceYears: 6, specializations: [TattooStyle.GEOMETRIC, TattooStyle.DOTWORK, TattooStyle.ABSTRACT],
      minPrice: BigInt(1200000), maxPrice: BigInt(8000000),
      averageSessionDuration: 140, completedBookings: 98, followerCount: 6500,
      satisfactionScore: 93.5, isVerified: true,
      instagramUrl: "https://instagram.com/yasna.creative",
    },
  },
  {
    user: {
      phone: "09044444444", email: "kian.black@gmail.com",
      displayName: "کیان بلک", firstName: "کیان", lastName: "فاطمی",
      city: "تبریز", province: "آذربایجان شرقی",
      avatarUrl: "https://picsum.photos/seed/avatar-parsa/200/200",
    },
    profile: {
      artistName: "کیان بلک‌ورک", slug: "kian-blackwork",
      shortBio: "استاد بلک‌ورک و ژاپنی از تبریز",
      fullBio: "کیان فاطمی هستم، هنرمند تتو از تبریز. بیش از ۸ سال تجربه در سبک‌های بلک‌ورک و ژاپنی دارم. الهام‌بخش من فرهنگ ژاپنی و هنرهای سنتی آذربایجان است. هر تتو با دقت فراوان و با رعایت اصول بهداشتی اجرا می‌شود.",
      experienceYears: 8, specializations: [TattooStyle.BLACKWORK, TattooStyle.JAPANESE, TattooStyle.TRIBAL],
      minPrice: BigInt(2500000), maxPrice: BigInt(15000000),
      averageSessionDuration: 170, completedBookings: 189, followerCount: 11200,
      satisfactionScore: 95.1, isVerified: true,
      instagramUrl: "https://instagram.com/kian.blackwork",
    },
  },
  {
    user: {
      phone: "09055555555", email: "sogand.flower@gmail.com",
      displayName: "سوسن گل", firstName: "سوسن", lastName: "گل",
      city: "شیراز", province: "فارس",
      avatarUrl: "https://picsum.photos/seed/avatar-yasna/200/200",
    },
    profile: {
      artistName: "سوسن آرتس", slug: "sogand-arts",
      shortBio: "خالق تتوهای واتروکالر و فلورال",
      fullBio: "سوسن هستم، هنرمند تتو از شیراز. علاقه‌ام به رنگ‌ها و طبیعت باعث شد در سبک واتروکالر تخصص پیدا کنم. هر تتو من مثل یک تابلوی نقاشی است.",
      experienceYears: 3, specializations: [TattooStyle.WATERCOLOR, TattooStyle.COLOR, TattooStyle.MINIMAL],
      minPrice: BigInt(800000), maxPrice: BigInt(5000000),
      averageSessionDuration: 100, completedBookings: 45, followerCount: 3200,
      satisfactionScore: 91.0, isVerified: false,
      instagramUrl: "https://instagram.com/sogand.art",
    },
  },
  {
    user: {
      phone: "09066666666", email: "parsa.needle@gmail.com",
      displayName: "پارسا رحیمی", firstName: "پارسا", lastName: "رحیمی",
      city: "کرج", province: "البرز",
      avatarUrl: "https://picsum.photos/seed/avatar-ramin/200/200",
    },
    profile: {
      artistName: "پارسا تتو", slug: "parsa-tattoo",
      shortBio: "هنرمند نئو تریدیشنال و اولداسکول",
      fullBio: "پارسا رحیمی هستم، هنرمند تتو از کرج. تخصص من در سبک‌های نئو تریدیشنال و اولداسکول است. ترکیب رنگ‌های زنده و خطوط قوی، امضای من است.",
      experienceYears: 7, specializations: [TattooStyle.NEO_TRADITIONAL, TattooStyle.OLD_SCHOOL, TattooStyle.COLOR],
      minPrice: BigInt(2000000), maxPrice: BigInt(12000000),
      averageSessionDuration: 150, completedBookings: 167, followerCount: 9800,
      satisfactionScore: 94.3, isVerified: true,
      instagramUrl: "https://instagram.com/parsa.tattoo",
    },
  },
  {
    user: {
      phone: "09077777777", email: "elnaz.ink@gmail.com",
      displayName: "الناز اینک", firstName: "الناز", lastName: "سعیدی",
      city: "کرمان", province: "کرمان",
      avatarUrl: "https://picsum.photos/seed/avatar-elnaz/200/200",
    },
    profile: {
      artistName: "الناز استودیو", slug: "elnaz-studio",
      shortBio: "متخصص لاین آرت و مینیمال",
      fullBio: "الناز سعیدی هستم، هنرمند تتو از کرمان. تخصص من در لاین آرت و مینیمال است. خطوط تمیز و ظریف، ویژگی بارز کارهای من است.",
      experienceYears: 4, specializations: [TattooStyle.LINE_ART, TattooStyle.MINIMAL, TattooStyle.FINE_LINE],
      minPrice: BigInt(600000), maxPrice: BigInt(4000000),
      averageSessionDuration: 80, completedBookings: 78, followerCount: 4100,
      satisfactionScore: 92.7, isVerified: false,
      instagramUrl: "https://instagram.com/elnaz.ink",
    },
  },
  {
    user: {
      phone: "09088888888", email: "mehdi.dark@gmail.com",
      displayName: "مهدی دارک", firstName: "مهدی", lastName: "علی",
      city: "اهواز", province: "خوزستان",
      avatarUrl: "https://picsum.photos/seed/avatar-parsa/200/200",
    },
    profile: {
      artistName: "مهدی دارک‌آرت", slug: "mehdi-darkart",
      shortBio: "هنرمند بلک‌ورک و داتورک",
      fullBio: "مهدی هستم، هنرمند تتو از اهواز. بیش از ۶ سال تجربه در بلک‌ورک و داتورک دارم. الهام‌بخش من هنرهای بومی و فرهنگ جنوب ایران است.",
      experienceYears: 6, specializations: [TattooStyle.BLACKWORK, TattooStyle.DOTWORK, TattooStyle.GEOMETRIC],
      minPrice: BigInt(1500000), maxPrice: BigInt(10000000),
      averageSessionDuration: 160, completedBookings: 123, followerCount: 7600,
      satisfactionScore: 93.9, isVerified: true,
      instagramUrl: "https://instagram.com/mehdi.darkart",
    },
  },
  {
    user: {
      phone: "09099999999", email: "ramin.old@gmail.com",
      displayName: "رامین رستمی", firstName: "رامین", lastName: "رستمی",
      city: "رشت", province: "گیلان",
      avatarUrl: "https://picsum.photos/seed/avatar-ramin/200/200",
    },
    profile: {
      artistName: "رامین کلاسیک", slug: "ramin-classic",
      shortBio: "متخصص اولداسکول و ترایبال",
      fullBio: "رامین هستم، هنرمند تتو از رشت. علاقه‌ام به هنر کلاسیک غربی و هنرهای بومی ایران باعث شد در سبک‌های اولداسکول و ترایبال تخصص پیدا کنم.",
      experienceYears: 9, specializations: [TattooStyle.OLD_SCHOOL, TattooStyle.TRIBAL, TattooStyle.COLOR],
      minPrice: BigInt(2000000), maxPrice: BigInt(14000000),
      averageSessionDuration: 140, completedBookings: 210, followerCount: 13400,
      satisfactionScore: 96.0, isVerified: true,
      instagramUrl: "https://instagram.com/ramin.classic",
    },
  },
  {
    user: {
      phone: "09000000000", email: "ziba.arts@gmail.com",
      displayName: "زیبا حسینی", firstName: "زیبا", lastName: "حسینی",
      city: "یزد", province: "یزد",
      avatarUrl: "https://picsum.photos/seed/avatar-ziba/200/200",
    },
    profile: {
      artistName: "زیبا استودیو", slug: "ziba-studio",
      shortBio: "هنرمند ژئومتریک و آبستره",
      fullBio: "زیبا هستم، هنرمند تتو از یزد. تخصص من در ژئومتریک و آبستره است. با الهام از هنر معماری یزد و بادگیرهای تاریخی، طرح‌های منحصربفردی خلق می‌کنم.",
      experienceYears: 4, specializations: [TattooStyle.GEOMETRIC, TattooStyle.ABSTRACT, TattooStyle.MINIMAL],
      minPrice: BigInt(900000), maxPrice: BigInt(6500000),
      averageSessionDuration: 120, completedBookings: 67, followerCount: 3800,
      satisfactionScore: 92.1, isVerified: false,
      instagramUrl: "https://instagram.com/ziba.studio",
    },
  },
];

// نمونه تصاویر پورتفولیو (از Unsplash)
const PORTFOLIO_IMAGES = [
  "https://picsum.photos/seed/tattoo1/600/600",
  "https://picsum.photos/seed/tattoo2/600/600",
  "https://picsum.photos/seed/tattoo3/600/600",
  "https://picsum.photos/seed/tattoo4/600/600",
  "https://picsum.photos/seed/tattoo5/600/600",
  "https://picsum.photos/seed/tattoo6/600/600",
  "https://picsum.photos/seed/tattoo7/600/600",
  "https://picsum.photos/seed/tattoo8/600/600",
  "https://picsum.photos/seed/tattoo9/600/600",
  "https://picsum.photos/seed/tattoo10/600/600",
];

async function main() {
  console.log("🎨 شروع ساخت ۱۰ هنرمند تستی...\n");

  const passwordHash = await bcrypt.hash("artist123", 12);
  let created = 0;

  for (const artist of ARTISTS) {
    try {
      // بررسی وجود کاربر
      const existing = await prisma.user.findUnique({
        where: { phone: artist.user.phone },
      });
      if (existing) {
        console.log(`  ⏭️  ${artist.user.displayName} قبلاً وجود دارد`);
        continue;
      }

      // ساخت کاربر
      const user = await prisma.user.create({
        data: {
          ...artist.user,
          passwordHash,
          role: UserRole.ARTIST,
          status: UserStatus.ACTIVE,
          preferredLanguage: "fa",
        },
      });

      // ساخت پروفایل هنرمند
      const profile = await prisma.artistProfile.create({
        data: {
          userId: user.id,
          ...artist.profile,
          isAcceptingBookings: true,
          acceptsCustomRequests: true,
          platformFeePercent: 15.0,
          totalEarnings: BigInt(0),
        },
      });

      // ساخت ۳-۵ نمونه پورتفولیو برای هر هنرمند
      const portfolioCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < portfolioCount; i++) {
        const style = artist.profile.specializations[i % artist.profile.specializations.length];
        const imgIndex = (created * 3 + i) % PORTFOLIO_IMAGES.length;
        await prisma.portfolioItem.create({
          data: {
            artistProfileId: profile.id,
            title: `نمونه‌کار ${i + 1} - ${artist.profile.artistName}`,
            description: `نمونه‌کار تتو در سبک ${style}`,
            images: [PORTFOLIO_IMAGES[imgIndex]],
            style,
            size: (["SMALL", "MEDIUM", "LARGE"] as const)[i % 3] as any,
            durationMinutes: 60 + i * 30,
            price: artist.profile.minPrice + BigInt(i * 500000),
            tags: [style.toLowerCase(), "tattoo"],
            likeCount: Math.floor(Math.random() * 500),
            saveCount: Math.floor(Math.random() * 200),
            status: PortfolioStatus.PUBLISHED,
            sortOrder: i,
            publishedAt: new Date(),
          },
        });
      }

      created++;
      console.log(`  ✅ ${artist.profile.artistName} (${artist.user.city}) - ${portfolioCount} نمونه‌کار`);
    } catch (err: any) {
      console.error(`  ❌ خطا در ساخت ${artist.user.displayName}:`, err.message);
    }
  }

  console.log(`\n🎨 ${created} هنرمند جدید با موفقیت ایجاد شد`);
  console.log("🔑 رمز عبور همه: artist123");
}

main()
  .catch((e) => {
    console.error("خطا:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
