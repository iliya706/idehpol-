# استقرار رایگان ایده‌پل تا شنبه (بدون ترمینال)

هدف: گرفتن یک **لینک عمومی واقعی** که بتوانید در پرستاشاپ بگذارید و بازدیدکننده هم بتواند باز کند.

> پیش‌نمایش Arena (`*.e2b.app`) برای این کار مناسب نیست؛ فقط داخل حساب خودتان باز می‌شود و
> برای بازدیدکنندگان پیام «Preview Unavailable» یا «403» نشان می‌دهد.

---

## گزینه ۱ (پیشنهاد اول برای ایران): Liara

**چرا:** سرور داخل ایران، دسترسی بدون فیلترشکن، از Next.js و Docker پشتیبانی می‌کند، به کاربر
جدید اعتبار هدیه می‌دهد و برای چند روز رایگان در می‌آید.

1. در `liara.ir` ثبت‌نام کنید (اعتبار هدیه برای کاربر جدید).
2. پروژه را روی GitHub بگذارید (پوشه فعلی را push کنید).
3. در لیارا: **پلتفرم → ساخت اپلیکیشن → Next.js** (یا **Docker**، چون `Dockerfile` پروژه آماده است).
4. به GitHub وصل کنید و ریپو و شاخه `main` را انتخاب کنید.
5. در بخش **متغیرهای محیطی** این‌ها را اضافه کنید:
   - `DATABASE_URL` = رشته اتصال دیتابیس (مرحله ۶)
   - `SESSION_SECRET` = یک رشته تصادفی حداقل ۳۲ کاراکتری
   - `SETUP_TOKEN` = مثلاً `idehpol-setup`
   - `NODE_ENV` = `production`
6. در لیارا یک **دیتابیس PostgreSQL** بسازید (پلن رایگان/کم‌مصرف) و رشته اتصال آن را در
   `DATABASE_URL` بگذارید.
7. دکمه Deploy را بزنید؛ آدرسی مثل `https://idehpol.liara.run` می‌گیرید.
8. **مهم‌ترین مرحله:** این آدرس را یک بار در مرورگر باز کنید تا جدول‌ها و داده‌های نمونه ساخته شوند:
   ```
   https://YOUR-APP.liara.run/api/setup?token=idehpol-setup
   ```
   باید پیام «✅ دیتابیس با موفقیت آماده شد» ببینید. (بدون این مرحله، سایت خطای دیتابیس می‌دهد.)
9. تست: `https://YOUR-APP.liara.run/api/health` → باید `{"ok":true}` بدهد.
10. حالا لینک‌ها را در پرستاشاپ بگذارید.

> نکته: اگر لیارا هنگام ثبت‌نام پلن رایگان نشان نداد، همان اعتبار هدیه ثبت‌نام برای چند روز
> کافی است (اپ کوچک + دیتابیس کم‌مصرف).

---

## گزینه ۲: Render (سرور) + Neon (دیتابیس) — هر دو رایگان

**چرا:** بدون نیاز به کارت بانکی (در بیشتر مناطق) و پلن رایگان دائمی.

1. دیتابیس: در `neon.com` ثبت‌نام کنید → **Create Project** → رشته اتصال
   (`postgresql://...?sslmode=require`) را کپی کنید.
2. کد را در GitHub بگذارید.
3. در `render.com`: **New → Web Service** → ریپوی GitHub را انتخاب کنید.
   - Runtime: **Docker** (فایل `Dockerfile` پروژه آماده است)
   - Instance Type: **Free**
4. Environment Variables:
   - `DATABASE_URL` = رشته Neon
   - `SESSION_SECRET` = رشته تصادفی
   - `SETUP_TOKEN` = `idehpol-setup`
5. Deploy → آدرسی مثل `https://idehpol.onrender.com` می‌گیرید.
6. یک بار باز کنید: `https://idehpol.onrender.com/api/setup?token=idehpol-setup`
7. توجه: پلن رایگان Render بعد از ۱۵ دقیقه بی‌کاری می‌خوابد و درخواست بعدی حدود ۳۰–۶۰
   ثانیه معطل می‌شود. برای تست شنبه اشکالی ندارد.

---

## گزینه ۳: Vercel + Neon (سریع‌ترین، اما برای بازدیدکننده ایرانی معمولاً فیلتر است)

1. `neon.com` → پروژه Postgres بسازید و رشته اتصال را بردارید.
2. `vercel.com` → **Add New Project** → ریپوی GitHub را Import کنید.
3. Environment Variables: `DATABASE_URL`، `SESSION_SECRET`، `SETUP_TOKEN`.
4. Deploy → آدرس `https://idehpol.vercel.app`.
5. یک بار `/api/setup?token=idehpol-setup` را باز کنید.

فایل `vercel.json` از قبل در پروژه هست و نیازی به تنظیم Build اضافه ندارید.

---

## لینک‌هایی که در پرستاشاپ می‌گذارید

بعد از استقرار، `https://YOUR-DOMAIN` را جایگزین کنید:

| کاربرد | آدرس |
| --- | --- |
| صفحه اصلی | `https://YOUR-DOMAIN/?source=prestashop&ref=main_menu` |
| کاتالوگ ایده‌ها | `https://YOUR-DOMAIN/ideas?source=prestashop&ref=ideas_menu` |
| ایده‌های بدون سرمایه‌گذار | `https://YOUR-DOMAIN/ideas?fundingStatus=unfunded&source=prestashop&ref=investor_banner` |
| ثبت ایده + پرداخت | `https://YOUR-DOMAIN/submit-idea?source=prestashop&ref=submit_cta` |
| عضویت سرمایه‌گذار + پرداخت | `https://YOUR-DOMAIN/investors?source=prestashop&ref=investor_menu` |
| موتور تطبیق AI | `https://YOUR-DOMAIN/ai-match?source=prestashop&ref=ai_menu` |
| پنل کاربری | `https://YOUR-DOMAIN/dashboard?source=prestashop&ref=my_account` |
| مرکز لینک‌ها + کد HTML | `https://YOUR-DOMAIN/prestashop-links` |

در پرستاشاپ از نوع لینک **URL** استفاده کنید (نه صفحه CMS) تا پارامتر `source=prestashop` حفظ شود.

---

## عیب‌یابی سریع

| نشانه | علت | کار |
| --- | --- | --- |
| سایت بالا نمی‌آید | Build ناموفق یا `DATABASE_URL` خالی | لاگ Deploy را ببینید؛ متغیرها را چک کنید |
| خطای دیتابیس / صفحه سفید | جدول‌ها ساخته نشده‌اند | `/api/setup?token=...` را باز کنید |
| `{"ok":false}` در `/api/health` | رشته اتصال اشتباه یا دیتابیس خاموش | `DATABASE_URL` را دوباره کپی کنید |
| کندی ۳۰–۶۰ ثانیه‌ای اول | خواب پلن رایگان Render | طبیعی است |
| «Preview Unavailable» | آدرس Arena است نه هاست واقعی | باید روی Liara/Render/Vercel مستقر شود |

---

## ورود آزمایشی پس از استقرار

- ایده‌پرداز: `sara@idehpol.ir` / رمز `123456`
- سرمایه‌گذار: `investor@idehpol.ir` / رمز `123456`

پرداخت‌ها با شبیه‌ساز درگاه انجام می‌شوند و کد رهگیری واقعی در دیتابیس ذخیره می‌شود؛
برای جایگزینی درگاه واقعی به فایل `DEPLOY.md` بخش ۷ مراجعه کنید.
