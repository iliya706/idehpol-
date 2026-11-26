"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Link2,
  Sparkles,
  Lightbulb,
  Briefcase,
  LayoutDashboard,
  Compass,
} from "lucide-react";
import { IDEA_CATEGORIES } from "@/lib/constants";

const CORE_ROUTES = [
  {
    path: "/",
    title: "صفحه اصلی پلتفرم ایده‌پل",
    usage: "مناسب لینک اصلی در منوی بالای پرستاشاپ یا اسلایدر صفحه اول",
    icon: Compass,
  },
  {
    path: "/ideas",
    title: "کاتالوگ کامل ایده‌ها و محصولات جوانان",
    usage: "مناسب لینک «مشاهده ایده‌های جوانان» در منوی دسته‌بندی‌های پرستاشاپ",
    icon: Lightbulb,
  },
  {
    path: "/ideas?fundingStatus=unfunded",
    title: "ایده‌های بدون سرمایه‌گذار (آماده جذب سرمایه)",
    usage: "مناسب بنر اختصاصی برای سرمایه‌گذاران و مشتریان VIP فروشگاه پرستاشاپ",
    icon: Sparkles,
  },
  {
    path: "/submit-idea",
    title: "فرم ثبت ایده جدید + پرداخت هزینه انتشار",
    usage: "مناسب دکمه «ایده داری؟ محصولت رو ثبت کن» در صفحه خدمات یا فوتر پرستاشاپ",
    icon: Lightbulb,
  },
  {
    path: "/investors",
    title: "صفحه عضویت کارفرمایان و سرمایه‌گذاران (پرداخت حق عضویت)",
    usage: "مناسب لینک «عضویت سرمایه‌گذاران و کارفرمایان» در منوی همکاری پرستاشاپ",
    icon: Briefcase,
  },
  {
    path: "/ai-match",
    title: "موتور هوشمند تطبیق ایده و سرمایه‌گذار (AI Match)",
    usage: "مناسب لینک «تطبیق هوشمند با AI» برای نمایش مزیت فناورانه سایت",
    icon: Sparkles,
  },
  {
    path: "/dashboard",
    title: "پنل کاربری، مذاکرات و کدهای رهگیری پرداخت",
    usage: "مناسب لینک «پیگیری ایده / پنل سرمایه‌گذار» در بخش حساب کاربری",
    icon: LayoutDashboard,
  },
];

export default function PrestaShopLinksPage() {
  const [origin, setOrigin] = useState("https://idehpol.ir");
  const [customRef, setCustomRef] = useState("main_menu");
  const [selectedCategory, setSelectedCategory] = useState<string>(IDEA_CATEGORIES[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  function buildUrl(path: string) {
    const separator = path.includes("?") ? "&" : "?";
    const refPart = customRef.trim() ? `&ref=${encodeURIComponent(customRef.trim())}` : "";
    return `${origin}${path}${separator}source=prestashop${refPart}`;
  }

  const categoryDeepLink = buildUrl(
    `/ideas?category=${encodeURIComponent(selectedCategory)}`
  );

  const htmlButtonSnippet = `<div style="direction:rtl;text-align:right;padding:18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;font-family:Vazirmatn,Tahoma,sans-serif;">
  <h3 style="margin:0 0 8px 0;color:#1e1b4b;font-size:16px;">ایده نوآورانه دارید یا به دنبال سرمایه‌گذاری هستید؟</h3>
  <p style="margin:0 0 14px 0;color:#475569;font-size:13px;">در پلتفرم هوشمند ایده‌پل، ایده‌های جوانان با هوش مصنوعی به کارفرمایان و سرمایه‌گذاران عضو متصل می‌شوند.</p>
  <a href="${buildUrl("/submit-idea")}" target="_blank" style="display:inline-block;padding:10px 18px;background:#4338ca;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;font-size:13px;margin-left:8px;">ثبت ایده و محصول</a>
  <a href="${buildUrl("/investors")}" target="_blank" style="display:inline-block;padding:10px 18px;background:#059669;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;font-size:13px;">عضویت سرمایه‌گذاران</a>
</div>`;

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-l from-indigo-950 to-slate-900 text-white p-7 sm:p-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold">
          <Store className="w-4 h-4" />
          <span>مرکز لینک‌دهی چندصفحه‌ای به پرستاشاپ (PrestaShop)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          لینک‌های مستقیم صفحات سایت برای قرار دادن در فروشگاه پرستاشاپ شما
        </h1>
        <p className="text-sm text-indigo-100/90 leading-7 max-w-3xl">
          تمامی بخش‌های سایت به‌صورت چندصفحه‌ای با آدرس‌های تمیز طراحی شده‌اند. وقتی کاربری از
          لینک‌های زیر در پرستاشاپ وارد شود، بنر خوش‌آمدگویی پرستاشاپ فعال شده و کانال ورودی
          در رسید پرداخت دیتابیس با برچسب <strong>prestashop</strong> ثبت می‌گردد.
        </p>
      </div>

      {/* Customizer */}
      <div className="card-surface rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            دامنه فعلی سایت ایده‌پل (خودکار تشخیص داده شد)
          </label>
          <input
            type="text"
            dir="ltr"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            شناسه کمپین یا محل قرارگیری در پرستاشاپ (ref)
          </label>
          <input
            type="text"
            dir="ltr"
            value={customRef}
            onChange={(e) => setCustomRef(e.target.value)}
            placeholder="مثلاً main_menu یا product_tab"
            className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-mono"
          />
        </div>
      </div>

      {/* All Multi-Page Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-700" />
          <span>آدرس مستقیم تمام صفحات سایت</span>
        </h2>

        <div className="grid grid-cols-1 gap-3.5">
          {CORE_ROUTES.map((route) => {
            const Icon = route.icon;
            const fullUrl = buildUrl(route.path);
            const copied = copiedKey === route.path;

            return (
              <div
                key={route.path}
                className="card-surface rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-700 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {route.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">{route.usage}</p>
                  <code
                    dir="ltr"
                    className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E7E5DE] text-xs font-mono text-indigo-800 break-all"
                  >
                    {fullUrl}
                  </code>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyText(route.path, fullUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>
                  <Link
                    href={`${route.path}${route.path.includes("?") ? "&" : "?"}source=prestashop&ref=${encodeURIComponent(customRef)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-700 text-xs font-bold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>تست لینک</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Deep Link Generator */}
      <div className="card-surface rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          ساخت لینک مستقیم دسته‌بندی برای منوهای تخصصی پرستاشاپ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-medium"
            >
              {IDEA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-6">
            <code
              dir="ltr"
              className="block w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E7E5DE] text-xs font-mono text-indigo-800 truncate"
            >
              {categoryDeepLink}
            </code>
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => copyText("cat_link", categoryDeepLink)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {copiedKey === "cat_link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === "cat_link" ? "کپی شد" : "کپی لینک"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PrestaShop HTML Embed Widget Code */}
      <div className="card-surface rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-700" />
            <h2 className="text-lg font-extrabold text-slate-900">
              کد آماده HTML برای قرار دادن در صفحات CMS یا توضیحات محصول پرستاشاپ
            </h2>
          </div>
          <button
            type="button"
            onClick={() => copyText("html_code", htmlButtonSnippet)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer"
          >
            {copiedKey === "html_code" ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>کد کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کپی کد HTML</span>
              </>
            )}
          </button>
        </div>

        <pre
          dir="ltr"
          className="rounded-2xl bg-slate-950 text-emerald-300 p-4 text-xs font-mono overflow-x-auto leading-6"
        >
          {htmlButtonSnippet}
        </pre>
      </div>
    </div>
  );
}
