export const metadata = { title: "حریم خصوصی" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-lalezar text-4xl text-white">حریم خصوصی</h1>
        <div className="mt-8 space-y-6 text-zinc-400 leading-relaxed">
          <p>آخرین به‌روزرسانی: تیر ۱۴۰۴</p>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۱. جمع‌آوری اطلاعات</h2>
            <p>ما اطلاعات شخصی مانند شماره موبایل، نام و تصویر پروفایل را فقط برای ارائه خدمات جمع‌آوری می‌کنیم.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۲. استفاده از اطلاعات</h2>
            <p>اطلاعات شما صرفاً برای ارائه خدمات، بهبود تجربه کاربری و ارتباطات مربوط به رزرو استفاده می‌شود.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۳. حفاظت از داده‌ها</h2>
            <p>ما از پروتکل‌های امنیتی استاندارد برای محافظت از اطلاعات شما استفاده می‌کنیم.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">۴. حق حذف</h2>
            <p>شما در هر زمان می‌توانید درخواست حذف اطلاعات خود را ارسال کنید.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
