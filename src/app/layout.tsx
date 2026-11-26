import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PrestaShopBanner } from "@/components/PrestaShopBanner";

export const metadata: Metadata = {
  title: "ایده‌پل | پلتفرم هوشمند اتصال ایده‌های جوانان به سرمایه‌گذاران و کارفرمایان",
  description:
    "ایده یا محصول نوآورانه خود را ثبت کنید، با هوش مصنوعی به کارفرمایان و سرمایه‌گذاران عضو متصل شوید و برای ایده خود سرمایه‌گذار پیدا کنید. معماری چندصفحه‌ای آماده اتصال به پرستاشاپ.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <PrestaShopBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
