import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { faqPageSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { getDepositPercent } from "@/lib/booking-rules";
import { toPersianNumbers } from "@/lib/utils";

export const metadata: Metadata = {
  title: "سوالات متداول | نوبت مارکت",
  description:
    "پاسخ تمام سوالات شما درباره نوبت مارکت، پلتفرم رزرو نوبت در ایران. از نحوه رزرو تا مراقبت بعد از خدمت.",
  openGraph: {
    title: "سوالات متداول | نوبت مارکت",
    description: "پاسخ تمام سوالات شما درباره نوبت مارکت",
    url: "https://nobat-market.com/faq",
  },
};

// ─── دسته‌بندی سوالات ───
// درصد بیعانه از تنظیمات ادمین خوانده می‌شود؛ این توکن در زمان رندر جایگزین می‌گردد
// تا پاسخ FAQ همیشه با مقدار واقعی پنل مدیریت یکی باشد.
const DEPOSIT_TOKEN = "__DEPOSIT_PERCENT__";

const sections = [
  {
    id: "general",
    title: "نوبت مارکت چیست؟",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "rose",
    faqs: [
      {
        q: "نوبت مارکت چیست و چه کار می‌کند؟",
        a: "نوبت مارکت بزرگترین پلتفرم بازار و رزرو آنلاین تتو در ایران است. ما هنرمندان حرفه‌ای تتو را با افرادی که به دنبال تتوی با کیفیت هستند متصل می‌کنیم. شما می‌توانید هنرمندان را بر اساس سبک، شهر، قیمت و امتیاز جستجو کنید، نمونه‌کار ببینید و به‌صورت آنلاین وقت رزرو کنید.",
      },
      {
        q: "آیا استفاده از نوبت مارکت رایگان است؟",
        a: "بله! ثبت‌نام، جستجوی هنرمند، مشاهده نمونه‌کارها و مقایسه قیمت‌ها کاملاً رایگان است. شما فقط هزینه خود تتو را مستقیماً به هنرمند پرداخت می‌کنید و هیچ هزینه اضافی بابت استفاده از پلتفرم ندارید.",
      },
      {
        q: "نوبت مارکت در چه شهرهایی فعال است؟",
        a: "نوبت مارکت در بیش از ۳۰ شهر بزرگ ایران از جمله تهران، شیراز، اصفهان، تبریز، مشهد، اهواز، رشت، کرج و... فعال است. لیست کامل شهرها را می‌توانید در بخش جستجو مشاهده کنید.",
      },
      {
        q: "چرا باید از نوبت مارکت استفاده کنم به جای پیدا کردن هنرمند در اینستاگرام؟",
        a: "در نوبت مارکت می‌توانید هنرمندان را مقایسه کنید، امتیاز و نظرات واقعی مشتریان را ببینید، قیمت‌ها را بسنجید و به‌صورت آنلاین وقت رزرو کنید — بدون نیاز به پیام دادن در دایرکت و منتظر ماندن برای پاسخ. همچنین پرداخت و پشتیبانی نوبت مارکت تضمین می‌کند.",
      },
    ],
  },
  {
    id: "booking",
    title: "نحوه رزرو",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "amber",
    faqs: [
      {
        q: "چگونه می‌توانم هنرمند مناسب خودم را پیدا کنم؟",
        a: "از بخش جستجوی صفحه اصلی می‌توانید بر اساس نام هنرمند، سبک تتو (رئالیسم، مینیمال، بلک‌ورک و...)، شهر و محدوده قیمت جستجو کنید. همچنین بخش «الهام‌بخش» نمونه‌کارهای واقعی هنرمندان را نمایش می‌دهد.",
      },
      {
        q: "مراحل رزرو چگونه است؟",
        a: "۱) هنرمند مورد نظر را پیدا کنید. ۲) سرویس مورد نظر (سایز، سبک، ناحیه بدن) را انتخاب کنید. ۳) تاریخ و ساعت دلخواه را انتخاب کنید. ۴) بیعانه را آنلاین پرداخت کنید. ۵) هنرمند درخواست شما را بررسی و تأیید می‌کند. ۶) پس از تأیید، رزرو شما قطعی است.",
      },
      {
        q: "بیعانه چقدر است؟",
        a: `بیعانه ${DEPOSIT_TOKEN}٪ هزینه کل تتو است و همان سهم پلتفرم محسوب می‌شود. این مبلغ از طریق درگاه پرداخت زرین‌پال به‌صورت آنلاین و امن پرداخت می‌شود. تا وقتی بیعانه پرداخت نشود، درخواست شما به هنرمند ارسال نمی‌شود. باقی‌مانده هزینه پس از انجام تتو پرداخت می‌شود.`,
      },
      {
        q: "آیا می‌توانم رزرو را تغییر دهم یا لغو کنم؟",
        a: "بله. اگر حداقل ۲۴ ساعت قبل از زمان رزرو لغو کنید، بیعانه کامل بازگشت داده می‌شود. لغو در کمتر از ۲۴ ساعت مشمول جریمه خواهد بود. برای تغییر زمان، از بخش مدیریت رزروها در داشبورد خود اقدام کنید.",
      },
      {
        q: "آیا رزرو از طریق نوبت مارکت تضمین دارد؟",
        a: "بله. پرداخت‌ها از طریق درگاه بانکی امن زرین‌پال انجام می‌شود و اطلاعات پرداخت شما محفوظ است. در صورت بروز مشکل، تیم پشتیبانی نوبت مارکت وارد عمل می‌شود و تا حصول اطمینان از رضایت شما پیگیری می‌کند.",
      },
    ],
  },
  {
    id: "artist",
    title: "برای هنرمندان",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: "emerald",
    faqs: [
      {
        q: "چگونه به عنوان هنرمند در نوبت مارکت ثبت‌نام کنم؟",
        a: "در صفحه ثبت‌نام، گزینه «هنرمند هستم» را انتخاب کنید. پس از ثبت‌نام، پروفایل حرفه‌ای خود را با بیوگرافی، نمونه‌کارها، سبک‌ها، قیمت و اطلاعات تماس تکمیل کنید. پروفایل شما پس از تأیید تیم نوبت مارکت در فهرست عمومی نمایش داده می‌شود.",
      },
      {
        q: "تأیید پروفایل هنرمند چقدر زمان می‌برد؟",
        a: "بررسی و تأیید پروفایل معمولاً ظرف ۲۴ تا ۴۸ ساعت انجام می‌شود. تیم نوبت مارکت نمونه‌کارها، اطلاعات هویتی و کیفیت کار شما را بررسی می‌کند.",
      },
      {
        q: "درآمد من چگونه محاسبه می‌شود؟",
        a: "هزینه هر تتو مستقیماً توسط مشتری در استودیو پرداخت می‌شود. نوبت مارکت هیچ کارمزدی از هنرمند دریافت نمی‌کند. شما آزادید قیمت‌های خود را تعیین کنید و درآمد ۱۰۰٪ متعلق به شماست.",
      },
      {
        q: "آیا می‌توانم روزها و ساعات کاری خودم را تنظیم کنم؟",
        a: "بله. در داشبورد هنرمند می‌توانید تقویم کاری خود را مدیریت کنید، روزها و ساعات در دسترس را مشخص کنید و زمان‌های رزرو شده را ببینید.",
      },
    ],
  },
  {
    id: "payment",
    title: "پرداخت و قیمت",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: "sky",
    faqs: [
      {
        q: "هزینه تتو چقدر است؟",
        a: "هزینه تتو بستگی به سبک، سایز، پیچیدگی طرح و هنرمند دارد. هر هنرمند قیمت پایه خود را در پروفایلش اعلام کرده است. شما می‌توانید قبل از رزرو، قیمت‌ها را مقایسه کنید.",
      },
      {
        q: "پرداخت چگونه انجام می‌شود؟",
        a: "بیعانه از طریق درگاه پرداخت امن زرین‌پال به‌صورت آنلاین پرداخت می‌شود. باقی‌مانده هزینه پس از انجام تتو، به‌صورت نقدی یا کارت به کارت در استودیو پرداخت می‌شود.",
      },
      {
        q: "آیا فاکتور رسمی صادر می‌شود؟",
        a: "بله. پس از هر پرداخت، فاکتور الکترونیکی در داشبورد شما قابل مشاهده و دانلود است.",
      },
    ],
  },
  {
    id: "safety",
    title: "بهداشت و ایمنی",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "violet",
    faqs: [
      {
        q: "آیا هنرمندان نوبت مارکت بهداشت را رعایت می‌کنند؟",
        a: "بله. تمام هنرمندان تأیید شده نوبت مارکت ملزم به رعایت کامل پروتکل‌های بهداشتی هستند. استفاده از سوزن‌های یکبار مصرف، دستکش، مواد ضدعفونی کننده و محیط استریل از الزامات تأیید پروفایل هنرمند است.",
      },
      {
        q: "مراقبت بعد از تتو چگونه است؟",
        a: "پس از انجام تتو، هنرمند دستورالعمل‌های مراقبتی را به شما ارائه می‌دهد. شامل: شستشوی مناسب، استفاده از پماد ترمیم کننده، عدم قرار گرفتن در معرض آفتاب و آب، و مراجعه مجدد در صورت نیاز. راهنمای کامل مراقبت در بخش مجله نوبت مارکت موجود است.",
      },
    ],
  },
];

// ─── رنگ‌های هر بخش ───
const sectionColors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  rose: { border: "border-rose-500/20", bg: "bg-rose-500/[0.06]", text: "text-rose-400", icon: "text-rose-400" },
  amber: { border: "border-amber-500/20", bg: "bg-amber-500/[0.06]", text: "text-amber-400", icon: "text-amber-400" },
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.06]", text: "text-emerald-400", icon: "text-emerald-400" },
  sky: { border: "border-sky-500/20", bg: "bg-sky-500/[0.06]", text: "text-sky-400", icon: "text-sky-400" },
  violet: { border: "border-violet-500/20", bg: "bg-violet-500/[0.06]", text: "text-violet-400", icon: "text-violet-400" },
};

export default async function FAQPage() {
  const depositPercent = await getDepositPercent();
  const depositLabel = toPersianNumbers(depositPercent);

  // جایگزینی توکن درصد بیعانه با مقدار واقعی تنظیمات ادمین
  const renderedSections = sections.map((section) => ({
    ...section,
    faqs: section.faqs.map((f) => ({
      ...f,
      a: f.a.replace(DEPOSIT_TOKEN, depositLabel),
    })),
  }));

  const allFaqs = renderedSections.flatMap((s) => s.faqs);
  const faqData = faqPageSchema(
    allFaqs.map((f) => ({ question: f.q, answer: f.a })),
    "https://nobat-market.com/faq"
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* هدر */}
      <ScrollReveal>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/[0.04] blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2 text-sm font-medium text-rose-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              پشتیبانی و راهنما
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-lalezar)] text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              سوالات <span className="bg-gradient-to-l from-rose-400 to-amber-400 bg-clip-text text-transparent">متداول</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              پاسخ تمام سوالات شما درباره نوبت مارکت — از نحوه رزرو تا مراقبت بعد از تتو
            </p>          </div>
        </div>
      </div>
      </ScrollReveal>

      <JsonLd graph={[websiteSchema(), organizationSchema(), faqData]} />

      {/* محتوا */}
      <ScrollReveal delay={100}>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {renderedSections.map((section) => {
            const colors = sectionColors[section.color];
            return (
              <section key={section.id} id={section.id}>
                {/* عنوان بخش */}
                <div className={`mb-6 flex items-center gap-3 rounded-xl border ${colors.border} ${colors.bg} px-5 py-3.5`}>
                  <span className={colors.icon}>{section.icon}</span>
                  <h2 className={`text-lg font-black ${colors.text}`}>{section.title}</h2>
                </div>

                {/* سوالات */}
                <div className="space-y-3">
                  {section.faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm [&_summary]:cursor-pointer [&_summary]:rounded-2xl [&_summary]:px-6 [&_summary]:py-5 [&_summary]:font-bold [&_summary]:text-white [&_summary]:transition-colors [&_summary]:hover:bg-white/[0.02] [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-center justify-between gap-4">
                        <span className="text-[15px]">{faq.q}</span>
                        <svg className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-6 pb-5 text-sm leading-relaxed text-zinc-400 border-t border-zinc-800/30 pt-4">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}
