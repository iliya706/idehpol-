# راهنمای استقرار دائمی ایده‌پل (برای لینک‌دهی به پرستاشاپ)

> **مهم:** آدرس‌های `*.e2b.app` که در محیط پیش‌نمایش می‌بینید، **موقت** هستند و به نشست سندباکس
> گره خورده‌اند. با خواب‌رفتن یا بازسازی سندباکس، توکن دسترسی آن‌ها باطل می‌شود و مرورگر
> خطای `403 FORBIDDEN — UNABLE TO RESUME SANDBOX` نشان می‌دهد. این خطا از سایت نیست و
> کدها سالم‌اند؛ برای داشتن لینک پایدار که بتوانید در پرستاشاپ قرار دهید، پروژه را یک بار
> روی هاست/دامنه خودتان مستقر (Deploy) کنید.

## ۰) چرا صفحه «Preview Unavailable» می‌بینم؟

سرور پیش‌نمایش فقط داخل خودِ رابط **arena.ai** قابل مشاهده است. اگر آدرس `*.e2b.app` را در
مرورگر مستقل، در iframe یک سایت دیگر، یا پس از بسته‌شدن نشست باز کنید، به‌جای سایت پیام
`Preview Unavailable — This preview is only available on arena.ai` یا
`403 FORBIDDEN — UNABLE TO RESUME SANDBOX` نمایش داده می‌شود. این یک محدودیت امنیتی پلتفرم
پیش‌نمایش است، نه باگ کد؛ هیچ تغییری در پروژه نمی‌تواند آن را برطرف کند.

برای مشاهده سایت: از پنل **Preview** داخل arena.ai استفاده کنید (هر بار آدرس تازه صادر می‌شود).
برای داشتن لینک عمومی و دائمی که در پرستاشاپ قابل استفاده باشد: گزینه ۳ (Docker) یا ۴ (VPS)
یا ۵ (Vercel) را ادامه دهید.

### استقرار یک‌دستوری با Docker (پیشنهادی برای VPS)

```bash
# روی سرور، داخل پوشه پروژه:
SESSION_SECRET="$(openssl rand -hex 32)" docker compose up -d --build
docker compose exec app npx drizzle-kit push    # ساخت جدول‌ها
curl http://localhost:3000/api/health           # باید {"ok":true} بدهد
```

اپلیکیشن و PostgreSQL هر دو بالا می‌آیند؛ داده‌ها در volume ماندگار `idehpol_pgdata` ذخیره
می‌شوند. برای دامنه و SSL، بخش ۴ (Nginx) را انجام دهید.

---

## ۱) پیش‌نیازها

- یک دیتابیس PostgreSQL (پیشنهاد: Neon، Supabase، Railway یا PostgreSQL روی VPS خودتان).
- Node.js نسخه ۲۰ یا بالاتر.
- دامنه‌ای که در پرستاشاپ استفاده می‌کنید (مثلاً `idea.yourdomain.ir`).

## ۲) متغیرهای محیطی لازم

یک فایل `.env` (یا Environment Variables در پنل هاست) با این مقادیر بسازید:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
SESSION_SECRET=یک-رشته-تصادفی-حداقل-۳۲-کاراکتری-و-مخفی
NODE_ENV=production
```

- `DATABASE_URL`: رشته اتصال PostgreSQL شما. برای سرویس‌های ابری معمولاً `?sslmode=require` لازم است.
- `SESSION_SECRET`: کلید امضای کوکی ورود کاربران. در محیط عملیاتی حتماً مقدار تصادفی و مخفی بگذارید.

## ۳) ساخت جدول‌ها

پس از تنظیم `DATABASE_URL`:

```bash
npm install
npx drizzle-kit push
```

جدول‌های `users`، `investor_profiles`، `ideas`، `payments` و `ai_matches` ساخته می‌شوند.
داده‌های نمونه فارسی (۶ ایده، ۳ سرمایه‌گذار عضو، رسیدهای پرداخت و تطبیق‌های AI) در اولین
درخواست به‌صورت خودکار و فقط در صورت خالی‌بودن جدول کاربران درج می‌شوند.

## ۴) اجرا روی سرور (VPS + PM2 + Nginx)

```bash
npm ci
npm run build
npm run start            # پیش‌فرض روی پورت 3000
# یا با PM2 برای اجرای دائمی:
npm i -g pm2
pm2 start npm --name idehpol -- run start
pm2 save && pm2 startup
```

نمونه پیکربندی Nginx (پروکسی به پورت 3000):

```nginx
server {
    listen 80;
    server_name idea.yourdomain.ir;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

سپس SSL را با `certbot --nginx -d idea.yourdomain.ir` فعال کنید.

## ۵) اجرا روی Vercel (بدون سرور)

1. مخزن پروژه را به GitHub پوش کنید و در Vercel با گزینه **Import Project** وارد کنید.
2. در بخش Settings → Environment Variables، مقادیر `DATABASE_URL` و `SESSION_SECRET` را ثبت کنید.
3. Build Command: `npm run build` — Output: پیش‌فرض Next.js.
4. پس از Deploy، در ترمینال محلی یک بار `npx drizzle-kit push` را با همان `DATABASE_URL`
   اجرا کنید تا جدول‌ها روی دیتابیس ابری ساخته شوند.
5. دامنه اختصاصی (مثل `idea.yourdomain.ir`) را در Vercel → Domains اضافه کنید.

## ۶) لینک‌هایی که باید در پرستاشاپ قرار دهید

پس از استقرار، دامنه واقعی را در صفحه `/prestashop-links` وارد کنید تا همه لینک‌ها و کد
HTML به‌صورت خودکار با دامنه شما ساخته شوند. نمونه لینک‌ها:

| کاربرد در پرستاشاپ | آدرس |
| --- | --- |
| صفحه اصلی | `https://idea.yourdomain.ir/?source=prestashop` |
| کاتالوگ ایده‌ها | `https://idea.yourdomain.ir/ideas?source=prestashop` |
| ایده‌های بدون سرمایه‌گذار | `https://idea.yourdomain.ir/ideas?fundingStatus=unfunded&source=prestashop` |
| ثبت ایده + پرداخت هزینه انتشار | `https://idea.yourdomain.ir/submit-idea?source=prestashop` |
| عضویت کارفرما/سرمایه‌گذار + پرداخت | `https://idea.yourdomain.ir/investors?source=prestashop` |
| موتور تطبیق هوش مصنوعی | `https://idea.yourdomain.ir/ai-match?source=prestashop` |
| پنل کاربری و رسید پرداخت‌ها | `https://idea.yourdomain.ir/dashboard` |
| مرکز لینک‌ها و کد آماده پرستاشاپ | `https://idea.yourdomain.ir/prestashop-links` |

پارامتر `source=prestashop` باعث می‌شود بنر خوش‌آمدگویی پرستاشاپ نمایش داده شود و کانال
ورودی در رسید پرداخت دیتابیس با برچسب `prestashop` ثبت گردد. با `&ref=...` هم می‌توانید
محل قرارگیری لینک (مثلاً `main_menu` یا `product_tab`) را برای گزارش‌گیری مشخص کنید.

## ۷) اتصال درگاه پرداخت واقعی

در حال حاضر پرداخت‌ها با شبیه‌ساز درگاه (برای تست کامل جریان پرداخت) ثبت می‌شوند. برای
اتصال واقعی:

- در `/api/ideas` (هزینه ثبت ایده) و `/api/investors` (حق عضویت) فراخوانی درگاه واقعی
  (زرین‌پال، آیدی‌پی، نکست‌پی یا ...) را جایگزین ثبت مستقیم تراکنش کنید.
- کلید درگاه را در `.env` بگذارید، مثلاً `ZARINPAL_MERCHANT_ID=...` و فقط در سمت سرور بخوانید.
- پس از بازگشت کاربر از درگاه و تأیید (`verify`) تراکنش، رکورد `payments` را با وضعیت
  `paid` و کد رهگیری درگاه ذخیره کنید و سپس موتور `computeAiMatch` را اجرا کنید.

## ۸) بررسی نهایی سلامت

```bash
curl https://idea.yourdomain.ir/api/health
# خروجی موفق: {"ok":true}
```

اگر `ok:false` بود، اتصال `DATABASE_URL` و اجرای `npx drizzle-kit push` را بررسی کنید.
