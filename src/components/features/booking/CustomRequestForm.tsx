"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TATTOO_STYLES, TATTOO_SIZES, BODY_PARTS } from "@/constants";

const requestSchema = z.object({
  style: z.string().min(1, "انتخاب سبک الزامی است"),
  bodyPart: z.string().min(1, "انتخاب ناحیه بدن الزامی است"),
  size: z.string().min(1, "انتخاب سایز الزامی است"),
  minBudget: z.number().min(500000, "حداقل بودجه ۵۰۰,۰۰۰ تومان است"),
  maxBudget: z.number().min(500000, "حداقل بودجه ۵۰۰,۰۰۰ تومان است"),
  description: z.string().min(20, "توضیحات باید حداقل ۲۰ کاراکتر باشد"),
  deadline: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

type Props = {
  artistId: string;
  artistName: string;
  artistSlug: string;
};

export function CustomRequestForm({ artistId, artistName, artistSlug }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      style: "",
      bodyPart: "",
      size: "",
      minBudget: 1000000,
      maxBudget: 3000000,
      description: "",
      deadline: "",
    },
  });

  const handleSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      // This will be connected to the request service in the next step
      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "درخواست ثبت شد",
        description: `درخواست شما برای ${artistName} با موفقیت ارسال شد. پس از بررسی، پاسخ دریافت خواهید کرد.`,
      });

      router.push(`/request/${artistSlug}/success`);
    } catch {
      toast({
        title: "خطا در ثبت درخواست",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Reference Images */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">تصاویر مرجع (اختیاری)</h3>
          <p className="mb-4 text-sm text-zinc-400">
            تصاویری که الهام‌بخش شما هستند را آپلود کنید تا هنرمند بهتر متوجه سلیقه شما شود.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {uploadedImages.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-zinc-700">
                <img src={url} alt={`مرجع ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-zinc-900/80 p-1 text-zinc-400 hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {uploadedImages.length < 5 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 text-zinc-500 transition-colors hover:border-rose-500/50 hover:text-rose-400">
                <svg className="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">افزودن تصویر</span>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Style & Size */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">سبک و سایز</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">سبک تتو *</label>
              <Select value={form.watch("style")} onValueChange={(v) => form.setValue("style", v)}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900">
                  <SelectValue placeholder="انتخاب سبک" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  {TATTOO_STYLES.map((style) => (
                    <SelectItem key={style} value={style} className="text-zinc-300">
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.style && (
                <p className="mt-1 text-xs text-red-400">{form.formState.errors.style.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">سایز تتو *</label>
              <Select value={form.watch("size")} onValueChange={(v) => form.setValue("size", v)}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900">
                  <SelectValue placeholder="انتخاب سایز" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  {TATTOO_SIZES.map((size) => (
                    <SelectItem key={size} value={size} className="text-zinc-300">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.size && (
                <p className="mt-1 text-xs text-red-400">{form.formState.errors.size.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-300">ناحیه بدن *</label>
              <Select value={form.watch("bodyPart")} onValueChange={(v) => form.setValue("bodyPart", v)}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900">
                  <SelectValue placeholder="انتخاب ناحیه بدن" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part} className="text-zinc-300">
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.bodyPart && (
                <p className="mt-1 text-xs text-red-400">{form.formState.errors.bodyPart.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">بودجه تقریبی</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">حداقل بودجه (تومان) *</label>
              <Input
                type="number"
                {...form.register("minBudget", { valueAsNumber: true })}
                className="border-zinc-800 bg-zinc-900 text-white"
                placeholder="1,000,000"
              />
              {form.formState.errors.minBudget && (
                <p className="mt-1 text-xs text-red-400">{form.formState.errors.minBudget.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">حداکثر بودجه (تومان) *</label>
              <Input
                type="number"
                {...form.register("maxBudget", { valueAsNumber: true })}
                className="border-zinc-800 bg-zinc-900 text-white"
                placeholder="3,000,000"
              />
              {form.formState.errors.maxBudget && (
                <p className="mt-1 text-xs text-red-400">{form.formState.errors.maxBudget.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">توضیحات</h3>
          <Textarea
            {...form.register("description")}
            className="min-h-[120px] border-zinc-800 bg-zinc-900 text-white"
            placeholder="ایده، الهامات و جزئیات تتوی مورد نظرتان را توضیح دهید. هرچه دقیق‌تر باشید، نتیجه بهتر خواهد بود..."
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-red-400">{form.formState.errors.description.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Deadline */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">مهلت مورد نظر (اختیاری)</h3>
          <p className="mb-4 text-sm text-zinc-400">اگر زمان خاصی مد نظرتان است، وارد کنید.</p>
          <Input
            type="date"
            {...form.register("deadline")}
            className="border-zinc-800 bg-zinc-900 text-white"
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-white">خلاصه درخواست</h3>
        <div className="flex flex-wrap gap-2">
          {form.watch("style") && <Badge className="border-zinc-700 bg-zinc-800 text-zinc-300">{form.watch("style")}</Badge>}
          {form.watch("size") && <Badge className="border-zinc-700 bg-zinc-800 text-zinc-300">{form.watch("size")}</Badge>}
          {form.watch("bodyPart") && <Badge className="border-zinc-700 bg-zinc-800 text-zinc-300">{form.watch("bodyPart")}</Badge>}
          {form.watch("minBudget") > 0 && (
            <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">
              {form.watch("minBudget").toLocaleString("fa-IR")} - {form.watch("maxBudget").toLocaleString("fa-IR")} تومان
            </Badge>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-rose-600 text-white hover:bg-rose-700"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            در حال ارسال...
          </span>
        ) : (
          "ارسال درخواست"
        )}
      </Button>
    </form>
  );
}
