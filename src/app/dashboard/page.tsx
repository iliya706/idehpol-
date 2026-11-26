"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Store,
  Loader2,
  UserCheck,
  ArrowUpLeft,
  CheckCircle2,
  Briefcase,
  Handshake,
} from "lucide-react";
import {
  FUNDING_STATUS_LABELS,
  MATCH_STATUS_LABELS,
  formatShortToman,
  formatToman,
  toPersianDigits,
} from "@/lib/constants";

interface DashboardPayload {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    city: string | null;
    investorProfile: {
      id: number;
      organizationName: string;
      membershipPlan: string;
      membershipStatus: string;
      minBudgetToman: number;
      maxBudgetToman: number;
    } | null;
  } | null;
  platformStats: {
    totalIdeas: number;
    unfundedIdeas: number;
    fundedOrNegotiating: number;
    activeInvestors: number;
    totalTransactions: number;
  };
  myIdeas: Array<{
    id: number;
    title: string;
    category: string;
    fundingNeededToman: number;
    fundingStatus: string;
    aiReadinessScore: number;
    viewsCount: number;
  }>;
  myPayments: Array<{
    id: number;
    paymentType: string;
    planName: string;
    amountToman: number;
    status: string;
    trackingCode: string;
    sourceChannel: string | null;
    createdAt: string;
  }>;
  myMatches: Array<{
    id: number;
    direction: "incoming" | "outgoing";
    compatibilityScore: number;
    status: string;
    aiSummary: string;
    investorMessage: string | null;
    proposedAmountToman: number | null;
    counterpartName: string;
    counterpartPhone?: string | null;
    idea: {
      id: number;
      title: string;
      fundingNeededToman: number;
      fundingStatus: string;
    };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "payments">("overview");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function quickDemoLogin(email: string) {
    setDemoLoading(email);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "123456" }),
      });
      if (res.ok) {
        await loadDashboard();
        router.refresh();
      }
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleConfirmFunding(matchId: number) {
    setActionBusy(matchId);
    try {
      const res = await fetch(`/api/ai-match/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "funded",
          investorMessage: "توافق سرمایه‌گذاری از طریق پنل مدیریت تأیید نهایی شد.",
        }),
      });
      if (res.ok) {
        await loadDashboard();
      }
    } finally {
      setActionBusy(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        <span className="text-sm font-medium">در حال بارگذاری پنل کاربری...</span>
      </div>
    );
  }

  const { user, platformStats, myIdeas, myPayments, myMatches } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>پنل مدیریت ایده‌ها، پرداخت‌ها و تطبیق‌های هوش مصنوعی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {user ? `سلام ${user.fullName} عزیز` : "پنل کاربری ایده‌پل"}
          </h1>
        </div>

        <Link
          href="/prestashop-links"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-sm font-bold shadow-xs self-start md:self-auto"
        >
          <Store className="w-4 h-4 text-emerald-400" />
          <span>مرکز لینک‌های آماده برای پرستاشاپ</span>
        </Link>
      </div>

      {/* Platform Live Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface rounded-2xl p-4">
          <div className="text-xs text-slate-500">کل ایده‌های ثبت‌شده</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {toPersianDigits(platformStats.totalIdeas)}
          </div>
        </div>
        <div className="card-surface rounded-2xl p-4">
          <div className="text-xs text-slate-500">ایده‌های در انتظار سرمایه‌گذار</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {toPersianDigits(platformStats.unfundedIdeas)}
          </div>
        </div>
        <div className="card-surface rounded-2xl p-4">
          <div className="text-xs text-slate-500">کارفرمایان و سرمایه‌گذاران عضو</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {toPersianDigits(platformStats.activeInvestors)}
          </div>
        </div>
        <div className="card-surface rounded-2xl p-4">
          <div className="text-xs text-slate-500">تراکنش‌های موفق ثبت‌شده</div>
          <div className="text-2xl font-extrabold text-indigo-800 mt-1">
            {toPersianDigits(platformStats.totalTransactions)}
          </div>
        </div>
      </div>

      {/* Guest Quick Switcher OR Logged-In Workspace */}
      {!user ? (
        <div className="card-surface rounded-3xl p-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              برای مشاهده ایده‌ها، رسیدهای پرداخت و پیشنهادهای AI وارد شوید
            </h2>
            <p className="text-sm text-slate-600 leading-7">
              می‌توانید حساب جدید بسازید یا برای بررسی سریع عملکرد سایت، با یک کلیک وارد یکی
              از حساب‌های نمونه زیر شوید:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold">
                <Lightbulb className="w-5 h-5 text-indigo-700" />
                <span>حساب نمونه جوان ایده‌پرداز (سارا محمدی)</span>
              </div>
              <p className="text-xs text-slate-600 leading-6">
                مشاهده ایده ثبت‌شده «سامانه گلخانه هوشمند آگرونیکس»، کد رهگیری پرداخت هزینه ثبت
                و سرمایه‌گذاران مچ‌شده توسط هوش مصنوعی.
              </p>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => quickDemoLogin("sara@idehpol.ir")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer"
              >
                {demoLoading === "sara@idehpol.ir" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>ورود یک‌کلیکه به‌عنوان ایده‌پرداز</span>
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-extrabold">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <span>حساب نمونه کارفرما و سرمایه‌گذار عضو (مهندس رضا شریفی)</span>
              </div>
              <p className="text-xs text-slate-600 leading-6">
                مشاهده عضویت فعال «صندوق جسورانه پیشگام نوآور»، دسترسی به شماره تماس جوانان،
                رسید پرداخت حق عضویت و مچ‌های AI آماده سرمایه‌گذاری.
              </p>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => quickDemoLogin("investor@idehpol.ir")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                {demoLoading === "investor@idehpol.ir" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>ورود یک‌کلیکه به‌عنوان سرمایه‌گذار عضو</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:underline"
            >
              <span>یا ورود / ثبت‌نام با ایمیل اختصاصی شما</span>
              <ArrowUpLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Investor Membership Status Strip if Active */}
          {user.investorProfile && (
            <div className="rounded-3xl bg-gradient-to-l from-emerald-900 to-emerald-700 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>عضویت کارفرما / سرمایه‌گذار فعال است</span>
                </div>
                <h2 className="text-xl font-extrabold">
                  {user.investorProfile.organizationName}
                </h2>
                <p className="text-xs text-emerald-100">
                  بازه بودجه ثبت‌شده:{" "}
                  {formatShortToman(user.investorProfile.minBudgetToman)} تا{" "}
                  {formatShortToman(user.investorProfile.maxBudgetToman)}
                </p>
              </div>
              <Link
                href={`/ai-match?investorProfileId=${user.investorProfile.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-extrabold text-sm hover:bg-emerald-50 self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>باز کردن موتور تطبیق AI من</span>
              </Link>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-[#E5E2D9] pb-3">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                tab === "overview"
                  ? "bg-indigo-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ایده‌ها و تطبیق‌های هوش مصنوعی ({toPersianDigits(myMatches.length)})
            </button>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                tab === "payments"
                  ? "bg-indigo-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              رسیدهای پرداخت و کد رهگیری ({toPersianDigits(myPayments.length)})
            </button>
          </div>

          {tab === "overview" ? (
            <div className="space-y-8">
              {/* My Submitted Ideas */}
              {myIdeas.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      ایده‌های ثبت‌شده توسط شما
                    </h2>
                    <Link
                      href="/submit-idea"
                      className="text-xs font-bold text-indigo-700 hover:underline"
                    >
                      + ثبت ایده جدید
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myIdeas.map((idea) => {
                      const fMeta =
                        FUNDING_STATUS_LABELS[idea.fundingStatus] ??
                        FUNDING_STATUS_LABELS.unfunded;
                      return (
                        <div
                          key={idea.id}
                          className="card-surface rounded-2xl p-5 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${fMeta.badgeClass}`}
                              >
                                {fMeta.label}
                              </span>
                              <span className="text-xs font-bold text-emerald-700">
                                امتیاز AI: {toPersianDigits(idea.aiReadinessScore)}٪
                              </span>
                            </div>
                            <Link
                              href={`/ideas/${idea.id}`}
                              className="text-base font-extrabold text-slate-900 hover:text-indigo-700 block"
                            >
                              {idea.title}
                            </Link>
                            <div className="text-xs text-slate-500">
                              {idea.category} • سرمایه درخواستی:{" "}
                              <strong>{formatShortToman(idea.fundingNeededToman)}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                            <span className="text-slate-500">
                              بازدید: {toPersianDigits(idea.viewsCount)}
                            </span>
                            <Link
                              href={`/ideas/${idea.id}`}
                              className="font-bold text-indigo-700 hover:underline"
                            >
                              مشاهده جزئیات و مچ‌ها ←
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* AI Matches List */}
              <section className="space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                  <span>
                    {user.investorProfile
                      ? "ایده‌های مچ‌شده با معیارهای سرمایه‌گذاری شما"
                      : "سرمایه‌گذاران مچ‌شده با ایده‌های شما"}
                  </span>
                </h2>

                {myMatches.length === 0 ? (
                  <div className="card-surface rounded-2xl p-8 text-center space-y-3">
                    <p className="text-sm font-bold text-slate-700">
                      هنوز تطبیقی ثبت نشده است.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href="/submit-idea"
                        className="px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold"
                      >
                        ثبت ایده جدید
                      </Link>
                      <Link
                        href="/investors"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        عضویت سرمایه‌گذاران
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myMatches.map((m) => {
                      const statusMeta =
                        MATCH_STATUS_LABELS[m.status] ?? MATCH_STATUS_LABELS.suggested;
                      return (
                        <div
                          key={m.id}
                          className="card-surface rounded-2xl p-5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}
                                >
                                  {statusMeta.label}
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                  طرف مقابل: {m.counterpartName}
                                </span>
                                {m.counterpartPhone && (
                                  <span
                                    dir="ltr"
                                    className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded"
                                  >
                                    {m.counterpartPhone}
                                  </span>
                                )}
                              </div>
                              <Link
                                href={`/ideas/${m.idea.id}`}
                                className="text-base font-extrabold text-slate-900 hover:text-indigo-700 block"
                              >
                                {m.idea.title}
                              </Link>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                                <div className="text-[10px] text-indigo-700">تطابق AI</div>
                                <div className="text-lg font-extrabold text-indigo-900">
                                  {toPersianDigits(m.compatibilityScore)}٪
                                </div>
                              </div>

                              {user.investorProfile && m.status !== "funded" && (
                                <button
                                  type="button"
                                  disabled={actionBusy === m.id}
                                  onClick={() => handleConfirmFunding(m.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                                >
                                  {actionBusy === m.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Handshake className="w-3.5 h-3.5" />
                                  )}
                                  <span>تأیید سرمایه‌گذاری</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-6 bg-[#FAF9F6] p-3 rounded-xl border border-[#ECEAE2]">
                            {m.aiSummary}
                          </p>

                          {m.investorMessage && (
                            <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                              <strong>پیام ثبت‌شده:</strong> {m.investorMessage}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* Payments Receipt History Tab */
            <section className="card-surface rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  تاریخچه تراکنش‌ها و کدهای رهگیری پرداخت
                </h2>
              </div>

              {myPayments.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  هنوز تراکنش پرداختی برای این حساب ثبت نشده است.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[#FAF9F6] text-xs text-slate-500 border-b border-[#E7E5DE]">
                      <tr>
                        <th className="py-3.5 px-5 font-bold">شرح خدمت / پلن</th>
                        <th className="py-3.5 px-5 font-bold">نوع تراکنش</th>
                        <th className="py-3.5 px-5 font-bold">مبلغ</th>
                        <th className="py-3.5 px-5 font-bold">کد رهگیری</th>
                        <th className="py-3.5 px-5 font-bold">کانال ورودی</th>
                        <th className="py-3.5 px-5 font-bold">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-4 px-5 font-bold text-slate-900">
                            {p.planName}
                          </td>
                          <td className="py-4 px-5 text-xs text-slate-600">
                            {p.paymentType === "idea_listing"
                              ? "هزینه ثبت ایده جوانان"
                              : "حق عضویت سرمایه‌گذار"}
                          </td>
                          <td className="py-4 px-5 font-extrabold text-emerald-700">
                            {formatToman(p.amountToman)}
                          </td>
                          <td dir="ltr" className="py-4 px-5 font-mono text-xs text-indigo-800">
                            {p.trackingCode}
                          </td>
                          <td className="py-4 px-5 text-xs">
                            {p.sourceChannel === "prestashop" ? (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-bold">
                                پرستاشاپ
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                مستقیم
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              پرداخت موفق
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
