"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lightbulb,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ArrowLeft,
  Star,
  Store,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  IDEA_CATEGORIES,
  IDEA_LISTING_PLANS,
  STAGE_LABELS,
  COVER_IMAGE_PRESETS,
  formatToman,
  toPersianDigits,
} from "@/lib/constants";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";

interface SubmissionSuccess {
  idea: { id: number; title: string; aiReadinessScore: number };
  payment: { trackingCode: string; amountToman: number; planName: string };
  matches: Array<{
    id: number;
    compatibilityScore: number;
    organizationName: string;
    aiSummary: string;
  }>;
}

function SubmitIdeaInner() {
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    fullName: string;
    email: string;
  } | null>(null);

  const [listingPlan, setListingPlan] = useState<"standard" | "featured">(
    searchParams.get("plan") === "featured" ? "featured" : "standard"
  );
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<string>(IDEA_CATEGORIES[0]);
  const [stage, setStage] = useState<"concept" | "prototype" | "mvp" | "growth">("prototype");
  const [fundingMillion, setFundingMillion] = useState("850");
  const [equityPercent, setEquityPercent] = useState("18");
  const [teamSize, setTeamSize] = useState("3");
  const [innovatorAge, setInnovatorAge] = useState("24");
  const [city, setCity] = useState("تهران");
  const [description, setDescription] = useState("");
  const [marketPotential, setMarketPotential] = useState("");
  const [tagsInput, setTagsInput] = useState("هوش مصنوعی، محصول بومی، نوآوری");
  const [coverImage, setCoverImage] = useState(COVER_IMAGE_PRESETS[0].url);
  const [demoUrl, setDemoUrl] = useState("");
  const [prestashopProductRef, setPrestashopProductRef] = useState(
    searchParams.get("ref") || ""
  );

  // Guest info if user not logged in
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [sourceChannel, setSourceChannel] = useState("direct");
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SubmissionSuccess | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user ?? null))
      .catch(() => {});

    try {
      const src =
        searchParams.get("source") || sessionStorage.getItem("idehpol_source") || "direct";
      setSourceChannel(src);
      const savedRef = sessionStorage.getItem("idehpol_ps_ref");
      if (!searchParams.get("ref") && savedRef) {
        setPrestashopProductRef(savedRef);
      }
    } catch {}
  }, [searchParams]);

  const selectedPlan =
    IDEA_LISTING_PLANS.find((p) => p.id === listingPlan) ?? IDEA_LISTING_PLANS[0];

  function handleOpenPayment(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 4) {
      setFormError("لطفاً عنوان ایده یا محصول را حداقل با ۴ کاراکتر وارد کنید.");
      return;
    }
    if (tagline.trim().length < 8) {
      setFormError("خلاصه یک‌خطی جذاب محصول را کامل‌تر بنویسید.");
      return;
    }
    if (description.trim().length < 20) {
      setFormError("شرح کامل محصول باید حداقل ۲۰ کاراکتر باشد تا هوش مصنوعی دقیق تحلیل کند.");
      return;
    }
    if (marketPotential.trim().length < 10) {
      setFormError("توضیح بازار هدف و مدل درآمدی را وارد کنید.");
      return;
    }
    if (!currentUser && (!guestFullName.trim() || !guestEmail.trim())) {
      setFormError("لطفاً نام و ایمیل خود را برای ایجاد حساب ایده‌پرداز وارد کنید.");
      return;
    }

    setPaymentModalOpen(true);
  }

  async function handleConfirmPayment() {
    setSubmitting(true);
    setFormError(null);
    try {
      const tags = tagsInput
        .split(/[،,]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tagline,
          category,
          stage,
          fundingNeededToman: Math.max(10, Number(fundingMillion) || 500) * 1_000_000,
          equityOfferedPercent: Number(equityPercent) || 15,
          teamSize: Number(teamSize) || 2,
          innovatorAge: Number(innovatorAge) || 24,
          city,
          description,
          marketPotential,
          tags,
          coverImage,
          demoUrl,
          prestashopProductRef,
          listingPlan,
          sourceChannel,
          guestFullName: currentUser ? undefined : guestFullName,
          guestEmail: currentUser ? undefined : guestEmail,
          guestPhone: currentUser ? undefined : guestPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "خطا در ثبت ایده رخ داد");
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
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              پرداخت موفق! ایده شما منتشر شد و توسط AI تحلیل گردید
            </h1>
            <p className="text-sm text-slate-600">
              محصول «<strong>{successData.idea.title}</strong>» اکنون در کاتالوگ رسمی ایده‌پل
              فعال است.
            </p>
          </div>

          {/* Receipt Box */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE] p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">کد رهگیری پرداخت</div>
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
            <div>
              <div className="text-xs text-slate-500">امتیاز آمادگی AI شما</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">
                {toPersianDigits(successData.idea.aiReadinessScore)} از ۱۰۰
              </div>
            </div>
          </div>

          {/* Instant AI Matches Found */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-700" />
              <span>
                سرمایه‌گذاران مچ‌شده با ایده شما ({toPersianDigits(successData.matches.length)}{" "}
                مورد):
              </span>
            </h2>

            {successData.matches.length === 0 ? (
              <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4">
                ایده شما در صف موتور هوش مصنوعی قرار گرفت و به محض عضویت سرمایه‌گذاران جدید در
                این حوزه، به‌صورت خودکار معرفی خواهد شد.
              </p>
            ) : (
              <div className="space-y-3">
                {successData.matches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-extrabold text-slate-900">
                        {m.organizationName}
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
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href={`/ideas/${successData.idea.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm"
            >
              <span>مشاهده صفحه اختصاصی ایده</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href={`/ai-match?ideaId=${successData.idea.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>مشاهده در موتور مچ AI</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
            >
              ورود به پنل کاربری
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
          <Lightbulb className="w-4 h-4" />
          <span>ثبت ایده و محصول جوانان در ایده‌پل</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          محصول خود را ثبت کنید و سرمایه‌گذار مناسبش را با هوش مصنوعی پیدا کنید
        </h1>
        <p className="text-sm text-slate-600 leading-7">
          پس از تکمیل مشخصات و پرداخت هزینه انتشار، ایده شما بلافاصله در کاتالوگ منتشر شده و
          توسط موتور هوش مصنوعی به کارفرمایان و سرمایه‌گذاران هم‌تراز معرفی می‌شود.
        </p>
      </div>

      <form onSubmit={handleOpenPayment} className="space-y-8">
        {/* Step 1: Select Listing Plan */}
        <section className="card-surface rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-700 text-white text-xs font-extrabold flex items-center justify-center">
              ۱
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              انتخاب پلن پرداخت هزینه ثبت و انتشار ایده
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IDEA_LISTING_PLANS.map((plan) => {
              const active = listingPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setListingPlan(plan.id)}
                  className={`text-right rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                    active
                      ? "border-indigo-700 bg-indigo-50/40 shadow-sm"
                      : "border-[#E7E5DE] bg-white hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      {plan.id === "featured" && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      )}
                      {plan.name}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-700 mb-2">
                    {formatToman(plan.priceToman)}
                  </div>
                  <p className="text-xs text-slate-600 leading-6 mb-3">
                    {plan.description}
                  </p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-1.5 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Idea / Product Details */}
        <section className="card-surface rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-700 text-white text-xs font-extrabold flex items-center justify-center">
              ۲
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              مشخصات فنی، مالی و تجاری محصول یا ایده
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان ایده یا محصول *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: دستگاه هوشمند خشک‌کن میوه خورشیدی خانگی با کنترل موبایل"
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                خلاصه یک‌خطی جذاب (Tagline) *
              </label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="ارزش پیشنهادی محصول را در یک جمله کوتاه و اثرگذار بنویسید..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حوزه و دسته‌بندی اصلی *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مرحله فعلی بلوغ محصول *
              </label>
              <select
                value={stage}
                onChange={(e) =>
                  setStage(e.target.value as "concept" | "prototype" | "mvp" | "growth")
                }
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سرمایه مورد نیاز (به میلیون تومان) *
              </label>
              <input
                type="number"
                dir="ltr"
                min={10}
                max={50000}
                value={fundingMillion}
                onChange={(e) => setFundingMillion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-indigo-700 font-semibold mt-1 block">
                معادل {formatToman((Number(fundingMillion) || 0) * 1_000_000)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                درصد سهام یا مشارکت پیشنهادی به سرمایه‌گذار (%) *
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                max={80}
                value={equityPercent}
                onChange={(e) => setEquityPercent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تعداد اعضای تیم
                </label>
                <input
                  type="number"
                  dir="ltr"
                  min={1}
                  max={50}
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3 py-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  سن ایده‌پرداز
                </label>
                <input
                  type="number"
                  dir="ltr"
                  min={14}
                  max={45}
                  value={innovatorAge}
                  onChange={(e) => setInnovatorAge(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3 py-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شهر استقرار
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شرح کامل محصول، مشکل بازار و راه‌حل نوآورانه *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح دهید این محصول دقیقاً چه مشکلی را حل می‌کند، چه مزیت رقابتی دارد و تا الان چه کارهایی انجام داده‌اید..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm leading-7 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                پتانسیل بازار و مدل درآمدی *
              </label>
              <textarea
                rows={3}
                required
                value={marketPotential}
                onChange={(e) => setMarketPotential(e.target.value)}
                placeholder="مشتریان اصلی چه کسانی هستند و محصول چگونه به سودآوری و بازگشت سرمایه می‌رسد؟"
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm leading-7 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                کلیدواژه‌های تخصصی برای تطبیق هوش مصنوعی (با ویرگول جدا کنید)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-700" />
                <span>کد یا شناسه محصول در پرستاشاپ (اختیاری)</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={prestashopProductRef}
                onChange={(e) => setPrestashopProductRef(e.target.value)}
                placeholder="مثلاً PS-PROD-402"
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                انتخاب تصویر شاخص محصول
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COVER_IMAGE_PRESETS.map((preset) => {
                  const active = coverImage === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className={`rounded-xl overflow-hidden border-2 text-right transition-all cursor-pointer ${
                        active
                          ? "border-indigo-700 ring-2 ring-indigo-200"
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="aspect-[16/9] bg-slate-100">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-[11px] font-bold text-slate-700 bg-white truncate">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                لینک دمو یا وب‌سایت نمونه اولیه (اختیاری)
              </label>
              <input
                type="url"
                dir="ltr"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Step 3: Innovator Account Info */}
        <section className="card-surface rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-700 text-white text-xs font-extrabold flex items-center justify-center">
              ۳
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              اطلاعات صاحب ایده
            </h2>
          </div>

          {currentUser ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3">
              <div className="text-sm text-emerald-900">
                وارد شده با حساب <strong>{currentUser.fullName}</strong> ({currentUser.email}) —
                ایده و رسید پرداخت به نام شما ثبت می‌شود.
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  required
                  value={guestFullName}
                  onChange={(e) => setGuestFullName(e.target.value)}
                  placeholder="مثلاً علیرضا شفیعی"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ایمیل *
                </label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل (برای تماس سرمایه‌گذار عضو)
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
        </section>

        {formError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-2.5 text-rose-800 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Bar */}
        <div className="card-surface rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-l from-indigo-50/60 to-white border-indigo-200">
          <div>
            <div className="text-xs text-slate-500">هزینه قابل پرداخت برای ثبت و انتشار</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {formatToman(selectedPlan.priceToman)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              پلن انتخابی: {selectedPlan.name} + ورود فوری به موتور تطبیق AI
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-md transition-colors cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>ادامه به درگاه پرداخت و انتشار ایده</span>
          </button>
        </div>
      </form>

      <PaymentGatewayModal
        open={paymentModalOpen}
        title="پرداخت هزینه ثبت ایده جوانان"
        subtitle="پس از تأیید پرداخت، ایده شما منتشر و بلافاصله با سرمایه‌گذاران مچ می‌شود"
        planName={selectedPlan.name}
        amountToman={selectedPlan.priceToman}
        loading={submitting}
        onClose={() => setPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}

export default function SubmitIdeaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        </div>
      }
    >
      <SubmitIdeaInner />
    </Suspense>
  );
}
