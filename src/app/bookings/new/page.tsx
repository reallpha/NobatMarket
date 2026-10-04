import { Suspense } from "react";
import BookingWizardClient from "./BookingWizardClient";

// ============================================================================
// صفحه رزرو جدید
//
// ویزارد رزرو از useSearchParams استفاده می‌کند (برای پارامتر artist)، پس طبق
// الزام Next.js باید داخل مرز Suspense قرار بگیرد.
// ============================================================================

export default function BookingWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-zinc-500">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
            <span className="text-sm">در حال بارگذاری ویزارد رزرو…</span>
          </div>
        </div>
      }
    >
      <BookingWizardClient />
    </Suspense>
  );
}
