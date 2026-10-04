// ============================================================================
// آزادسازی منابع پیش‌نمایش (Windows / macOS / Linux)
//
// OpenNext برای هر build پوشهٔ `.open-next` را پاک می‌کند. اگر سرور پیش‌نمایش
// (wrangler dev) در حال اجرا باشد، فایل‌های داخل این پوشه قفل می‌شوند و build
// با خطای «EPERM: Permission denied» شکست می‌خورد.
//
// این اسکریپت پیش از build/deploy اجرا می‌شود و فقط دو چیز را می‌بندد:
//   ۱) پروسهٔ workerd (موتور اجرای Cloudflare)
//   ۲) هر پروسه‌ای که پورت پیش‌نمایش (پیش‌فرض 8788) را اشغال کرده است
//
// هیچ پروسهٔ دیگری (مثل Docker یا next dev پروژهٔ اصلی) بسته نمی‌شود.
// ============================================================================

import { execSync } from "node:child_process";

const PORT = Number(process.env.PREVIEW_PORT || 8788);

function run(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return "";
  }
}

function killWindows() {
  // ۱) موتور workerd
  run("taskkill /F /IM workerd.exe");

  // ۲) پروسه‌هایی که پورت پیش‌نمایش را اشغال کرده‌اند
  const output = run("netstat -ano");
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`:${PORT}`)) continue;
    const pid = line.trim().split(/\s+/).pop();
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }
  for (const pid of pids) run(`taskkill /F /PID ${pid}`);
  return pids.size;
}

function killPosix() {
  run("pkill -f workerd");
  let killed = 0;
  const lsof = run(`lsof -ti tcp:${PORT}`);
  for (const pid of lsof.split(/\s+/).filter(Boolean)) {
    run(`kill -9 ${pid}`);
    killed += 1;
  }
  if (killed === 0) run(`fuser -k ${PORT}/tcp`);
  return killed;
}

const freed = process.platform === "win32" ? killWindows() : killPosix();

console.log(
  freed > 0
    ? `✔ پیش‌نمایش قبلی بسته شد (${freed} پروسه روی پورت ${PORT}).`
    : `✔ پورت ${PORT} آزاد است.`
);
