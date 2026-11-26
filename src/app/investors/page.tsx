"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  BadgeCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  IDEA_CATEGORIES,
  INVESTOR_MEMBERSHIP_PLANS,
  STAGE_LABELS,
  formatToman,
  formatShortToman,
  toPersianDigits,
} from "@/lib/constants";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";

interface InvestorItem {
  id: number;
  organizationName: string;
  membershipPlan: string;
  preferredCategories: string[];
  minBudgetToman: number;
  maxBudgetToman: number;
  investmentThesis: string;
  userName: string;
  city: string | null;
}

interface EnrollmentSuccess {
  profile: { id: number; organizationName: string; membershipPlan: string };
  payment: { trackingCode: string; amountToman: number; planName: string };
  topMatches: Array<{
    id: number;
    ideaId: number;
    compatibilityScore: number;
    ideaTitle: string;
    ideaCategory: string;
    aiSummary: string;
  }>;
}

function InvestorsInner() {
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    fullName: string;
    email: string;
  } | null>(null);
  const [investors, setInvestors] = useState<InvestorItem[]>([]);

  const initialPlan = searchParams.get("plan");
  const [membershipPlan, setMembershipPlan] = useState<"starter" | "pro" | "enterprise">(
    initialPlan === "starter" || initialPlan === "enterprise" ? initialPlan : "pro"
  );

  const [organizationName, setOrganizationName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    IDEA_CATEGORIES[0],
    IDEA_CATEGORIES[1],
  ]);
  const [selectedStages, setSelectedStages] = useState<string[]>(["prototype", "mvp"]);
  const [minBudgetMillion, setMinBudgetMillion] = useState("400");
  const [maxBudgetMillion, setMaxBudgetMillion] = useState("2500");
  const [investmentThesis, setInvestmentThesis] = useState("");
  const [keywordsInput, setKeywordsInput] = useState(
    "هوش مصنوعی، اینترنت اشیا، صادراتی، فروشگاه آنلاین"
  );

  // Guest account fields
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [sourceChannel, setSourceChannel] = useState("direct");
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<EnrollmentSuccess | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user ?? null))
      .catch(() => {});

    fetch("/api/investors")
      .then((r) => r.json())
      .then((d) => setInvestors(d.investors ?? []))
      .catch(() => {});

    try {
      const src =
        searchParams.get("source") || sessionStorage.getItem("idehpol_source") || "direct";
      setSourceChannel(src);
    } catch {}
  }, [searchParams]);

  const activePlan =
    INVESTOR_MEMBERSHIP_PLANS.find((p) => p.id === membershipPlan) ??
    INVESTOR_MEMBERSHIP_PLANS[1];

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleStage(st: string) {
    setSelectedStages((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  }

  function handleOpenPayment(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (organizationName.trim().length < 2) {
      setFormError("لطفاً نام شرکت، مجموعه کارفرمایی یا صندوق سرمایه‌گذاری را وارد کنید.");
      return;
    }
    if (selectedCategories.length === 0) {
      setFormError("حداقل یک حوزه تخصصی برای تطبیق هوش مصنوعی انتخاب کنید.");
      return;
    }
    if (selectedStages.length === 0) {
      setFormError("حداقل یک مرحله بلوغ محصول انتخاب کنید.");
      return;
    }
    if (investmentThesis.trim().length < 15) {
      setFormError(
        "لطفاً توضیح کوتاه درباره اولویت‌های سرمایه‌گذاری یا نیاز کسب‌وکار خود بنویسید."
      );
      return;
    }
    if (!currentUser && (!guestFullName.trim() || !guestEmail.trim())) {
      setFormError("لطفاً نام و ایمیل نماینده کارفرما/سرمایه‌گذار را وارد کنید.");
      return;
    }

    setPaymentModalOpen(true);
  }

  async function handleConfirmPayment() {
    setSubmitting(true);
    setFormError(null);
    try {
      const keywords = keywordsInput
        .split(/[،,]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          membershipPlan,
          preferredCategories: selectedCategories,
          preferredStages: selectedStages,
          minBudgetToman: Math.max(50, Number(minBudgetMillion) || 300) * 1_000_000,
          maxBudgetToman: Math.max(100, Number(maxBudgetMillion) || 2000) * 1_000_000,
          investmentThesis,
          keywords,
          sourceChannel,
          guestFullName: currentUser ? undefined : guestFullName,
          guestEmail: currentUser ? undefined : guestEmail,
          guestPhone: currentUser ? undefined : guestPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "خطا در فعال‌سازی عضویت رخ داد");
        setPaymentModalOpen(false);
      } else {
        setSuccessData(json);
        setPaymentModalOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setFormError("خطا در اتصال به سرور");
      setPaymentModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="card-surface rounded-3xl p-8 space-y-6 border-emerald-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              عضویت سرمایه‌گذاری «{successData.profile.organizationName}» فعال شد!
            </h1>
            <p className="text-sm text-slate-600">
              موتور هوش مصنوعی بلافاصله کل کاتالوگ ایده‌های جوانان را با معیارهای شما تطبیق داد.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">کد رهگیری پرداخت حق عضویت</div>
              <div dir="ltr" className="text-sm font-mono font-extrabold text-indigo-800 mt-1">
                {successData.payment.trackingCode}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">مبلغ پرداخت‌شده</div>
              <div className="text-sm font-extrabold text-emerald-700 mt-1">
                {formatToman(successData.payment.amountToman)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-700" />
              <span>برترین ایده‌های پیشنهادی هوش مصنوعی برای شما:</span>
            </h2>
            <div className="space-y-3">
              {successData.topMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/ideas/${m.ideaId}`}
                      className="text-sm font-extrabold text-indigo-900 hover:underline"
                    >
                      {m.ideaTitle}
                    </Link>
                    <div className="text-[11px] font-bold text-slate-500">
                      {m.ideaCategory}
                    </div>
                    <p className="text-xs text-slate-600 leading-6">{m.aiSummary}</p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-center shrink-0">
                    <div className="text-[10px] text-slate-500">تطابق AI</div>
                    <div className="text-lg font-extrabold text-indigo-800">
                      {toPersianDigits(m.compatibilityScore)}٪
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href={`/ai-match?investorProfileId=${successData.profile.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>باز کردن تمام تطبیق‌ها در موتور AI</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
            >
              رفتن به پنل کارفرما
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Briefcase className="w-4 h-4" />
          <span>عضویت کارفرمایان، کارآفرینان و سرمایه‌گذاران</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
          عضو شوید و ایده‌های طلایی جوانان را با هوش مصنوعی کشف کنید
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-7">
          با پرداخت حق عضویت و ثبت معیارهای سرمایه‌گذاری، به اطلاعات تماس مستقیم ایده‌پردازان،
          تحلیل ریسک و امتیاز تطبیق هوشمند دسترسی فوری پیدا می‌کنید.
        </p>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INVESTOR_MEMBERSHIP_PLANS.map((plan) => {
          const active = membershipPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setMembershipPlan(plan.id)}
              className={`rounded-3xl p-6 sm:p-7 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                active
                  ? "border-indigo-700 bg-white shadow-lg shadow-indigo-950/8"
                  : "border-[#E7E5DE] bg-white/80 hover:border-indigo-200"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      active
                        ? "bg-indigo-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    مدت: {plan.durationLabel}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-2">
                    {formatToman(plan.priceToman)}
                  </div>
                  <p className="text-xs text-slate-600 leading-6 mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2.5 pt-3 border-t border-slate-100">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setMembershipPlan(plan.id)}
                className={`mt-6 w-full py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  active
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                {active ? "✓ پلن انتخاب‌شده" : "انتخاب این پلن"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Criteria & Checkout Form */}
      <form
        onSubmit={handleOpenPayment}
        className="card-surface rounded-3xl p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            تنظیم پروفایل سرمایه‌گذاری برای موتور تطبیق هوش مصنوعی
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            هرچه معیارها دقیق‌تر باشد، موتور AI ایده‌های دقیق‌تری از میان طرح‌های بدون سرمایه‌گذار
            پیشنهاد می‌دهد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نام شرکت، کسب‌وکار کارفرما یا صندوق سرمایه‌گذاری *
            </label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="مثلاً: گروه صنعتی و سرمایه‌گذاری پارس‌تک"
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Categories Multi-Select */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              حوزه‌های مورد علاقه برای سرمایه‌گذاری *
            </label>
            <div className="flex flex-wrap gap-2">
              {IDEA_CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selected
                        ? "bg-indigo-700 text-white border-indigo-700"
                        : "bg-[#FAF9F6] text-slate-700 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stages Multi-Select */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              مراحل مورد نظر بلوغ محصول *
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STAGE_LABELS).map(([key, meta]) => {
                const selected = selectedStages.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleStage(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selected
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-[#FAF9F6] text-slate-700 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              حداقل بودجه سرمایه‌گذاری (میلیون تومان)
            </label>
            <input
              type="number"
              dir="ltr"
              min={50}
              value={minBudgetMillion}
              onChange={(e) => setMinBudgetMillion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              معادل {formatShortToman((Number(minBudgetMillion) || 0) * 1_000_000)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              حداکثر بودجه سرمایه‌گذاری (میلیون تومان)
            </label>
            <input
              type="number"
              dir="ltr"
              min={100}
              value={maxBudgetMillion}
              onChange={(e) => setMaxBudgetMillion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              معادل {formatShortToman((Number(maxBudgetMillion) || 0) * 1_000_000)}
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              شرح رویکرد سرمایه‌گذاری و نوع ایده‌های مورد نیاز شما *
            </label>
            <textarea
              rows={3}
              required
              value={investmentThesis}
              onChange={(e) => setInvestmentThesis(e.target.value)}
              placeholder="مثلاً: به دنبال تیم‌های جوان با نمونه اولیه سخت‌افزاری یا نرم‌افزار فروشگاهی هستیم که قابلیت عرضه سریع در بازار ایران و پرستاشاپ را داشته باشند..."
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm leading-7 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              کلیدواژه‌های کلیدی برای الگوریتم هوش مصنوعی (با ویرگول جدا کنید)
            </label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm"
            />
          </div>

          {!currentUser && (
            <div className="md:col-span-2 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام نماینده / کارفرما *
                </label>
                <input
                  type="text"
                  required
                  value={guestFullName}
                  onChange={(e) => setGuestFullName(e.target.value)}
                  placeholder="مهندس..."
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ایمیل کاری *
                </label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="ceo@company.ir"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره تماس
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {formError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-2.5 text-rose-800 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">حق عضویت انتخاب‌شده</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {formatToman(activePlan.priceToman)}
            </div>
            <div className="text-xs text-slate-600">
              {activePlan.name} ({activePlan.durationLabel}) + اجرای آنی موتور AI
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md transition-colors cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>پرداخت حق عضویت و فعال‌سازی تطبیق AI</span>
          </button>
        </div>
      </form>

      {/* Active Investors Directory */}
      <section className="space-y-5">
        <h2 className="text-xl font-extrabold text-slate-900">
          کارفرمایان و سرمایه‌گذاران فعال عضو در ایده‌پل ({toPersianDigits(investors.length)})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {investors.map((inv) => (
            <div
              key={inv.id}
              className="card-surface rounded-2xl p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <BadgeCheck className="w-4 h-4" />
                    عضو تأییدشده
                  </span>
                  <span className="text-xs text-slate-500">{inv.userName}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {inv.organizationName}
                </h3>
                <p className="text-xs text-slate-600 leading-6 line-clamp-3">
                  {inv.investmentThesis}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs text-indigo-800 font-extrabold">
                  بودجه: {formatShortToman(inv.minBudgetToman)} تا{" "}
                  {formatShortToman(inv.maxBudgetToman)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {inv.preferredCategories.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PaymentGatewayModal
        open={paymentModalOpen}
        title="پرداخت حق عضویت کارفرما و سرمایه‌گذار"
        subtitle="فعال‌سازی آنی عضویت، مشاهده تماس ایده‌پردازان و تطبیق خودکار هوش مصنوعی"
        planName={`${activePlan.name} (${activePlan.durationLabel})`}
        amountToman={activePlan.priceToman}
        loading={submitting}
        onClose={() => setPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        </div>
      }
    >
      <InvestorsInner />
    </Suspense>
  );
}
