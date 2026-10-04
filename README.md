# نوبت مارکت (NOBAT_MARKET) 🎨

**پلتفرم بازار و رزرو تتو در ایران**

نوبت مارکت یک پلتفرم جامع برای اتصال هنرمندان تتو با مشتریان است. این پروژه با استفاده از جدیدترین تکنولوژی‌های وب ساخته شده و تمام نیازهای یک کسب‌وکار SaaS در حوزه تتو را پوشش می‌دهد.

---

## 💎 چرا نوبت مارکت ارزشمند است؟ (نکات فروش)

- **کامل‌ترین پلتفرم تتو در ایران:** از کشف هنرمند تا پرداخت و مراقبت بعد از تتو
- **امنیت بانکی:** پرداخت از طریق زرین‌پال، احراز هویت OTP، رمزنگاری JWT
- **طراحی پریمیوم:** رابط کاربری تاریک و زیبا با Tailwind CSS و Shadcn UI
- **عملکرد بالا:** Next.js 14 App Router، بهینه‌سازی تصویر با Sharp، کش Redis
- **SEO قوی:** Sitemap پویا، متادیتای OpenGraph، ساختار URL بهینه
- **قابل توسعه:** کد TypeScript تمیز، معماری ماژولار، آماده مقیاس‌پذیری
- **پشتیبانی RTL:** کاملترین پشتیبانی از زبان فارسی و راست به چپ
- **داشبورد مدیریت:** آمار، تحلیل، مدیریت کاربران و محتوا

---

## ✨ امکانات کلیدی

### برای مشتریان
- 🔍 جستجوی پیشرفته هنرمندان با فیلتر سبک، شهر، قیمت و امتیاز
- 📅 رزرو آنلاین با تقویم تعاملی
- 💳 پرداخت امن از طریق درگاه زرین‌پال
- 💬 چت مستقیم با هنرمندان
- ⭐ ثبت نظر و امتیاز
- 📌 ذخیره نمونه‌کارهای مورد علاقه

### برای هنرمندان
- 📊 داشبورد مدیریت رزروها
- 🖼️ مدیریت نمونه‌کارها و تتوهای فلش
- ⏰ تنظیم برنامه کاری و زمان‌های در دسترس
- 💰 کیف پول و مدیریت درآمد
- 📨 دریافت درخواست‌های سفارشی

### برای مدیران
- 📈 داشبورد آمار و تحلیل
- 👥 مدیریت کاربران و پلن‌ها
- 📝 مدیریت محتوا (CMS)
- 💸 مدیریت پرداخت‌ها و برداشت‌ها

---

## 🛠️ تکنولوژی‌ها

| لایه | تکنولوژی |
|---|---|
| **فرانت‌اند** | Next.js 14 (App Router) + React 18 + TypeScript |
| **استایل** | Tailwind CSS + Shadcn UI |
| **بک‌اند** | Next.js Server Actions + Prisma ORM |
| **دیتابیس** | PostgreSQL + Redis |
| **احراز هویت** | NextAuth v4 (OTP + JWT) |
| **پرداخت** | زرین‌پال |
| **آپلود تصویر** | Sharp (پردازش سمت سرور) + Storage Local/S3 |
| **اعلان‌ها** | Kavehnegar (SMS) + Resend (Email) [Stub] |

---

## 📋 پیش‌نیازها

- **Node.js** 18.17+ (ترجیحاً 20 LTS)
- **PostgreSQL** 14+
- **Redis** 6+ (اختیاری برای MVP)
- **npm** یا **yarn**

---

## 🚀 راه‌اندازی محلی

### ۱. کلون کردن پروژه

```bash
git clone https://github.com/your-repo/nobat-market.git
cd nobat-market
```

### ۲. نصب وابستگی‌ها

```bash
npm install
```

### ۳. پیکربندی متغیرهای محیطی

```bash
cp .env.example .env
```

فایل `.env` را ویرایش کنید:

```env
# دیتابیس
DATABASE_URL="postgresql://user:password@localhost:5432/nobat_market"

# NextAuth
NEXTAUTH_SECRET="یک رشته تصادفی حداقل ۳۲ کاراکتر"
NEXTAUTH_URL="http://localhost:3000"

# Redis (اختیاری)
REDIS_URL="redis://localhost:6379"

# زرین‌پال (اختیاری برای توسعه)
PAYMENT_MODE="mock"
ZARINPAL_MERCHANT_ID=""

# آدرس اپلیکیشن
APP_URL="http://localhost:3000"
```

### ۴. راه‌اندازی دیتابیس

```bash
# ایجاد دیتابیس و اعمال اسکیما
npx prisma db push

# پر کردن دیتابیس با داده‌های نمونه
npm run db:seed
```

### ۵. اجرای پروژه

```bash
npm run dev
```

پروژه در `http://localhost:3000` اجرا می‌شود.

---

## 📁 ساختار پروژه

```
src/
├── app/
│   ├── (public)/          # صفحات عمومی (بدون احراز هویت)
│   │   ├── artists/       # پروفایل هنرمندان
│   │   ├── flash/         # تتوهای فلش
│   │   ├── inspiration/   # گالری الهام
│   │   └── page/[slug]/   # صفحات CMS
│   ├── (client)/          # پنل مشتری
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── messages/
│   │   └── notifications/
│   ├── (artist)/          # پنل هنرمند
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   ├── flash/
│   │   ├── availability/
│   │   └── bookings/
│   ├── (admin)/           # پنل مدیریت
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── bookings/
│   │   ├── finance/
│   │   └── cms/
│   └── api/               # API routes
├── components/
│   ├── ui/                # کامپوننت‌های Shadcn
│   ├── features/          # کامپوننت‌های بیزینس
│   └── layout/            # کامپوننت‌های لایوت
├── lib/                   # توابع کمکی
├── services/              # Server Actions
├── types/                 # تایپ‌های TypeScript
└── constants/             # ثابت‌ها
```

---

## 🔧 دستورات مفید

```bash
# توسعه
npm run dev              # اجرای سرور توسعه
npm run build            # بیلد پروژه
npm run start            # اجرای پروژه بیلد شده
npm run lint             # بررسی کد
npm run typecheck        # بررسی تایپ

# دیتابیس
npm run db:generate      # تولید کلاینت Prisma
npm run db:push          # اعمال اسکیما به دیتابیس
npm run db:seed          # پر کردن با داده نمونه
npm run db:studio        # باز کردن Prisma Studio
npm run db:reset         # ریست کامل دیتابیس

# Docker
npm run docker:up        # اجرای Docker Compose
npm run docker:down      # توقف Docker Compose
```

---

## 📝 راهنمای نصب فونت‌ها

### فونت‌های مورد نیاز

| فونت | لینک دانلود | استفاده |
|------|------------|--------|
| **ساحل** | [دانلود](https://github.com/rastikerdar/sahel-font/releases) | فونت پیش‌فرض |
| **وزیرمتن** | [دانلود](https://github.com/rastikerdar/vazirmatn/releases) | فونت جایگزین |
| **لاله‌زار** | [دانلود](https://fonts.google.com/specimen/Lalezar) | فونت تیترها |

### مراحل نصب

```bash
# ۱. ایجاد دایرکتوری فونت
mkdir -p public/fonts

# ۲. فایل‌های .woff2 را دانلود و در public/fonts/ قرار دهید:
#    - public/fonts/sahel.woff2
#    - public/fonts/vazirmatn.woff2
#    - public/fonts/lalezar.woff2

# ۳. پروژه را مجدداً اجرا کنید
npm run dev
```

### تغییر فونت از پنل مدیریت

به `admin/settings` بروید و فونت مورد نظر را انتخاب کنید.

---

## 📄 مجوز

این پروژه مخصوص استفاده نوبت مارکت است و مجوز عمومی ندارد.

---

## 📞 پشتیبانی

برای هرگونه سوال یا مشکل، با تیم پشتیبانی نوبت مارکت تماس بگیرید.
