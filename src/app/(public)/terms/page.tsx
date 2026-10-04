export const metadata = { title: "شرایط استفاده" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-lalezar text-4xl text-white">شرایط استفاده</h1>
        <div className="mt-8 space-y-6 text-zinc-400 leading-relaxed">
          <p>آخرین به‌روزرسانی: تیر ۱۴۰۴</p>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۱. پذیرش شرایط</h2>
            <p>با استفاده از پلتفرم نوبت مارکت، شما شرایط زیر را می‌پذیرید. در صورت عدم پذیرش، از استفاده از پلتفرم خودداری کنید.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۲. خدمات</h2>
            <p>نوبت مارکت یک پلتفرم واسطه برای اتصال ارائه‌دهندگان خدمات با مشتریان است. ما مسئولیتی در قبال کیفیت خدمات ارائه شده توسط ارائه‌دهندگان نداریم.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۳. پرداخت و بازپرداخت</h2>
            <p>پرداخت‌ها از طریق درگاه‌های مجاز بانکی انجام می‌شود. شرایط بازپرداخت بر اساس سیاست لغو رزرو هر ارائه‌دهنده تعیین می‌شود.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۴. مسئولیت کاربران</h2>
            <p>کاربران مسئول صحت اطلاعات خود، رعایت قوانین و احترام به سایر کاربران هستند.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
