import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// پیکربندی پیش‌فرض OpenNext برای Cloudflare Workers.
// چون همهٔ داده‌ها در حافظهٔ خود Worker هستند، به هیچ صف، حافظهٔ نهان یا
// پایگاه داده‌ای نیازی نیست.
export default defineCloudflareConfig({});
