import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "راهنمای مراقبت بعد از تتو",
  description: "راهنمای جامع مراقبت بعد از تتو شامل مراحل بهبودی، نکات مهم و علائم هشداردهنده.",
};
const S = [
  {t:"۴ ساعت اول",s:"نگهداری پانسمان",c:"emerald",p:"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",i:["پانسمان را حداقل ۲ تا ۴ ساعت نگه دارید","از دست زدن به تتو با دست غیر تمیز خودداری کنید","در صورت خونریزی خفیف، نگران نباشید — طبیعی است"]},
  {t:"شستشوی اولیه",s:"تمیز کردن ملایم",c:"blue",p:"M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",i:["دست\u200Cهای خود را با آب و صابون ملایم بشویید","تتو را با آب ولرم و صابون بدون عطر بشویید","به آرامی با حوله تمیز خشک کنید","از حوله کاغذی استفاده کنید"]},
  {t:"کرم مرطوب\u200Cکننده",s:"آبرسانی روزانه",c:"violet",p:"M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z|M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z",i:["روزی ۲ تا ۳ بار کرم مرطوب\u200Cکننده بدون عطر بزنید","لایه نازکی از کرم را روی تتو بمالید","از کرم\u200Cهای حاوی ویتامین E استفاده کنید","از کرم\u200Cهای حاوی رنگ یا عطر خودداری کنید"]},
  {t:"محدودیت\u200Cها (هفته اول)",s:"چه کارهایی نکنیم",c:"red",p:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",i:["از شنا کردن در استخر خودداری کنید","از سونا و جکوزی دور بمانید","ورزش سنگین و عرق کردن ممنوع","تابش مستقیم آفتاب روی تتو ممنوع","پوشیدن لباس تنگ روی تتو ممنوع"]},
  {t:"محافظت در برابر آفتاب",s:"بعد از بهبودی کامل",c:"amber",p:"M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",i:["بعد از بهبودی کامل از ضد آفتاب SPF 50 استفاده کنید","هر بار قبل از قرار گرفتن در آفتاب ضد آفتاب بزنید","این کار باعث حفظ رنگ و کیفیت تتو می\u200Cشود"]},
  {t:"علائم هشداردهنده",s:"کی به پزشک مراجعه کنیم",c:"rose",p:"M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",i:["قرمزی شدید یا تورم غیرعادی","ترشح چرکی یا بوی نامطبوع","تب بالا یا لرز","درد شدید بعد از ۳ روز بهبود نمی\u200Cیابد","واکنش آلرژیک"]},
];

const CM: Record<string, { bg: string; dot: string }> = {
  emerald: { bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  blue: { bg: "bg-blue-500/10", dot: "bg-blue-400" },
  violet: { bg: "bg-violet-500/10", dot: "bg-violet-400" },
  red: { bg: "bg-red-500/10", dot: "bg-red-400" },
  amber: { bg: "bg-amber-500/10", dot: "bg-amber-400" },
  rose: { bg: "bg-rose-500/10", dot: "bg-rose-400" },
};

export default function AftercarePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.06)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{"\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u0645\u0631\u0627\u0642\u0628\u062A \u0628\u0639\u062F \u0627\u0632 \u062A\u062A\u0648"}</h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">{"\u0631\u0639\u0627\u06CC\u062A \u0627\u06CC\u0646 \u0646\u06A9\u0627\u062A \u0628\u0627\u0639\u062B \u0628\u0647\u0628\u0648\u062F\u06CC \u0633\u0631\u06CC\u0639\u200C\u062A\u0631 \u0648 \u062D\u0641\u0638 \u06A9\u06CC\u0641\u06CC\u062A \u062A\u062A\u0648\u06CC \u0634\u0645\u0627 \u0645\u06CC\u200C\u0634\u0648\u062F."}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {S.map((step, i) => {
            const colors = CM[step.c] || CM.emerald;
            const paths = step.p.split("|");
            return (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/70">
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
                <div className="mb-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
                    <svg className={`h-5 w-5 text-${step.c}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {paths.map((d, k) => <path key={k} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />)}
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{step.t}</h2>
                    <p className="text-xs text-zinc-500">{step.s}</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {step.i.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10"><svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></div>
            <div>
              <p className="text-sm font-medium text-emerald-300">{"\u062F\u0631 \u0635\u0648\u0631\u062A \u0647\u0631\u06AF\u0648\u0646\u0647 \u0633\u0648\u0627\u0644 \u06CC\u0627 \u0646\u06AF\u0631\u0627\u0646\u06CC"}</p>
              <p className="mt-1 text-sm text-zinc-400">{"\u0628\u0627 \u0647\u0646\u0631\u0645\u0646\u062F \u062E\u0648\u062F \u06CC\u0627 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0646\u0648\u0628\u062A \u0645\u0627\u0631\u06A9\u062A \u062A\u0645\u0627\u0633 \u0628\u06AF\u06CC\u0631\u06CC\u062F. \u0633\u0644\u0627\u0645\u062A\u06CC \u0634\u0645\u0627 \u0627\u0648\u0644\u0648\u06CC\u062A \u0645\u0627\u0633\u062A."}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center"><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-white"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>{"\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC"}</Link></div>
      </div>
    </div>
  );
}
