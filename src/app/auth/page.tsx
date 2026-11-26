"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Lightbulb,
  Briefcase,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"innovator" | "investor">("innovator");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { fullName, email, phone, password, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "عملیات ناموفق بود");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  async function loginDemo(demoEmail: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: "123456" }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("ورود به حساب نمونه ناموفق بود");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="card-surface rounded-3xl p-7 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {mode === "login" ? "ورود به حساب کاربری ایده‌پل" : "ساخت حساب کاربری جدید"}
          </h1>
          <p className="text-xs text-slate-500">
            مدیریت ایده‌های ثبت‌شده، عضویت سرمایه‌گذاران و مذاکرات هوش مصنوعی
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-white text-indigo-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-white text-indigo-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ثبت‌نام جدید
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("innovator")}
                  className={`p-3 rounded-xl border-2 text-right space-y-1 cursor-pointer ${
                    role === "innovator"
                      ? "border-indigo-700 bg-indigo-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-indigo-700" />
                  <div className="text-xs font-extrabold text-slate-900">
                    جوان ایده‌پرداز
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("investor")}
                  className={`p-3 rounded-xl border-2 text-right space-y-1 cursor-pointer ${
                    role === "investor"
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <div className="text-xs font-extrabold text-slate-900">
                    کارفرما / سرمایه‌گذار
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره موبایل (اختیاری)
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل</label>
            <input
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز عبور</label>
            <input
              type="password"
              dir="ltr"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-2.5 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === "login" ? "ورود به پنل کاربری" : "ثبت‌نام و ورود"}</span>
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-500 text-center">
            ورود سریع آزمایشی (بدون نیاز به ثبت‌نام)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => loginDemo("sara@idehpol.ir")}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>دمو ایده‌پرداز (سارا)</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => loginDemo("investor@idehpol.ir")}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>دمو سرمایه‌گذار (شریفی)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
