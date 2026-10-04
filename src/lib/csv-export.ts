// ============================================================================
// ابزار خروجی CSV - نوبت مارکت
// ============================================================================

/**
 * تبدیل داده‌ها به فایل CSV با هدرهای فارسی
 *
 * @param data - آرایه آبجکت‌ها
 * @param columns - ستون‌ها با نام فارسی و کلید
 * @param filename - نام فایل (بدون پسوند)
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T | string; header: string }[],
  filename: string
): void {
  // ─── ساخت هدرها ───
  const headers = columns.map((col) => `"${col.header}"`).join(",");

  // ─── ساخت ردیف‌ها ───
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key as keyof T];
        if (value === null || value === undefined) return '""';
        const strValue = String(value).replace(/"/g, '""');
        return `"${strValue}"`;
      })
      .join(",")
  );

  // ─── ترکیب و ایجاد فایل ───
  // BOM برای پشتیبانی از UTF-8 در اکسل
  const BOM = "\uFEFF";
  const csvContent = BOM + [headers, ...rows].join("\n");

  // ─── دانلود ───
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// تعریف ستون‌های آماده
// ============================================================================

/** ستون‌های رزروها برای هنرمند */
export const BOOKING_COLUMNS = [
  { key: "bookingNumber", header: "شماره رزرو" },
  { key: "clientName", header: "نام مشتری" },
  { key: "serviceName", header: "سرویس" },
  { key: "scheduledDate", header: "تاریخ رزرو" },
  { key: "startTime", header: "ساعت شروع" },
  { key: "endTime", header: "ساعت پایان" },
  { key: "status", header: "وضعیت" },
  { key: "agreedPrice", header: "مبلغ (تومان)" },
];

/** ستون‌های تراکنش‌ها برای هنرمند */
export const TRANSACTION_COLUMNS = [
  { key: "createdAt", header: "تاریخ" },
  { key: "type", header: "نوع تراکنش" },
  { key: "amount", header: "مبلغ (تومان)" },
  { key: "description", header: "توضیحات" },
  { key: "isCompleted", header: "وضعیت" },
];

/** ستون‌های کاربران برای ادمین */
export const USER_COLUMNS = [
  { key: "displayName", header: "نام نمایشی" },
  { key: "phone", header: "شماره موبایل" },
  { key: "email", header: "ایمیل" },
  { key: "role", header: "نقش" },
  { key: "status", header: "وضعیت" },
  { key: "city", header: "شهر" },
  { key: "totalBookings", header: "تعداد رزروها" },
  { key: "createdAt", header: "تاریخ عضویت" },
];

/** ستون‌های درآمد برای ادمین */
export const REVENUE_COLUMNS = [
  { key: "date", header: "تاریخ" },
  { key: "bookingNumber", header: "شماره رزرو" },
  { key: "clientName", header: "نام مشتری" },
  { key: "artistName", header: "نام هنرمند" },
  { key: "amount", header: "مبلغ کل" },
  { key: "platformFee", header: "کارمزد پلتفرم" },
  { key: "artistNet", header: "سهم هنرمند" },
  { key: "status", header: "وضعیت" },
];

// ============================================================================
// توابع کمکی فرمت‌دهی
// ============================================================================

export function formatBookingForCSV(booking: any) {
  const STATUS_LABELS: Record<string, string> = {
    REQUESTED: "درخواست شده",
    CONFIRMED: "تأیید شده",
    IN_PROGRESS: "در حال انجام",
    COMPLETED: "تکمیل شده",
    CANCELLED_BY_CLIENT: "لغو (مشتری)",
    CANCELLED_BY_ARTIST: "لغو (هنرمند)",
  };

  return {
    ...booking,
    status: STATUS_LABELS[booking.status] || booking.status,
    agreedPrice: booking.agreedPrice
      ? Number(booking.agreedPrice).toLocaleString("fa-IR")
      : "—",
  };
}

export function formatTransactionForCSV(tx: any) {
  const TYPE_LABELS: Record<string, string> = {
    BOOKING_INCOME: "درآمد رزرو",
    WITHDRAWAL: "برداشت",
    REFUND: "بازپرداخت",
    DEPOSIT: "واریز",
    PLATFORM_FEE: "کارمزد پلتفرم",
  };

  return {
    ...tx,
    type: TYPE_LABELS[tx.type] || tx.type,
    amount: Number(tx.amount).toLocaleString("fa-IR"),
    isCompleted: tx.isCompleted ? "تکمیل شده" : "در انتظار",
  };
}
