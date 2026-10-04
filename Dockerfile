# ============================================================================
# Dockerfile - نوبت مارکت (Multi-stage Build)
# ============================================================================

ARG NODE_VERSION=20

# ─── مرحله ۱: نصب وابستگی‌ها ───
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app

# نصب openssl تا Prisma موتور هماهنگ با libssl سیستم (3.0) تولید کند
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Retry npm install up to 3 times (handles network issues)
RUN for i in 1 2 3; do \
    npm install --no-audit --no-fund --include=dev --legacy-peer-deps && break || \
    echo "Attempt $i failed, retrying..." && sleep 5; \
  done
RUN npm install @img/sharp-linux-x64 --no-audit --no-fund 2>/dev/null || true
RUN npx prisma generate

# ─── مرحله ۲: بیلد ───
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ─── مرحله ۳: اجرا ───
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# اجبار sharp به استفاده از libvips همراه خودش (نه نسخه سیستمی)
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

# نصب openssl برای اجرای prisma و کوئری‌انجین + کتابخانه libvips برای sharp
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates libvips42 && rm -rf /var/lib/apt/lists/*

# ایجاد کاربر غیر root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# کپی node_modules از مرحله builder
COPY --from=builder /app/node_modules ./node_modules

# کپی فایل‌های standalone و استاتیک
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# ایجاد دایرکتوری آپلود
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate 2>&1 || true; su -s /bin/sh -c 'node server.js' nextjs"]
