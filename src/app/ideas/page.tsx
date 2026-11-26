"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  Sparkles,
  Loader2,
  FilterX,
} from "lucide-react";
import { IdeaCard, type IdeaCardItem } from "@/components/IdeaCard";
import { IDEA_CATEGORIES, STAGE_LABELS, toPersianDigits } from "@/lib/constants";

function IdeasCatalogInner() {
  const searchParams = useSearchParams();

  const [ideas, setIdeas] = useState<IdeaCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [stage, setStage] = useState(searchParams.get("stage") || "all");
  const [fundingStatus, setFundingStatus] = useState(
    searchParams.get("fundingStatus") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (category !== "all") qs.set("category", category);
      if (stage !== "all") qs.set("stage", stage);
      if (fundingStatus !== "all") qs.set("fundingStatus", fundingStatus);
      if (search.trim()) qs.set("search", search.trim());
      if (sort) qs.set("sort", sort);

      const res = await fetch(`/api/ideas?${qs.toString()}`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [category, stage, fundingStatus, search, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIdeas();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchIdeas]);

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setStage("all");
    setFundingStatus("all");
    setSort("featured");
  }

  const hasActiveFilter =
    search.trim() !== "" ||
    category !== "all" ||
    stage !== "all" ||
    fundingStatus !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>کاتالوگ رسمی ایده‌ها و محصولات جوانان</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ایده‌های ثبت‌شده آماده جذب سرمایه‌گذار
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            تمامی ایده‌های این صفحه هزینه ثبت را پرداخت کرده و توسط سیستم امتیازدهی هوش
            مصنوعی بررسی شده‌اند. می‌توانید بر اساس وضعیت سرمایه‌گذار و حوزه فیلتر کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/ai-match"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DDD9CE] hover:border-indigo-300 text-indigo-800 font-bold text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>مچ هوشمند با AI</span>
          </Link>
          <Link
            href="/submit-idea"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت ایده جدید</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-surface rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، شرح ایده یا فناوری (مثلاً گلخانه، سلامت، پرستاشاپ)..."
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] pr-10 pl-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Funding Status */}
          <div className="md:col-span-3">
            <select
              value={fundingStatus}
              onChange={(e) => setFundingStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">همه وضعیت‌های سرمایه‌گذاری</option>
              <option value="unfunded">فقط بدون سرمایه‌گذار (آماده مچ)</option>
              <option value="negotiating">در حال مذاکره هوشمند</option>
              <option value="funded">سرمایه‌گذار پیدا شد ✓</option>
            </select>
          </div>

          {/* Stage */}
          <div className="md:col-span-2">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">همه مراحل</option>
              {Object.entries(STAGE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="featured">برگزیده‌ها و جدیدترین</option>
              <option value="score">بالاترین امتیاز AI</option>
              <option value="budget_asc">کمترین سرمایه مورد نیاز</option>
              <option value="budget_desc">بیشترین سرمایه مورد نیاز</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 ml-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            دسته‌بندی:
          </span>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              category === "all"
                ? "bg-indigo-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            همه حوزه‌ها
          </button>
          {IDEA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                category === cat
                  ? "bg-indigo-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 mr-auto cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
        <span>
          نمایش <strong>{toPersianDigits(ideas.length)}</strong> ایده ثبت‌شده و تأییدشده
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">در حال بارگذاری کاتالوگ ایده‌ها...</span>
        </div>
      ) : ideas.length === 0 ? (
        <div className="card-surface rounded-3xl p-12 text-center space-y-4">
          <p className="text-lg font-extrabold text-slate-800">
            هیچ ایده‌ای با این فیلترها یافت نشد
          </p>
          <p className="text-sm text-slate-500">
            فیلترها را تغییر دهید یا اولین ایده را در این حوزه ثبت کنید.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              نمایش همه ایده‌ها
            </button>
            <Link
              href="/submit-idea"
              className="px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-bold hover:bg-indigo-800"
            >
              ثبت ایده جدید
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function IdeasPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <IdeasCatalogInner />
    </Suspense>
  );
}
