import type { Idea, InvestorProfile } from "@/db/schema";
import { STAGE_LABELS, formatShortToman, toPersianDigits } from "./constants";

export interface MatchComputationResult {
  compatibilityScore: number;
  categoryScore: number;
  budgetScore: number;
  stageScore: number;
  synergyScore: number;
  aiSummary: string;
  aiHighlights: string[];
  aiRiskNote: string;
}

const CATEGORY_ADJACENCY: Record<string, string[]> = {
  "هوش مصنوعی و نرم‌افزار": [
    "فناوری آموزشی",
    "فین‌تک و تجارت الکترونیک",
    "سلامت و تجهیزات پزشکی",
    "سخت‌افزار و اینترنت اشیا",
  ],
  "کشاورزی هوشمند": ["انرژی پاک و محیط زیست", "سخت‌افزار و اینترنت اشیا", "هوش مصنوعی و نرم‌افزار"],
  "سلامت و تجهیزات پزشکی": ["هوش مصنوعی و نرم‌افزار", "سخت‌افزار و اینترنت اشیا"],
  "فناوری آموزشی": ["هوش مصنوعی و نرم‌افزار", "فین‌تک و تجارت الکترونیک"],
  "انرژی پاک و محیط زیست": ["کشاورزی هوشمند", "سخت‌افزار و اینترنت اشیا"],
  "فین‌تک و تجارت الکترونیک": ["هوش مصنوعی و نرم‌افزار", "فناوری آموزشی"],
  "سخت‌افزار و اینترنت اشیا": [
    "کشاورزی هوشمند",
    "انرژی پاک و محیط زیست",
    "سلامت و تجهیزات پزشکی",
    "هوش مصنوعی و نرم‌افزار",
  ],
};

function normalizePersianTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export function calculateIdeaReadinessScore(input: {
  stage: string;
  description: string;
  marketPotential: string;
  teamSize: number;
  tags: string[];
  demoUrl?: string | null;
  equityOfferedPercent: number;
}): number {
  let score = 58;
  if (input.stage === "prototype") score += 10;
  if (input.stage === "mvp") score += 18;
  if (input.stage === "growth") score += 24;
  if (input.description.length > 140) score += 6;
  if (input.marketPotential.length > 80) score += 6;
  if (input.teamSize >= 2) score += 4;
  if (input.tags.length >= 3) score += 3;
  if (input.demoUrl && input.demoUrl.trim().length > 5) score += 4;
  if (input.equityOfferedPercent >= 10 && input.equityOfferedPercent <= 35) score += 3;
  return Math.min(97, Math.max(62, score));
}

export function computeAiMatch(
  idea: Pick<
    Idea,
    | "title"
    | "tagline"
    | "description"
    | "marketPotential"
    | "category"
    | "stage"
    | "fundingNeededToman"
    | "equityOfferedPercent"
    | "tags"
    | "aiReadinessScore"
    | "teamSize"
  >,
  investor: Pick<
    InvestorProfile,
    | "organizationName"
    | "preferredCategories"
    | "preferredStages"
    | "minBudgetToman"
    | "maxBudgetToman"
    | "investmentThesis"
    | "keywords"
  >
): MatchComputationResult {
  // 1. Category alignment score (0 - 100)
  let categoryScore = 42;
  const exactCat = investor.preferredCategories.includes(idea.category);
  const adjacentCats = CATEGORY_ADJACENCY[idea.category] ?? [];
  const adjacentHit = investor.preferredCategories.some((c) => adjacentCats.includes(c));

  if (exactCat) {
    categoryScore = 96;
  } else if (adjacentHit) {
    categoryScore = 76;
  }

  // 2. Budget alignment score (0 - 100)
  let budgetScore = 45;
  const needed = idea.fundingNeededToman;
  const minB = investor.minBudgetToman;
  const maxB = investor.maxBudgetToman;

  if (needed >= minB && needed <= maxB) {
    // Center of range gets highest score
    const mid = (minB + maxB) / 2;
    const spread = Math.max(1, (maxB - minB) / 2);
    const closeness = 1 - Math.min(1, Math.abs(needed - mid) / spread);
    budgetScore = Math.round(86 + closeness * 13);
  } else if (needed < minB) {
    const ratio = needed / Math.max(1, minB);
    budgetScore = Math.round(Math.max(50, 52 + ratio * 30));
  } else {
    const overRatio = (needed - maxB) / Math.max(1, maxB);
    budgetScore = Math.round(Math.max(28, 78 - overRatio * 55));
  }

  // 3. Stage alignment score (0 - 100)
  const stageOrder = ["concept", "prototype", "mvp", "growth"];
  const ideaStageIdx = stageOrder.indexOf(idea.stage);
  let stageScore = 52;
  if (investor.preferredStages.includes(idea.stage)) {
    stageScore = 95;
  } else {
    const minDist = Math.min(
      ...investor.preferredStages.map((s) => {
        const idx = stageOrder.indexOf(s);
        return idx === -1 || ideaStageIdx === -1 ? 2 : Math.abs(idx - ideaStageIdx);
      })
    );
    if (minDist === 1) stageScore = 76;
    else stageScore = 54;
  }

  // 4. Semantic & Keyword Synergy Score (0 - 100)
  const ideaTokens = new Set(
    normalizePersianTokens(
      `${idea.title} ${idea.tagline} ${idea.description} ${idea.marketPotential} ${idea.tags.join(" ")}`
    )
  );
  const investorTokens = new Set(
    normalizePersianTokens(`${investor.investmentThesis} ${investor.keywords.join(" ")}`)
  );

  let overlapCount = 0;
  const matchedKeywords: string[] = [];

  for (const kw of investor.keywords) {
    const kwNorm = normalizePersianTokens(kw);
    if (kwNorm.some((t) => ideaTokens.has(t))) {
      overlapCount += 2;
      matchedKeywords.push(kw);
    }
  }

  for (const t of investorTokens) {
    if (ideaTokens.has(t)) {
      overlapCount += 1;
    }
  }

  const rawSynergy = 58 + Math.min(34, overlapCount * 5) + Math.round((idea.aiReadinessScore - 70) * 0.25);
  const synergyScore = Math.min(98, Math.max(55, rawSynergy));

  // Weighted composite compatibility
  const compatibilityScore = Math.min(
    99,
    Math.max(
      42,
      Math.round(
        categoryScore * 0.34 + budgetScore * 0.28 + stageScore * 0.18 + synergyScore * 0.2
      )
    )
  );

  // Build Persian AI narrative
  const stageLabel = STAGE_LABELS[idea.stage]?.label ?? idea.stage;
  const highlights: string[] = [];

  if (exactCat) {
    highlights.push(`تطابق مستقیم با حوزه استراتژیک «${idea.category}» در پورتفوی سرمایه‌گذار`);
  } else if (adjacentHit) {
    highlights.push(`هم‌افزایی بین‌رشته‌ای بالا میان «${idea.category}» و اولویت‌های ${investor.organizationName}`);
  } else {
    highlights.push(`فرصت تنوع‌بخشی به سبد سرمایه‌گذاری در حوزه روبه‌رشد «${idea.category}»`);
  }

  if (needed >= minB && needed <= maxB) {
    highlights.push(
      `سرمایه درخواستی (${formatShortToman(needed)}) دقیقاً در محدوده بودجه هدف (${formatShortToman(minB)} تا ${formatShortToman(maxB)}) قرار دارد`
    );
  } else if (needed < minB) {
    highlights.push(
      `نیاز مالی کمتر از سقف بودجه بوده و امکان سرمایه‌گذاری مرحله‌ای با ریسک پایین را فراهم می‌کند`
    );
  } else {
    highlights.push(
      `امکان سرمایه‌گذاری مشترک (سندیکایی) برای پوشش سرمایه ${formatShortToman(needed)} وجود دارد`
    );
  }

  if (matchedKeywords.length > 0) {
    highlights.push(
      `اشتراک کلیدواژه‌های تخصصی هوش مصنوعی: ${matchedKeywords.slice(0, 3).join("، ")}`
    );
  } else {
    highlights.push(
      `امتیاز آمادگی محصول (${toPersianDigits(idea.aiReadinessScore)} از ۱۰۰) و تیم ${toPersianDigits(idea.teamSize)} نفره چابک`
    );
  }

  const matchTier =
    compatibilityScore >= 86
      ? "بسیار بالا (طلایی)"
      : compatibilityScore >= 74
        ? "قوی و پیشنهادی"
        : "متوسط با پتانسیل مذاکره";

  const aiSummary = `موتور تطبیق هوش مصنوعی ایده‌پل میزان هم‌سویی ایده «${idea.title}» با رویکرد سرمایه‌گذاری «${investor.organizationName}» را ${toPersianDigits(compatibilityScore)}٪ (${matchTier}) ارزیابی کرد. این طرح در مرحله «${stageLabel}» با پیشنهاد ${toPersianDigits(idea.equityOfferedPercent)}٪ مشارکت ارائه شده و از نظر تناسب مالی و همپوشانی بازار هدف، گزینه جذابی برای شروع جلسه ارزیابی است.`;

  let aiRiskNote =
    "پیشنهاد می‌شود در جلسه اول، مستندات تست بازار، برنامه هزینه ۱۲ ماهه و مالکیت فکری تیم بررسی شود.";
  if (idea.stage === "concept") {
    aiRiskNote =
      "به دلیل قرار داشتن طرح در مرحله ایده خام، تزریق سرمایه به‌صورت مرحله‌ای (Milestone-based) بر اساس تحویل نمونه اولیه توصیه می‌شود.";
  } else if (needed > maxB) {
    aiRiskNote =
      "سرمایه درخواستی کمی بالاتر از سقف تعریف‌شده شماست؛ مذاکره برای کاهش فاز اول سرمایه یا مشارکت دو سرمایه‌گذار پیشنهاد می‌شود.";
  } else if (idea.equityOfferedPercent < 12) {
    aiRiskNote =
      "درصد سهام پیشنهادی محافظه‌کارانه است؛ بررسی ارزش‌گذاری پایه (Pre-money Valuation) در جلسه مذاکره توصیه می‌شود.";
  }

  return {
    compatibilityScore,
    categoryScore,
    budgetScore,
    stageScore,
    synergyScore,
    aiSummary,
    aiHighlights: highlights,
    aiRiskNote,
  };
}
