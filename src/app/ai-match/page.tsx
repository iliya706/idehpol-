"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  Handshake,
  Send,
  AlertTriangle,
  Loader2,
  ArrowUpLeft,
  BadgeCheck,
  Filter,
} from "lucide-react";
import {
  FUNDING_STATUS_LABELS,
  MATCH_STATUS_LABELS,
  STAGE_LABELS,
  formatShortToman,
  formatToman,
  toPersianDigits,
} from "@/lib/constants";

interface MatchRow {
  id: number;
  ideaId: number;
  investorProfileId: number;
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
  idea: {
    id: number;
    title: string;
    category: string;
    stage: string;
    fundingNeededToman: number;
    equityOfferedPercent: number;
    fundingStatus: string;
    coverImage: string;
    innovatorName: string;
  };
  investor: {
    id: number;
    organizationName: string;
    minBudgetToman: number;
    maxBudgetToman: number;
    verified: boolean;
  };
}

interface InvestorOption {
  id: number;
  organizationName: string;
}

interface IdeaOption {
  id: number;
  title: string;
  fundingStatus: string;
}

function AiMatchInner() {
  const searchParams = useSearchParams();

  const [investors, setInvestors] = useState<InvestorOption[]>([]);
  const [ideasList, setIdeasList] = useState<IdeaOption[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);

  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(
    searchParams.get("investorProfileId") || "all"
  );
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(
    searchParams.get("ideaId") || "all"
  );
  const [onlyUnfunded, setOnlyUnfunded] = useState(false);
  const [customKeywords, setCustomKeywords] = useState("");

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [openProposalId, setOpenProposalId] = useState<number | null>(null);
  const [proposalMsg, setProposalMsg] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (selectedInvestorId !== "all") qs.set("investorProfileId", selectedInvestorId);
      if (selectedIdeaId !== "all") qs.set("ideaId", selectedIdeaId);
      if (onlyUnfunded) qs.set("onlyUnfunded", "true");

      const res = await fetch(`/api/ai-match?${qs.toString()}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } finally {
      setLoading(false);
    }
  }, [selectedInvestorId, selectedIdeaId, onlyUnfunded]);

  useEffect(() => {
    Promise.all([
      fetch("/api/investors").then((r) => r.json()),
      fetch("/api/ideas").then((r) => r.json()),
    ])
      .then(([invRes, ideaRes]) => {
        setInvestors(invRes.investors ?? []);
        setIdeasList(ideaRes.ideas ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleRunAiScan() {
    setScanning(true);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {};
      if (selectedInvestorId !== "all") {
        payload.investorProfileId = Number(selectedInvestorId);
      }
      if (selectedIdeaId !== "all") {
        payload.ideaId = Number(selectedIdeaId);
      }
      if (customKeywords.trim()) {
        payload.customKeywords = customKeywords.trim();
      }

      const res = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setNotice(
          `موتور هوش مصنوعی ${toPersianDigits(json.computedCount)} جفت ایده-سرمایه‌گذار را مجدداً تحلیل و رتبه‌بندی کرد.`
        );
        await fetchMatches();
      }
    } finally {
      setScanning(false);
    }
  }

  async function handleUpdateMatch(
    match: MatchRow,
    status: "meeting_requested" | "funded"
  ) {
    setUpdatingId(match.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/ai-match/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          investorMessage:
            proposalMsg.trim() ||
            (status === "funded"
              ? `سرمایه‌گذاری «${match.investor.organizationName}» روی ایده «${match.idea.title}» تأیید نهایی شد.`
              : `کارفرما/سرمایه‌گذار «${match.investor.organizationName}» درخواست جلسه ارزیابی و مذاکره ارسال کرد.`),
          proposedAmountToman: Number(proposalAmount) || match.idea.fundingNeededToman,
        }),
      });
      if (res.ok) {
        setOpenProposalId(null);
        setProposalMsg("");
        setNotice(
          status === "funded"
            ? `عالی! ایده «${match.idea.title}» با «${match.investor.organizationName}» مچ نهایی شد و وضعیت آن به «سرمایه‌گذار پیدا شد ✓» تغییر یافت.`
            : `درخواست جلسه برای ایده «${match.idea.title}» ثبت شد و وضعیت آن به «در حال مذاکره هوشمند» ارتقا یافت.`
        );
        await fetchMatches();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-l from-indigo-950 via-indigo-900 to-slate-900 text-white p-7 sm:p-10 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-300 text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>موتور تطبیق چندمعیاره هوش مصنوعی ایده‌پل</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold leading-snug">
          اتصال هوشمند ایده‌های بدون سرمایه‌گذار به کارفرمایان عضو
        </h1>
        <p className="text-sm sm:text-base text-indigo-100/90 max-w-3xl leading-7">
          الگوریتم AI ما همپوشانی حوزه، تناسب دقیق بودجه، مرحله بلوغ محصول و کلیدواژه‌های
          تخصصی را می‌سنجد تا ایده‌های جوانان را با مناسب‌ترین سرمایه‌گذار مچ کند.
        </p>
      </div>

      {/* Interactive AI Control Panel */}
      <div className="card-surface rounded-3xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              انتخاب کارفرما / سرمایه‌گذار عضو
            </label>
            <select
              value={selectedInvestorId}
              onChange={(e) => setSelectedInvestorId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">همه کارفرمایان و سرمایه‌گذاران عضو</option>
              {investors.map((inv) => (
                <option key={inv.id} value={String(inv.id)}>
                  {inv.organizationName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              انتخاب ایده یا محصول مشخص
            </label>
            <select
              value={selectedIdeaId}
              onChange={(e) => setSelectedIdeaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">همه ایده‌های ثبت‌شده</option>
              {ideasList.map((idea) => (
                <option key={idea.id} value={String(idea.id)}>
                  {idea.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              کلیدواژه‌های تمرکز اضافی برای AI (اختیاری)
            </label>
            <input
              type="text"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              placeholder="مثلاً: صادراتی، گلخانه، پرستاشاپ، خورشیدی"
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <label className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyUnfunded}
              onChange={(e) => setOnlyUnfunded(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-700"
            />
            <Filter className="w-4 h-4 text-amber-600" />
            <span>فقط نمایش ایده‌های بدون سرمایه‌گذار (در اولویت جذب سرمایه)</span>
          </label>

          <button
            type="button"
            onClick={handleRunAiScan}
            disabled={scanning}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تحلیل هوشمند و امتیازدهی...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>اجرای تحلیل و تطبیق هوش مصنوعی</span>
              </>
            )}
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-900 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
          <span className="text-sm font-medium">در حال بارگذاری نتایج تطبیق هوش مصنوعی...</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="card-surface rounded-3xl p-12 text-center space-y-4">
          <p className="text-lg font-extrabold text-slate-800">
            تطبیقی برای این فیلتر یافت نشد
          </p>
          <p className="text-sm text-slate-500">
            روی دکمه «اجرای تحلیل و تطبیق هوش مصنوعی» کلیک کنید تا موتور AI تمام ترکیبات را
            محاسبه کند.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-xs sm:text-sm text-slate-600">
            نمایش <strong>{toPersianDigits(matches.length)}</strong> تطبیق رتبه‌بندی‌شده بر
            اساس بالاترین درصد هم‌سویی هوشمند
          </div>

          {matches.map((m) => {
            const fundingMeta =
              FUNDING_STATUS_LABELS[m.idea.fundingStatus] ?? FUNDING_STATUS_LABELS.unfunded;
            const matchStatusMeta =
              MATCH_STATUS_LABELS[m.status] ?? MATCH_STATUS_LABELS.suggested;
            const stageMeta = STAGE_LABELS[m.idea.stage] ?? STAGE_LABELS.prototype;
            const isProposalOpen = openProposalId === m.id;

            const scoreColor =
              m.compatibilityScore >= 85
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : m.compatibilityScore >= 72
                  ? "text-indigo-800 bg-indigo-50 border-indigo-200"
                  : "text-amber-800 bg-amber-50 border-amber-200";

            return (
              <article
                key={m.id}
                className="card-surface rounded-3xl p-5 sm:p-7 space-y-5"
              >
                {/* Top Paired Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={m.idea.coverImage}
                      alt={m.idea.title}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0 hidden sm:block"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${fundingMeta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${fundingMeta.dotClass}`} />
                          {fundingMeta.label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${matchStatusMeta.badgeClass}`}
                        >
                          {matchStatusMeta.label}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {m.idea.category} • {stageMeta.label}
                        </span>
                      </div>

                      <Link
                        href={`/ideas/${m.idea.id}`}
                        className="text-lg font-extrabold text-slate-900 hover:text-indigo-700 transition-colors block"
                      >
                        {m.idea.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          ایده‌پرداز: <strong>{m.idea.innovatorName}</strong>
                        </span>
                        <span>
                          سرمایه مورد نیاز:{" "}
                          <strong className="text-indigo-800">
                            {formatShortToman(m.idea.fundingNeededToman)}
                          </strong>{" "}
                          ({toPersianDigits(m.idea.equityOfferedPercent)}٪ مشارکت)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investor Badge + Compatibility Score */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-right lg:text-left">
                      <div className="text-[11px] text-slate-500">سرمایه‌گذار / کارفرمای مچ‌شده</div>
                      <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1 lg:justify-end">
                        <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{m.investor.organizationName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        بودجه: {formatShortToman(m.investor.minBudgetToman)} تا{" "}
                        {formatShortToman(m.investor.maxBudgetToman)}
                      </div>
                    </div>

                    <div
                      className={`px-4 py-2.5 rounded-2xl border text-center min-w-[92px] ${scoreColor}`}
                    >
                      <div className="text-[10px] font-bold opacity-80">تطابق AI</div>
                      <div className="text-2xl font-extrabold leading-tight">
                        {toPersianDigits(m.compatibilityScore)}٪
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4-Factor Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "تطابق حوزه صنعت", val: m.categoryScore },
                    { label: "تناسب سرمایه و بودجه", val: m.budgetScore },
                    { label: "تناسب مرحله محصول", val: m.stageScore },
                    { label: "هم‌افزایی کلیدواژه AI", val: m.synergyScore },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-3"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-extrabold text-slate-900">
                          {toPersianDigits(item.val)}٪
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${item.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Explanation + Highlights */}
                <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 leading-7">
                    <Sparkles className="w-4 h-4 text-indigo-700 shrink-0 mt-1" />
                    <p>{m.aiSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    {m.aiHighlights.map((hl) => (
                      <div
                        key={hl}
                        className="flex items-start gap-1.5 text-xs text-slate-700 bg-white rounded-xl p-2.5 border border-indigo-100/70"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>نکته بررسی پیش از قرارداد:</strong> {m.aiRiskNote}
                    </span>
                  </div>
                </div>

                {m.investorMessage && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-950 space-y-1">
                    <div className="font-extrabold">پیام و پیشنهاد ثبت‌شده سرمایه‌گذار:</div>
                    <p className="leading-6">{m.investorMessage}</p>
                    {m.proposedAmountToman && (
                      <div className="font-extrabold text-emerald-800 pt-1">
                        مبلغ پیشنهادی: {formatToman(m.proposedAmountToman)}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {m.status !== "funded" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenProposalId(isProposalOpen ? null : m.id);
                            setProposalAmount(String(m.idea.fundingNeededToman));
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ارسال درخواست جلسه و پیشنهاد</span>
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === m.id}
                          onClick={() => handleUpdateMatch(m, "funded")}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {updatingId === m.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Handshake className="w-3.5 h-3.5" />
                          )}
                          <span>تأیید سرمایه‌گذاری (تکمیل جذب سرمایه)</span>
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                        <CheckCircle2 className="w-4 h-4" />
                        این ایده با موفقیت سرمایه‌گذار خود را پیدا کرده است
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/ideas/${m.idea.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    <span>مشاهده صفحه کامل ایده</span>
                    <ArrowUpLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {isProposalOpen && (
                  <div className="rounded-2xl bg-[#FAF9F6] border border-indigo-200 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          مبلغ سرمایه‌گذاری پیشنهادی (تومان)
                        </label>
                        <input
                          type="number"
                          dir="ltr"
                          value={proposalAmount}
                          onChange={(e) => setProposalAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-xs font-bold text-indigo-800 pb-2.5">
                          معادل {formatToman(Number(proposalAmount) || 0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        پیام به ایده‌پرداز برای شروع مذاکره
                      </label>
                      <textarea
                        rows={2}
                        value={proposalMsg}
                        onChange={(e) => setProposalMsg(e.target.value)}
                        placeholder="شرح علاقه‌مندی، زمان پیشنهادی جلسه و شرایط همکاری..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updatingId === m.id}
                        onClick={() => handleUpdateMatch(m, "meeting_requested")}
                        className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer"
                      >
                        ارسال پیشنهاد و ثبت مذاکره
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenProposalId(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AiMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        </div>
      }
    >
      <AiMatchInner />
    </Suspense>
  );
}
