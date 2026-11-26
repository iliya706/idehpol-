"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Lightbulb,
  Briefcase,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  UserCheck,
  PlusCircle,
  Compass,
  Link2,
} from "lucide-react";

interface NavUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  investorProfile: {
    id: number;
    organizationName: string;
    membershipStatus: string;
  } | null;
}

const NAV_LINKS = [
  { href: "/", label: "صفحه اصلی", icon: Compass },
  { href: "/ideas", label: "کاتالوگ ایده‌ها", icon: Lightbulb },
  { href: "/submit-idea", label: "ثبت ایده جوانان", icon: PlusCircle },
  { href: "/investors", label: "عضویت سرمایه‌گذاران", icon: Briefcase },
  { href: "/ai-match", label: "موتور مچ AI", icon: Sparkles },
  { href: "/prestashop-links", label: "لینک‌های پرستاشاپ", icon: Link2 },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active) setUser(data.user ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E5DE] bg-[#FAF9F6]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between gap-4 py-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16c2.5-6 6-9 9-9s6.5 3 9 9"
                />
                <circle cx="12" cy="7" r="2.2" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" d="M6 16h12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                ایده‌پل
              </span>
              <span className="text-[11px] font-medium text-indigo-700 mt-1">
                تطبیق هوشمند ایده و سرمایه
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-700 text-white shadow-xs"
                      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-800"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-800 border-[#E2DFD7] hover:border-indigo-300"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  <span>{user.fullName}</span>
                  {user.investorProfile?.membershipStatus === "active" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      سرمایه‌گذار عضو
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  title="خروج از حساب"
                  className="p-2 rounded-xl border border-[#E2DFD7] bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  پنل کاربری
                </Link>
                <Link
                  href="/auth"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ورود / ثبت‌نام</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="منو"
            className="lg:hidden p-2 rounded-xl border border-[#E2DFD7] bg-white text-slate-700 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E7E5DE] bg-white px-4 py-4 space-y-2 shadow-lg">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{user ? `پنل ${user.fullName}` : "پنل کاربری"}</span>
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-semibold"
              >
                <UserCheck className="w-4 h-4" />
                <span>ورود یا ثبت‌نام</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
