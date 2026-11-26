import Link from "next/link";
import { Sparkles, Link2, ShieldCheck, ArrowUpLeft } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#E5E2D9] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">ایده‌پل</span>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              پلتفرم هوشمند ثبت ایده‌ها و محصولات جوانان، عضویت کارفرمایان و
              سرمایه‌گذاران، و تطبیق خودکار با هوش مصنوعی تا هیچ ایده ارزشمندی بدون
              سرمایه‌گذار نماند.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>آماده اتصال مستقیم به پرستاشاپ</span>
            </div>
          </div>

          {/* Youth Innovators */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              مسیر جوانان ایده‌پرداز
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/submit-idea" className="hover:text-indigo-700 transition-colors">
                  ثبت ایده و پرداخت هزینه انتشار
                </Link>
              </li>
              <li>
                <Link href="/ideas" className="hover:text-indigo-700 transition-colors">
                  مشاهده کاتالوگ ایده‌ها و محصولات
                </Link>
              </li>
              <li>
                <Link href="/ai-match" className="hover:text-indigo-700 transition-colors">
                  مشاهده پیشنهادهای هوش مصنوعی
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-700 transition-colors">
                  پیگیری مذاکرات و رسیدهای پرداخت
                </Link>
              </li>
            </ul>
          </div>

          {/* Investors & Employers */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              مسیر کارفرمایان و سرمایه‌گذاران
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/investors" className="hover:text-indigo-700 transition-colors">
                  خرید حق عضویت و تکمیل پروفایل سرمایه‌گذار
                </Link>
              </li>
              <li>
                <Link
                  href="/ideas?fundingStatus=unfunded"
                  className="hover:text-indigo-700 transition-colors"
                >
                  ایده‌های بدون سرمایه‌گذار (آماده مچ)
                </Link>
              </li>
              <li>
                <Link href="/ai-match" className="hover:text-indigo-700 transition-colors">
                  موتور تطبیق چندمعیاره هوش مصنوعی
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-indigo-700 transition-colors">
                  ورود به حساب کارفرمایان عضو
                </Link>
              </li>
            </ul>
          </div>

          {/* PrestaShop Integration Quick Box */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E2D9] p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
              <Link2 className="w-4 h-4" />
              <span>مرکز لینک‌های پرستاشاپ</span>
            </div>
            <p className="text-xs leading-6 text-slate-600">
              تمام صفحات سایت با آدرس‌های مستقل و پارامتر رهگیری{" "}
              <code dir="ltr" className="px-1.5 py-0.5 bg-white border rounded text-indigo-700">
                ?source=prestashop
              </code>{" "}
              برای قرار دادن در منو، بنر و صفحه محصولات پرستاشاپ آماده هستند.
            </p>
            <Link
              href="/prestashop-links"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
            >
              <span>دریافت لینک‌ها و کد دکمه‌های پرستاشاپ</span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© ۱۴۰۴ پلتفرم هوشمند ایده‌پل — تمامی حقوق محفوظ است.</p>
          <p>طراحی‌شده با معماری چندصفحه‌ای Next.js + PostgreSQL جهت اتصال یکپارچه به PrestaShop</p>
        </div>
      </div>
    </footer>
  );
}
