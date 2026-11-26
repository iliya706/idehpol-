import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Users,
  ArrowUpLeft,
  Star,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  STAGE_LABELS,
  FUNDING_STATUS_LABELS,
  formatShortToman,
  toPersianDigits,
} from "@/lib/constants";

export interface IdeaCardItem {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  stage: string;
  fundingNeededToman: number;
  equityOfferedPercent: number;
  teamSize: number;
  city: string | null;
  tags: string[];
  coverImage: string;
  listingPlan: string;
  fundingStatus: string;
  aiReadinessScore: number;
  viewsCount: number;
  innovatorName?: string;
  topMatchScore?: number;
  aiMatchCount?: number;
}

export function IdeaCard({ idea }: { idea: IdeaCardItem }) {
  const stageMeta = STAGE_LABELS[idea.stage] ?? STAGE_LABELS.prototype;
  const fundingMeta =
    FUNDING_STATUS_LABELS[idea.fundingStatus] ?? FUNDING_STATUS_LABELS.unfunded;

  return (
    <article className="card-surface card-surface-hover rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Image Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={idea.coverImage}
          alt={idea.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm ${fundingMeta.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${fundingMeta.dotClass}`} />
            {fundingMeta.label}
          </span>

          {idea.listingPlan === "featured" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-700/95 text-white shadow-sm">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              برگزیده
            </span>
          )}
        </div>

        {/* Bottom Overlay Category & AI Score */}
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between gap-2 text-white">
          <span className="text-xs font-semibold bg-slate-900/75 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            {idea.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            آمادگی AI: {toPersianDigits(idea.aiReadinessScore)}٪
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${stageMeta.badgeClass}`}
          >
            {stageMeta.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تأیید و ثبت‌شده
          </span>
        </div>

        <Link
          href={`/ideas/${idea.id}`}
          className="text-base font-extrabold text-slate-900 hover:text-indigo-700 transition-colors leading-snug line-clamp-2"
        >
          {idea.title}
        </Link>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-6 line-clamp-2">
          {idea.tagline}
        </p>

        {/* Financial Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-2.5">
            <div className="text-[11px] text-slate-500">سرمایه مورد نیاز</div>
            <div className="text-sm font-extrabold text-indigo-800 mt-0.5">
              {formatShortToman(idea.fundingNeededToman)}
            </div>
          </div>
          <div className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-2.5">
            <div className="text-[11px] text-slate-500">سهام / مشارکت پیشنهادی</div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {toPersianDigits(idea.equityOfferedPercent)} درصد
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {idea.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {idea.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {toPersianDigits(idea.teamSize)} نفر
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {toPersianDigits(idea.viewsCount)}
            </span>
          </div>

          <Link
            href={`/ideas/${idea.id}`}
            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900"
          >
            <span>جزئیات و مچ AI</span>
            <ArrowUpLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
