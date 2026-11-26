import Link from "next/link";
import { Download, FileArchive, ShieldCheck, ArrowLeft, ListChecks } from "lucide-react";

export const metadata = {
  title: "دانلود سورس پروژه ایده‌پل",
};

const INCLUDED = [
  "کل کدهای سایت (Next.js + TypeScript + Tailwind)",
  "اتصال و اسکیمای دیتابیس Drizzle ORM",
  "Dockerfile، docker-compose.yml، liara.json، vercel.json، ecosystem.config.js",
  "راهنماها: DEPLOY.md، HOSTING-FREE.md، LIARA-STEP-BY-STEP.md",
  "تصاویر پروژه در پوشه public/images",
];

const EXCLUDED = [
  ".env و .env.local (رمزها — به دلایل امنیتی هرگز در آرشیو نیستند)",
  "node_modules (با npm install بازسازی می‌شود)",
  ".next (خروجی بیلد — روی هاست ساخته می‌شود)",
  ".git و تاریخچه مخزن",
];

export default function DownloadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="card-surface rounded-3xl p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-700 text-white flex items-center justify-center mx-auto">
            <FileArchive className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            دانلود سورس کامل پروژه ایده‌پل
          </h1>
          <p className="text-sm text-slate-600 leading-7">
            یک فایل ZIP آماده است که می‌توانید آن را روی سیستم خود باز کنید، در GitHub آپلود
            کنید و روی لیارا یا Render مستقر نمایید.
          </p>
        </div>

        <a
          href="/download/idehpol-source.zip"
          download
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-base shadow-md transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>دانلود فایل ZIP پروژه (حدود ۵.۸ مگابایت)</span>
        </a>

        <p className="text-center text-xs text-slate-500">
          اگر کلیک کردید و دانلود شروع نشد، این آدرس را در تب جدید مرورگر باز کنید:{" "}
          <code dir="ltr" className="px-1.5 py-0.5 bg-slate-100 rounded">
            /download/idehpol-source.zip
          </code>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
              <ListChecks className="w-4 h-4" />
              <span>داخل آرشیو چیست؟</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-6 text-emerald-950">
              {INCLUDED.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
              <ShieldCheck className="w-4 h-4" />
              <span>خارج از آرشیو (عمدی)</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-6 text-amber-950">
              {EXCLUDED.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE] p-4 space-y-2">
          <h2 className="text-sm font-extrabold text-slate-900">
            بعد از دانلود، روی سیستم خودتان این دو دستور را بزنید
          </h2>
          <pre
            dir="ltr"
            className="rounded-xl bg-slate-900 text-emerald-300 text-[11px] leading-6 p-3 overflow-x-auto"
          >
{`unzip idehpol-source.zip -d idehpol
cd idehpol
npm install`}
          </pre>
          <p className="text-[11px] leading-6 text-slate-600">
            سپس یک فایل <code className="px-1 bg-white border rounded">.env</code> بسازید و مقدار{" "}
            <code className="px-1 bg-white border rounded">DATABASE_URL</code> و{" "}
            <code className="px-1 bg-white border rounded">SESSION_SECRET</code> را در آن بگذارید.
            اگر مستقیم می‌خواهید روی هاست آپلود کنید، همین محتوای پوشه را (بدون پوشه
            node_modules) در مخزن GitHub بریزید.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href="/prestashop-links"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>مرکز لینک‌های پرستاشاپ</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-800 text-white text-xs font-bold"
          >
            <span>بازگشت به صفحه اصلی سایت</span>
          </Link>
        </div>
      </div>

      <p className="text-center text-[11px] leading-6 text-slate-500">
        توجه: این صفحه فقط یک ابزار توسعه است و برای کاربران نهایی لازم نیست؛ پیش از تحویل
        نهایی می‌توانید حذفش کنید.
      </p>
    </div>
  );
}
