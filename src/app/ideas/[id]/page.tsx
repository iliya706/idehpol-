"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Users,
  Calendar,
  Lock,
  Phone,
  Mail,
  Store,
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Handshake,
  BadgeCheck,
} from "lucide-react";
import {
  STAGE_LABELS,
  FUNDING_STATUS_LABELS,
  MATCH_STATUS_LABELS,
  formatShortToman,
  formatToman,
  toPersianDigits,
} from "@/lib/constants";

interface IdeaDetailResponse {
  idea: {
    id: number;
    slug: string;
    title: string;
    tagline: string;
    description: string;
    marketPotential: string;
    category: string;
    stage: string;
    fundingNeededToman: number;
    equityOfferedPercent: number;
    teamSize: number;
    innovatorAge: number | null;
    city: string | null;
    tags: string[];
    coverImage: string;
    demoUrl: string | null;
    prestashopProductRef: string | null;
    listingPlan: string;
    fundingStatus: string;
    aiReadinessScore: number;
    viewsCount: number;
  };
  innovator: {
    id: number;
    fullName: string;
    city: string | null;
    bio: string | null;
    email: string | null;
    phone: string | null;
    contactUnlocked: boolean;
  };
  matches: Array<{
    id: number;
    compatibilityScore: number;
    categoryScore: number;
    budgetScore: number;
    stageScore: number;
    synergyScore: number;
    aiSummary: string;
    aiHighlights: string[];
    aiRiskNote: string;
    status: string;
    investorMessage: string | null;
    proposedAmountToman: number | null;
    investor: {
      id: number;
      organizationName: string;
      membershipPlan: string;
      verified: boolean;
      minBudgetToman: number;
      maxBudgetToman: number;
    };
  }>;
}

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<IdeaDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAi, setRunningAi] = useState(false);

  // Proposal state for a chosen match
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [proposalMsg, setProposalMsg] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [submittingAction, setSubmittingAction] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadIdea = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideas/${params.id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "ایده مورد نظر یافت نشد");
      } else {
        setData(json);
        setProposalAmount(String(json.idea.fundingNeededToman));
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadIdea();
  }, [loadIdea]);

  async function handleRunAiForIdea() {
    if (!data) return;
    setRunningAi(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: data.idea.id }),
      });
      if (res.ok) {
        await loadIdea();
        setFeedback("تحلیل هوش مصنوعی با تمام کارفرمایان و سرمایه‌گذاران عضو به‌روزرسانی شد.");
      }
    } finally {
      setRunningAi(false);
    }
  }

  async function handleMatchAction(
    matchId: number,
    status: "meeting_requested" | "funded"
  ) {
    setSubmittingAction(matchId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/ai-match/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          investorMessage:
            proposalMsg.trim() ||
            (status === "funded"
              ? "پیشنهاد سرمایه‌گذاری نهایی و تأیید شد. تبریک به تیم نوآور!"
              : "درخواست جلسه ارزیابی و مذاکره برای سرمایه‌گذاری روی این ایده ثبت شد."),
          proposedAmountToman: Number(proposalAmount) || data?.idea.fundingNeededToman,
        }),
      });
      if (res.ok) {
        setActiveMatchId(null);
        setProposalMsg("");
        await loadIdea();
        setFeedback(
          status === "funded"
            ? "تبریک! سرمایه‌گذاری روی این ایده تأیید شد و وضعیت محصول به «سرمایه‌گذار پیدا شد» تغییر یافت."
            : "درخواست جلسه و پیشنهاد سرمایه‌گذاری ثبت شد و ایده وارد مرحله «در حال مذاکره هوشمند» گردید."
        );
      }
    } finally {
      setSubmittingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        <span className="text-sm font-medium">در حال بارگذاری پرونده ایده...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">{error || "یافت نشد"}</h1>
        <Link
          href="/ideas"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کاتالوگ ایده‌ها</span>
        </Link>
      </div>
    );
  }

  const { idea, innovator, matches } = data;
  const stageMeta = STAGE_LABELS[idea.stage] ?? STAGE_LABELS.prototype;
  const fundingMeta =
    FUNDING_STATUS_LABELS[idea.fundingStatus] ?? FUNDING_STATUS_LABELS.unfunded;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-indigo-700"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کاتالوگ ایده‌ها</span>
        </Link>

        {idea.prestashopProductRef && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
            <Store className="w-3.5 h-3.5" />
            <span>کد اتصال پرستاشاپ:</span>
            <code dir="ltr" className="font-mono">
              {idea.prestashopProductRef}
            </code>
          </span>
        )}
      </div>

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-900 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Pitch Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-surface rounded-3xl overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              <img
                src={idea.coverImage}
                alt={idea.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 left-4 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${fundingMeta.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${fundingMeta.dotClass}`} />
                  {fundingMeta.label}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  امتیاز آمادگی AI: {toPersianDigits(idea.aiReadinessScore)} از ۱۰۰
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-bold">
                  {idea.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-lg border text-xs font-bold ${stageMeta.badgeClass}`}
                >
                  {stageMeta.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  هزینه ثبت پرداخت‌شده و تأییدشده
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                  {idea.title}
                </h1>
                <p className="text-base text-slate-600 leading-7">{idea.tagline}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-900">
                  شرح کامل ایده و محصول
                </h2>
                <p className="text-sm sm:text-base text-slate-700 leading-8 whitespace-pre-line">
                  {idea.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-900">
                  پتانسیل بازار و مدل درآمدی
                </h2>
                <p className="text-sm sm:text-base text-slate-700 leading-8 whitespace-pre-line">
                  {idea.marketPotential}
                </p>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-xl bg-[#FAF9F6] border border-[#E7E5DE] text-xs font-semibold text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Matches for this Idea */}
          <section className="card-surface rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                  <span>سرمایه‌گذاران مچ‌شده توسط هوش مصنوعی</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  موتور AI این ایده را با معیارهای کارفرمایان عضو مقایسه کرده و بهترین
                  گزینه‌ها را رتبه‌بندی نموده است.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiForIdea}
                disabled={runningAi}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
              >
                {runningAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>اسکن مجدد AI</span>
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE] p-6 text-center space-y-3">
                <p className="text-sm font-bold text-slate-700">
                  هنوز تطبیقی ثبت نشده است. روی «اسکن مجدد AI» کلیک کنید.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => {
                  const statusMeta =
                    MATCH_STATUS_LABELS[m.status] ?? MATCH_STATUS_LABELS.suggested;
                  const isExpanded = activeMatchId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-[#E4E1D8] bg-[#FAF9F6] p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-extrabold text-slate-900">
                              {m.investor.organizationName}
                            </span>
                            {m.investor.verified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-600" />
                            )}
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            بازه بودجه سرمایه‌گذار:{" "}
                            <strong>
                              {formatShortToman(m.investor.minBudgetToman)} تا{" "}
                              {formatShortToman(m.investor.maxBudgetToman)}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-2xl px-4 py-2 self-start">
                          <span className="text-xs text-slate-500">تطابق AI</span>
                          <span className="text-xl font-extrabold text-indigo-800">
                            {toPersianDigits(m.compatibilityScore)}٪
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-7 bg-white rounded-xl p-3.5 border border-slate-100">
                        {m.aiSummary}
                      </p>

                      {/* 4-Factor Mini Bars */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        {[
                          { label: "تطابق حوزه", val: m.categoryScore },
                          { label: "تناسب بودجه", val: m.budgetScore },
                          { label: "مرحله محصول", val: m.stageScore },
                          { label: "هم‌افزایی", val: m.synergyScore },
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className="bg-white rounded-xl p-2.5 border border-slate-100"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>{metric.label}</span>
                              <span className="font-bold text-slate-900">
                                {toPersianDigits(metric.val)}٪
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${metric.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {m.aiRiskNote && (
                        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{m.aiRiskNote}</span>
                        </div>
                      )}

                      {m.investorMessage && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 space-y-1">
                          <div className="font-bold">پیام ثبت‌شده کارفرما/سرمایه‌گذار:</div>
                          <p className="leading-6">{m.investorMessage}</p>
                          {m.proposedAmountToman && (
                            <div className="font-extrabold pt-1">
                              مبلغ پیشنهادی: {formatToman(m.proposedAmountToman)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons for Negotiating / Funding */}
                      {m.status !== "funded" && (
                        <div className="pt-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMatchId(isExpanded ? null : m.id)
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>ارسال درخواست جلسه / پیشنهاد سرمایه‌گذاری</span>
                            </button>

                            <button
                              type="button"
                              disabled={submittingAction === m.id}
                              onClick={() => handleMatchAction(m.id, "funded")}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              {submittingAction === m.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Handshake className="w-3.5 h-3.5" />
                              )}
                              <span>تأیید نهایی سرمایه‌گذاری</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  مبلغ سرمایه‌گذاری پیشنهادی (تومان)
                                </label>
                                <input
                                  type="number"
                                  dir="ltr"
                                  value={proposalAmount}
                                  onChange={(e) => setProposalAmount(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  پیام به ایده‌پرداز برای هماهنگی جلسه
                                </label>
                                <textarea
                                  rows={2}
                                  value={proposalMsg}
                                  onChange={(e) => setProposalMsg(e.target.value)}
                                  placeholder="مثلاً: ایده شما با حوزه فعالیت مجموعه ما تطابق عالی دارد؛ مایلیم جلسه آنلاین برگزار کنیم..."
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={submittingAction === m.id}
                                onClick={() =>
                                  handleMatchAction(m.id, "meeting_requested")
                                }
                                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer"
                              >
                                ثبت پیشنهاد و شروع مذاکره
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sticky Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Funding Card */}
          <div className="card-surface rounded-3xl p-6 space-y-5">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">
                سرمایه درخواستی برای اجرا و توسعه
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-800">
                {formatShortToman(idea.fundingNeededToman)}
              </div>
              <div className="text-xs text-slate-500">
                معادل {formatToman(idea.fundingNeededToman)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="rounded-2xl bg-[#FAF9F6] border border-[#ECEAE2] p-3">
                <div className="text-[11px] text-slate-500">مشارکت / سهام</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {toPersianDigits(idea.equityOfferedPercent)}٪
                </div>
              </div>
              <div className="rounded-2xl bg-[#FAF9F6] border border-[#ECEAE2] p-3">
                <div className="text-[11px] text-slate-500">اندازه تیم</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {toPersianDigits(idea.teamSize)} نفر
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  شهر استقرار
                </span>
                <span className="font-bold text-slate-900">{idea.city || "تهران"}</span>
              </div>
              {idea.innovatorAge && (
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    سن بنیان‌گذار
                  </span>
                  <span className="font-bold text-slate-900">
                    {toPersianDigits(idea.innovatorAge)} سال
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  تعداد سرمایه‌گذاران مچ‌شده
                </span>
                <span className="font-bold text-indigo-700">
                  {toPersianDigits(matches.length)} سرمایه‌گذار
                </span>
              </div>
            </div>

            <Link
              href={`/ai-match?ideaId=${idea.id}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>باز کردن در موتور تطبیق AI</span>
            </Link>
          </div>

          {/* Innovator Contact Card (Gated for Active Paid Investors!) */}
          <div className="card-surface rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 font-extrabold text-lg flex items-center justify-center">
                {innovator.fullName.slice(0, 1)}
              </div>
              <div>
                <div className="text-xs text-slate-500">جوان ایده‌پرداز</div>
                <div className="text-base font-extrabold text-slate-900">
                  {innovator.fullName}
                </div>
              </div>
            </div>

            {innovator.bio && (
              <p className="text-xs text-slate-600 leading-6">{innovator.bio}</p>
            )}

            {innovator.contactUnlocked ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>اطلاعات تماس برای عضویت شما باز است</span>
                </div>
                {innovator.phone && (
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      تلفن:
                    </span>
                    <span dir="ltr" className="font-mono font-bold">
                      {innovator.phone}
                    </span>
                  </div>
                )}
                {innovator.email && (
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      ایمیل:
                    </span>
                    <span dir="ltr" className="font-mono font-bold">
                      {innovator.email}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E2D9] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>مشاهده تماس مستقیم مخصوص کارفرمایان عضو</span>
                </div>
                <p className="text-xs text-slate-600 leading-6">
                  برای مشاهده شماره تماس، ایمیل مستقیم و دریافت تحلیل کامل هوش مصنوعی، کافی
                  است عضویت سرمایه‌گذاران را فعال کنید.
                </p>
                <Link
                  href="/investors"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span>عضویت سرمایه‌گذاران و باز کردن تماس</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
