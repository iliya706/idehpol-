import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  Sparkles,
  ArrowLeft,
  Lightbulb,
  Briefcase,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Store,
  TrendingUp,
  BadgeCheck,
  ArrowUpLeft,
} from "lucide-react";
import { db } from "@/db";
import { ideas, investorProfiles, aiMatches, users } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/lib/seed";
import { IdeaCard } from "@/components/IdeaCard";
import {
  formatShortToman,
  toPersianDigits,
  IDEA_LISTING_PLANS,
  INVESTOR_MEMBERSHIP_PLANS,
  formatToman,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="card-surface rounded-3xl p-8 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
          ⚙️
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          دیتابیس سایت هنوز راه‌اندازی نشده است
        </h1>
        <p className="text-sm text-slate-600 leading-7">
          اتصال به دیتابیس برقرار نشد یا جدول‌ها ساخته نشده‌اند. اگر سایت را تازه روی هاست
          رایگان مستقر کرده‌اید، کافیست یک بار آدرس زیر را در مرورگر باز کنید تا جدول‌ها و
          داده‌های نمونه به‌صورت خودکار ساخته شوند:
        </p>
        <div
          dir="ltr"
          className="rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs sm:text-sm p-3.5 overflow-x-auto"
        >
          /api/setup?token=YOUR_SETUP_TOKEN
        </div>
        <p className="text-xs text-slate-500">
          مقدار <code className="px-1.5 py-0.5 bg-slate-100 rounded">SETUP_TOKEN</code> را در
          متغیرهای محیطی هاست تعریف کنید (پیش‌فرض: idehpol-setup). سپس وضعیت اتصال را در{" "}
          <code className="px-1.5 py-0.5 bg-slate-100 rounded">/api/health</code> بررسی کنید.
        </p>
      </div>
    </div>
  );
}

async function loadHomeData() {
  try {
    await ensureDatabaseSeeded();

    const [featuredIdeasRows, investorsList, matchesList, allIdeasCount] =
      await Promise.all([
      db
        .select({
          idea: ideas,
          innovatorName: users.fullName,
        })
        .from(ideas)
        .innerJoin(users, eq(ideas.userId, users.id))
        .where(eq(ideas.listingFeePaid, true))
        .orderBy(
          sql`CASE WHEN ${ideas.listingPlan} = 'featured' THEN 0 ELSE 1 END`,
          desc(ideas.createdAt)
        )
        .limit(6),
      db
        .select({
          profile: investorProfiles,
          userName: users.fullName,
        })
        .from(investorProfiles)
        .innerJoin(users, eq(investorProfiles.userId, users.id))
        .where(eq(investorProfiles.membershipStatus, "active"))
        .orderBy(desc(investorProfiles.createdAt)),
      db.select().from(aiMatches),
        db.select().from(ideas).where(eq(ideas.listingFeePaid, true)),
      ]);

    return { featuredIdeasRows, investorsList, matchesList, allIdeasCount };
  } catch (error) {
    console.error("Home page data unavailable:", error);
    return null;
  }
}

export default async function HomePage() {
  const homeData = await loadHomeData();

  if (!homeData) {
    return <SetupNotice />;
  }

  const { featuredIdeasRows, investorsList, matchesList, allIdeasCount } = homeData;

  const unfundedCount = allIdeasCount.filter((i) => i.fundingStatus === "unfunded").length;
  const matchedOrFundedCount = allIdeasCount.filter(
    (i) => i.fundingStatus === "funded" || i.fundingStatus === "negotiating"
  ).length;
  const totalCapitalRequested = allIdeasCount.reduce(
    (acc, item) => acc + item.fundingNeededToman,
    0
  );

  return (
    <div className="overflow-hidden">
      {/* Editorial Hero Section */}
      <section className="relative bg-editorial-grid border-b border-[#E7E5DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Right Column (RTL Primary Copy) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>پلتفرم هوشمند اتصال ایده‌های جوانان به کارفرمایان و سرمایه‌گذاران</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-slate-900 leading-[1.3] tracking-tight">
                ایده‌ای که سرمایه‌گذار نداشت،{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-700 to-emerald-600">
                  با هوش مصنوعی
                </span>{" "}
                سرمایه‌گذارش را پیدا می‌کند
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-8 max-w-2xl">
                جوانان خلاق محصول و ایده خود را با پرداخت هزینه ثبت در ویترین ایده‌پل منتشر
                می‌کنند؛ کارفرمایان و سرمایه‌گذاران با حق عضویت اختصاصی عضو می‌شوند و موتور
                هوش مصنوعی بهترین تطبیق سرمایه، حوزه و بازار را میان آن‌ها برقرار می‌کند.
              </p>

              {/* Dual Clear CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/submit-idea"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-900/15 transition-all"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span>ثبت ایده و محصول من</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <Link
                  href="/investors"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-[#DDD9CE] font-bold text-sm sm:text-base shadow-xs transition-all"
                >
                  <Briefcase className="w-5 h-5 text-emerald-700" />
                  <span>عضویت کارفرمایان و سرمایه‌گذاران</span>
                </Link>

                <Link
                  href="/ai-match"
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl text-indigo-800 hover:bg-indigo-50 font-bold text-sm transition-colors"
                >
                  <Cpu className="w-4 h-4" />
                  <span>مشاهده موتور مچ AI</span>
                </Link>
              </div>

              {/* Trust Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  انتشار تضمینی پس از پرداخت هزینه ثبت
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  سرمایه‌گذاران تأییدشده و دارای حق عضویت
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  لینک‌دهی مستقیم به پرستاشاپ
                </span>
              </div>
            </div>

            {/* Left Column (Visual Showcase + Live AI Match Preview Card) */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden border border-[#E2DFD6] bg-white shadow-xl shadow-indigo-950/8">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src="https://images.pexels.com/photos/39205065/pexels-photo-39205065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                      alt="جوانان ایده‌پرداز و سرمایه‌گذاران در ایده‌پل"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                    <div className="absolute bottom-4 right-4 left-4 text-white">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[11px] font-bold mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>نمونه تطبیق زنده هوش مصنوعی</span>
                      </div>
                      <p className="text-sm font-bold leading-6">
                        سامانه گلخانه هوشمند آگرونیکس ↔ صندوق جسورانه پیشگام نوآور
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">امتیاز تطبیق چندمعیاره AI</div>
                        <div className="text-2xl font-extrabold text-indigo-800 mt-0.5">
                          ۹۴٪ <span className="text-xs font-bold text-emerald-700">تطابق طلایی</span>
                        </div>
                      </div>
                      <Link
                        href="/ai-match"
                        className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors"
                      >
                        تست موتور مچ
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-2.5">
                        <div className="text-[11px] text-slate-500">تطابق حوزه</div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">۹۶٪</div>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-2.5">
                        <div className="text-[11px] text-slate-500">تناسب بودجه</div>
                        <div className="text-sm font-extrabold text-emerald-700 mt-0.5">۹۵٪</div>
                      </div>
                      <div className="rounded-xl bg-[#FAF9F6] border border-[#ECEAE2] p-2.5">
                        <div className="text-[11px] text-slate-500">مرحله محصول</div>
                        <div className="text-sm font-extrabold text-indigo-700 mt-0.5">۹۵٪</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Platform Stats Strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-surface rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-500">
                ایده‌های ثبت‌شده جوانان
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {toPersianDigits(allIdeasCount.length)} ایده فعال
              </div>
              <div className="text-xs text-amber-700 font-semibold mt-1">
                {toPersianDigits(unfundedCount)} ایده آماده جذب سرمایه‌گذار
              </div>
            </div>

            <div className="card-surface rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-500">
                کارفرمایان و سرمایه‌گذاران عضو
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-800 mt-1">
                {toPersianDigits(investorsList.length)} سرمایه‌گذار
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                همگی دارای عضویت فعال و تأییدشده
              </div>
            </div>

            <div className="card-surface rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-500">
                تطبیق‌های ساخته‌شده توسط AI
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                {toPersianDigits(matchesList.length)} تطبیق هوشمند
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {toPersianDigits(matchedOrFundedCount)} طرح وارد مذاکره یا جذب سرمایه شده
              </div>
            </div>

            <div className="card-surface rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-500">
                حجم فرصت‌های سرمایه‌گذاری
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {formatShortToman(totalCapitalRequested)}
              </div>
              <div className="text-xs text-indigo-700 font-semibold mt-1">
                در ۷ حوزه فناوری و تولیدی
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3-Step Core Business Model) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-extrabold tracking-wide text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            چگونه ایده‌پل کار می‌کند؟
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            چرخه هوشمند تبدیل ایده جوان به محصول دارای سرمایه‌گذار
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-7">
            ساختار شفاف دوطرفه که هم جدیت ایده‌پردازان را تضمین می‌کند و هم سرمایه‌گذاران
            واقعی را با هوش مصنوعی به ایده‌های هم‌تراز متصل می‌سازد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="card-surface rounded-3xl p-7 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-extrabold text-xl mb-5">
              ۱
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              ثبت ایده جوانان با پرداخت هزینه انتشار
            </h3>
            <p className="text-sm text-slate-600 leading-7 mb-5">
              جوان ایده‌پرداز جزئیات محصول، سرمایه مورد نیاز و درصد مشارکت را ثبت کرده و با
              پرداخت تعرفه ثبت (از {formatToman(IDEA_LISTING_PLANS[0].priceToman)})، محصولش
              در کاتالوگ رسمی منتشر می‌شود.
            </p>
            <Link
              href="/submit-idea"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              <span>رفتن به صفحه ثبت ایده</span>
              <ArrowUpLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="card-surface rounded-3xl p-7 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-extrabold text-xl mb-5">
              ۲
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              عضویت پولی کارفرمایان و سرمایه‌گذاران
            </h3>
            <p className="text-sm text-slate-600 leading-7 mb-5">
              کارفرمایان و سرمایه‌گذاران با پرداخت حق عضویت (از{" "}
              {formatToman(INVESTOR_MEMBERSHIP_PLANS[0].priceToman)}) عضو شبکه می‌شوند،
              بازه بودجه و حوزه‌های هدف خود را مشخص کرده و به اطلاعات تماس دسترسی می‌یابند.
            </p>
            <Link
              href="/investors"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900"
            >
              <span>مشاهده پلن‌های عضویت سرمایه‌گذار</span>
              <ArrowUpLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="card-surface rounded-3xl p-7 relative overflow-hidden border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white">
            <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-extrabold text-xl mb-5 shadow-sm">
              ۳
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              تطبیق هوش مصنوعی و جذب سرمایه‌گذار
            </h3>
            <p className="text-sm text-slate-600 leading-7 mb-5">
              موتور AI ایده‌های بدون سرمایه‌گذار را از نظر صنعت، بودجه، مرحله بلوغ و کلیدواژه‌ها
              تحلیل کرده، بهترین سرمایه‌گذاران را مچ می‌کند و درخواست جلسه و قرارداد را ثبت می‌کند.
            </p>
            <Link
              href="/ai-match"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              <span>ورود به موتور تطبیق هوش مصنوعی</span>
              <ArrowUpLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Ideas Catalog Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-18">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              ویترین ایده‌ها و محصولات جوانان
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              جدیدترین ایده‌های ثبت‌شده و آماده سرمایه‌گذاری
            </h2>
          </div>
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#DDD9CE] hover:border-indigo-300 text-sm font-bold text-slate-800 transition-colors self-start sm:self-auto"
          >
            <span>مشاهده تمام ایده‌ها و فیلتر پیشرفته</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredIdeasRows.map(({ idea, innovatorName }) => (
            <IdeaCard
              key={idea.id}
              idea={{
                ...idea,
                innovatorName,
              }}
            />
          ))}
        </div>
      </section>

      {/* Active Investors Showcase */}
      <section className="border-y border-[#E7E5DE] bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <BadgeCheck className="w-4 h-4" />
                شبکه کارفرمایان و صندوق‌های عضو
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                سرمایه‌گذاران فعالی که منتظر مچ شدن با ایده‌ها هستند
              </h2>
            </div>
            <Link
              href="/investors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors self-start sm:self-auto"
            >
              <span>به جمع سرمایه‌گذاران بپیوندید</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {investorsList.slice(0, 3).map(({ profile, userName }) => (
              <div
                key={profile.id}
                className="rounded-2xl border border-[#E7E5DE] bg-[#FAF9F6] p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      عضویت فعال
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      نماینده: {userName}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {profile.organizationName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-6 line-clamp-3">
                    {profile.investmentThesis}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#E7E5DE]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">بازه بودجه سرمایه‌گذاری:</span>
                    <span className="font-extrabold text-indigo-800">
                      {formatShortToman(profile.minBudgetToman)} تا{" "}
                      {formatShortToman(profile.maxBudgetToman)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredCategories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PrestaShop Dedicated Multi-Page Integration Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-18">
        <div className="rounded-3xl bg-gradient-to-l from-indigo-950 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-300 text-xs font-bold">
                <Store className="w-4 h-4" />
                <span>معماری چندصفحه‌ای آماده برای اتصال به PrestaShop</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                هر بخش سایت دارای آدرس مستقل برای لینک‌دهی مستقیم در فروشگاه پرستاشاپ شماست
              </h2>
              <p className="text-sm sm:text-base text-indigo-100/90 leading-7 max-w-2xl">
                می‌توانید منوها، بنرها و دکمه‌های پرستاشاپ را مستقیماً به صفحات «کاتالوگ
                ایده‌ها»، «ثبت ایده جوانان»، «عضویت سرمایه‌گذاران» یا «موتور تطبیق هوش
                مصنوعی» متصل کنید و ورودی کاربران پرستاشاپ را به‌صورت خودکار رهگیری نمایید.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/prestashop-links"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-colors shadow-lg"
              >
                <TrendingUp className="w-5 h-5" />
                <span>دریافت لینک‌ها و کدهای آماده پرستاشاپ</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-colors"
              >
                <span>مشاهده پنل مدیریت و گزارش تراکنش‌ها</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
