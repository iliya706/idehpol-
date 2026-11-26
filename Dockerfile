# ---- Stage 1: dependencies + build ----
FROM node:22-alpine AS builder
WORKDIR /app

# نصب وابستگی‌ها از lockfile (سریع و قابل تکرار)
COPY package.json package-lock.json ./
RUN npm ci

# کپی سورس و بیلد
# توجه: فایل‌های .env به‌خاطر .dockerignore کپی نمی‌شوند؛ کد به‌گونه‌ای نوشته شده
# که بیلد بدون DATABASE_URL هم موفق باشد و متغیرها در زمان اجرا از هاست خوانده شوند.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 2: production runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# فقط وابستگی‌های production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# خروجی بیلد و فایل‌های لازم در زمان اجرا
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/drizzle.config.json ./drizzle.config.json

# پورت را هاست تعیین می‌کند (Liara/Render متغیر PORT را ست می‌کنند؛ پیش‌فرض ۳۰۰۰)
EXPOSE 3000

# DATABASE_URL و SESSION_SECRET باید در زمان اجرا تزریق شوند
CMD ["npm", "run", "start"]
