import { count } from "drizzle-orm";
import { db } from "@/db";
import { users, investorProfiles, ideas, payments, aiMatches } from "@/db/schema";
import { hashPassword } from "./auth";
import { computeAiMatch } from "./ai-matcher";

let seedingPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedingPromise) {
    return seedingPromise;
  }

  seedingPromise = (async () => {
    try {
      const [{ value: userCount }] = await db.select({ value: count() }).from(users);
      if (userCount > 0) return;

      const demoPass = hashPassword("123456");

      // 1. Seed Users (Innovators + Investors)
      const insertedUsers = await db
        .insert(users)
        .values([
          {
            fullName: "سارا محمدی",
            email: "sara@idehpol.ir",
            phone: "09123456781",
            passwordHash: demoPass,
            role: "innovator",
            city: "تهران",
            bio: "مهندس برق و اینترنت اشیا، پژوهشگر سیستم‌های هوشمند کشاورزی",
          },
          {
            fullName: "امیرحسین رضایی",
            email: "amir@idehpol.ir",
            phone: "09123456782",
            passwordHash: demoPass,
            role: "innovator",
            city: "اصفهان",
            bio: "متخصص طراحی صنعتی و سخت‌افزارهای پوشیدنی سلامت",
          },
          {
            fullName: "نیلوفر کریمی",
            email: "niloofar@idehpol.ir",
            phone: "09123456783",
            passwordHash: demoPass,
            role: "innovator",
            city: "شیراز",
            bio: "توسعه‌دهنده هوش مصنوعی و پلتفرم‌های یادگیری تعاملی",
          },
          {
            fullName: "پویا کاظمی",
            email: "pouya@idehpol.ir",
            phone: "09123456784",
            passwordHash: demoPass,
            role: "innovator",
            city: "مشهد",
            bio: "مخترع سیستم‌های ذخیره انرژی خورشیدی قابل حمل",
          },
          {
            fullName: "مهندس رضا شریفی",
            email: "investor@idehpol.ir",
            phone: "09121112233",
            passwordHash: demoPass,
            role: "investor",
            city: "تهران",
            companyName: "صندوق جسورانه پیشگام نوآور",
            bio: "سرمایه‌گذار فعال در حوزه فناوری‌های عمیق، اینترنت اشیا، کشاورزی هوشمند و سلامت دیجیتال",
          },
          {
            fullName: "دکتر مریم حسینی",
            email: "maryam.vc@idehpol.ir",
            phone: "09121112244",
            passwordHash: demoPass,
            role: "investor",
            city: "تهران",
            companyName: "شتاب‌دهنده آینده‌سازان دیجیتال",
            bio: "حمایت از تیم‌های جوان در حوزه هوش مصنوعی، آموزش آنلاین و فین‌تک",
          },
          {
            fullName: "کیوان فرهادی",
            email: "keyvan.corp@idehpol.ir",
            phone: "09121112255",
            passwordHash: demoPass,
            role: "investor",
            city: "اصفهان",
            companyName: "هلدینگ صنعتی انرژی سبز پارس",
            bio: "کارفرمای صنعتی و سرمایه‌گذار محصولات سخت‌افزاری، انرژی پاک و تولید هوشمند",
          },
        ])
        .returning();

      const [sara, amir, niloofar, pouya, rezaInv, maryamInv, keyvanInv] = insertedUsers;

      // 2. Seed Paid Investor Memberships
      const sixMonthsLater = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
      const oneYearLater = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

      const insertedInvestors = await db
        .insert(investorProfiles)
        .values([
          {
            userId: rezaInv.id,
            organizationName: "صندوق جسورانه پیشگام نوآور",
            membershipPlan: "pro",
            membershipStatus: "active",
            membershipExpiresAt: sixMonthsLater,
            preferredCategories: [
              "کشاورزی هوشمند",
              "سلامت و تجهیزات پزشکی",
              "سخت‌افزار و اینترنت اشیا",
            ],
            preferredStages: ["prototype", "mvp"],
            minBudgetToman: 400_000_000,
            maxBudgetToman: 2_500_000_000,
            investmentThesis:
              "سرمایه‌گذاری روی محصولات سخت‌افزاری هوشمند، سنسورهای IoT، کشاورزی گلخانه‌ای و گجت‌های پایش سلامت که نمونه اولیه قابل تست دارند و بازار صادراتی یا B2B دارند.",
            keywords: ["سنسور", "گلخانه", "سلامت", "هوشمند", "اینترنت اشیا", "پوشیدنی", "بومی"],
            verified: true,
          },
          {
            userId: maryamInv.id,
            organizationName: "شتاب‌دهنده آینده‌سازان دیجیتال",
            membershipPlan: "pro",
            membershipStatus: "active",
            membershipExpiresAt: sixMonthsLater,
            preferredCategories: [
              "هوش مصنوعی و نرم‌افزار",
              "فناوری آموزشی",
              "فین‌تک و تجارت الکترونیک",
            ],
            preferredStages: ["concept", "prototype", "mvp"],
            minBudgetToman: 250_000_000,
            maxBudgetToman: 1_800_000_000,
            investmentThesis:
              "تمرکز بر تیم‌های دانشجویی و جوان در حوزه هوش مصنوعی فارسی، آموزش تعاملی سه‌بعدی، ابزارهای فروشگاه‌داری هوشمند و پرداخت خرد.",
            keywords: ["هوش مصنوعی", "آموزش", "فروشگاه", "پرستاشاپ", "دانش‌آموز", "نرم‌افزار", "مالی"],
            verified: true,
          },
          {
            userId: keyvanInv.id,
            organizationName: "هلدینگ صنعتی انرژی سبز پارس",
            membershipPlan: "enterprise",
            membershipStatus: "active",
            membershipExpiresAt: oneYearLater,
            preferredCategories: [
              "انرژی پاک و محیط زیست",
              "سخت‌افزار و اینترنت اشیا",
              "کشاورزی هوشمند",
            ],
            preferredStages: ["mvp", "growth", "prototype"],
            minBudgetToman: 800_000_000,
            maxBudgetToman: 6_000_000_000,
            investmentThesis:
              "آماده مشارکت و تولید انبوه ایده‌های ذخیره‌سازی انرژی خورشیدی، بهینه‌سازی مصرف برق، چاپ سه‌بعدی صنعتی و اتوماسیون مزارع.",
            keywords: ["خورشیدی", "انرژی", "باتری", "تولید", "صنعتی", "پایدار", "برق"],
            verified: true,
          },
        ])
        .returning();

      // 3. Seed Youth Ideas (All Listing Fee Paid!)
      const insertedIdeas = await db
        .insert(ideas)
        .values([
          {
            slug: "smart-hydro-greenhouse-iot",
            userId: sara.id,
            title: "سامانه هوشمند کنترل اقلیم و آبیاری گلخانه (آگرونیکس)",
            tagline: "کاهش ۴۵ درصدی مصرف آب و افزایش بهره‌وری گلخانه‌ها با سنسورهای بومی و هوش مصنوعی",
            description:
              "آگرونیکس یک کیت سخت‌افزاری و اپلیکیشن مدیریت گلخانه است که رطوبت خاک، دمای برگ، نور و غلظت مواد مغذی را لحظه‌ای اندازه‌گیری کرده و به‌صورت خودکار آبیاری و تهویه را تنظیم می‌کند. نمونه اولیه در سه گلخانه آزمایشی در کرج با موفقیت تست شده است.",
            marketPotential:
              "بیش از ۲۸ هزار هکتار گلخانه فعال در کشور وجود دارد. مدل درآمدی شامل فروش کیت سخت‌افزاری به علاوه اشتراک ماهانه تحلیل هوش مصنوعی بیماری‌های گیاهی است.",
            category: "کشاورزی هوشمند",
            stage: "mvp",
            fundingNeededToman: 1_200_000_000,
            equityOfferedPercent: 18,
            teamSize: 4,
            innovatorAge: 25,
            city: "تهران",
            tags: ["سنسور", "گلخانه", "اینترنت اشیا", "هوش مصنوعی", "کشاورزی"],
            coverImage:
              "https://images.pexels.com/photos/40991862/pexels-photo-40991862.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
            demoUrl: "https://idehpol.ir/demo/agronix",
            prestashopProductRef: "PS-AGRO-101",
            listingFeePaid: true,
            listingPlan: "featured",
            fundingStatus: "unfunded",
            aiReadinessScore: 91,
            viewsCount: 342,
          },
          {
            slug: "pulse-guardian-wearable",
            userId: amir.id,
            title: "مچ‌بند پزشکی هشدار زودهنگام آریتمی قلبی (نبض‌یار)",
            tagline: "پایش پیوسته نوار قلب برای سالمندان با ارسال هشدار خودکار به خانواده و پزشک",
            description:
              "نبض‌یار یک گجت پوشیدنی سبک و کاملاً بومی است که با استفاده از الگوریتم‌های یادگیری ماشین روی برد، نامنظمی ضربان قلب و افت اکسیژن خون را ۳۰ دقیقه پیش از بحران تشخیص داده و موقعیت مکانی فرد را به خانواده ارسال می‌کند.",
            marketPotential:
              "جامعه سالمندان کشور بیش از ۹ میلیون نفر است. قیمت تمام‌شده یک‌سوم نمونه‌های خارجی بوده و قابلیت فروش مستقیم در داروخانه‌ها و فروشگاه‌های آنلاین پزشکی را دارد.",
            category: "سلامت و تجهیزات پزشکی",
            stage: "prototype",
            fundingNeededToman: 1_650_000_000,
            equityOfferedPercent: 20,
            teamSize: 3,
            innovatorAge: 24,
            city: "اصفهان",
            tags: ["سلامت", "پوشیدنی", "قلب", "سنسور", "پزشکی"],
            coverImage:
              "https://images.pexels.com/photos/19961776/pexels-photo-19961776.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
            demoUrl: "https://idehpol.ir/demo/nabzyar",
            prestashopProductRef: "PS-MED-204",
            listingFeePaid: true,
            listingPlan: "featured",
            fundingStatus: "unfunded",
            aiReadinessScore: 87,
            viewsCount: 289,
          },
          {
            slug: "eduspace-3d-ai-tutor",
            userId: niloofar.id,
            title: "آزمایشگاه سه‌بعدی تعاملی و معلم هوش مصنوعی دانش‌آموزان (درس‌فضا)",
            tagline: "یادگیری فیزیک، شیمی و زیست با شبیه‌سازی سه‌بعدی و دستیار صوتی فارسی روی تبلت و موبایل",
            description:
              "بسیاری از مدارس تجهیزات آزمایشگاهی کافی ندارند. درس‌فضا آزمایش‌های کتاب درسی را به‌صورت تعاملی و سه‌بعدی شبیه‌سازی می‌کند و معلم هوش مصنوعی فارسی در هر مرحله به سؤالات دانش‌آموز پاسخ می‌دهد.",
            marketPotential:
              "بیش از ۱۶ میلیون دانش‌آموز و ۱۱۰۰ آموزشگاه خصوصی بازار هدف مستقیم هستند. درآمدزایی از طریق اشتراک سالانه خانواده‌ها و لایسنس مدارس.",
            category: "فناوری آموزشی",
            stage: "mvp",
            fundingNeededToman: 750_000_000,
            equityOfferedPercent: 15,
            teamSize: 5,
            innovatorAge: 23,
            city: "شیراز",
            tags: ["آموزش", "هوش مصنوعی", "سه‌بعدی", "دانش‌آموز", "نرم‌افزار"],
            coverImage: "/images/idea-edtech.png",
            demoUrl: "https://idehpol.ir/demo/darsfaza",
            prestashopProductRef: "PS-EDU-308",
            listingFeePaid: true,
            listingPlan: "standard",
            fundingStatus: "unfunded",
            aiReadinessScore: 89,
            viewsCount: 415,
          },
          {
            slug: "solarcube-portable-power",
            userId: pouya.id,
            title: "پاورباکس خورشیدی هوشمند برای مشاغل سیار و قطعی برق (خورشیدکوب)",
            tagline: "ذخیره‌ساز انرژی خورشیدی سبک با باتری لیتیوم-آهن-فسفات و شارژ سریع دوگانه",
            description:
              "خورشیدکوب یک منبع تغذیه قابل حمل و بی‌صدا است که برق مغازه‌های کوچک، تجهیزات پزشکی خانگی و کارگاه‌های سیار را تا ۱۲ ساعت بدون نیاز به سوخت فسیلی تأمین می‌کند و پنل خورشیدی تاشو دارد.",
            marketPotential:
              "با توجه به ناترازی برق در فصول گرم و سرد، تقاضا برای منابع ذخیره برق پاک در فروشگاه‌ها، ویلاها و کسب‌وکارهای کوچک به‌شدت در حال رشد است.",
            category: "انرژی پاک و محیط زیست",
            stage: "prototype",
            fundingNeededToman: 2_400_000_000,
            equityOfferedPercent: 22,
            teamSize: 4,
            innovatorAge: 26,
            city: "مشهد",
            tags: ["خورشیدی", "انرژی", "باتری", "برق", "پایدار"],
            coverImage: "/images/idea-cleantech.png",
            demoUrl: "https://idehpol.ir/demo/khorshidcube",
            prestashopProductRef: "PS-SOLAR-412",
            listingFeePaid: true,
            listingPlan: "featured",
            fundingStatus: "negotiating",
            aiReadinessScore: 85,
            viewsCount: 510,
          },
          {
            slug: "shopmind-prestashop-ai-assistant",
            userId: niloofar.id,
            title: "دستیار فروش هوشمند و قیمت‌گذاری پویا برای فروشگاه‌های آنلاین (فروش‌یار AI)",
            tagline: "افزایش ۳۵ درصدی تبدیل سبد خرید با مشاور فروش هوشمند و پیش‌بینی موجودی انبار",
            description:
              "فروش‌یار یک ماژول هوشمند سازگار با پرستاشاپ و ووکامرس است که رفتار خریدار را تحلیل کرده، محصول مکمل پیشنهاد می‌دهد و به‌صورت خودکار به پیام‌های مشتریان پاسخ می‌دهد.",
            marketPotential:
              "ده‌ها هزار فروشگاه اینترنتی فعال در ایران به دنبال افزایش نرخ تبدیل هستند. مدل درآمدی SaaS ماهانه با حاشیه سود بالای ۷۰ درصد.",
            category: "فین‌تک و تجارت الکترونیک",
            stage: "mvp",
            fundingNeededToman: 600_000_000,
            equityOfferedPercent: 16,
            teamSize: 3,
            innovatorAge: 24,
            city: "شیراز",
            tags: ["فروشگاه", "پرستاشاپ", "هوش مصنوعی", "نرم‌افزار", "مالی"],
            coverImage:
              "https://images.pexels.com/photos/3912367/pexels-photo-3912367.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
            demoUrl: "https://idehpol.ir/demo/forooshyar",
            prestashopProductRef: "PS-AI-505",
            listingFeePaid: true,
            listingPlan: "standard",
            fundingStatus: "unfunded",
            aiReadinessScore: 88,
            viewsCount: 274,
          },
          {
            slug: "microfab-3d-recycled-filament",
            userId: amir.id,
            title: "دستگاه رومیزی تبدیل بطری پلاستیکی به فیلامنت پرینتر سه‌بعدی (بازچرخ ۳D)",
            tagline: "تولید مواد اولیه پرینت سه‌بعدی با هزینه یک‌چهارم و کمک به بازیافت پلاستیک",
            description:
              "بازچرخ ۳D دستگاهی جمع‌وجور برای کارگاه‌ها، مدارس و دانشگاه‌ها است که بطری‌های PET دورریز را تمیز، برش و اکسترود کرده و به فیلامنت استاندارد چاپ سه‌بعدی تبدیل می‌کند.",
            marketPotential:
              "کارگاه‌های نمونه‌سازی و مدارس هوشمند سالانه میلیون‌ها تومان صرف خرید فیلامنت وارداتی می‌کنند. این محصول قبلاً با یک سرمایه‌گذار صنعتی به توافق رسیده است.",
            category: "سخت‌افزار و اینترنت اشیا",
            stage: "growth",
            fundingNeededToman: 1_900_000_000,
            equityOfferedPercent: 25,
            teamSize: 5,
            innovatorAge: 27,
            city: "اصفهان",
            tags: ["تولید", "صنعتی", "پایدار", "سخت‌افزار", "چاپ سه‌بعدی"],
            coverImage:
              "https://images.pexels.com/photos/20552667/pexels-photo-20552667.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
            demoUrl: "https://idehpol.ir/demo/bazcharkh",
            prestashopProductRef: "PS-3D-609",
            listingFeePaid: true,
            listingPlan: "featured",
            fundingStatus: "funded",
            aiReadinessScore: 94,
            viewsCount: 688,
          },
        ])
        .returning();

      // 4. Seed Payment Receipts
      await db.insert(payments).values([
        {
          userId: sara.id,
          paymentType: "idea_listing",
          referenceId: insertedIdeas[0].id,
          planName: "ثبت ویژه + معرفی اولویت‌دار AI",
          amountToman: 790_000,
          status: "paid",
          trackingCode: "IDP-1404-710214",
          sourceChannel: "prestashop",
        },
        {
          userId: amir.id,
          paymentType: "idea_listing",
          referenceId: insertedIdeas[1].id,
          planName: "ثبت ویژه + معرفی اولویت‌دار AI",
          amountToman: 790_000,
          status: "paid",
          trackingCode: "IDP-1404-710288",
          sourceChannel: "direct",
        },
        {
          userId: niloofar.id,
          paymentType: "idea_listing",
          referenceId: insertedIdeas[2].id,
          planName: "ثبت ایده استاندارد",
          amountToman: 390_000,
          status: "paid",
          trackingCode: "IDP-1404-710319",
          sourceChannel: "prestashop",
        },
        {
          userId: pouya.id,
          paymentType: "idea_listing",
          referenceId: insertedIdeas[3].id,
          planName: "ثبت ویژه + معرفی اولویت‌دار AI",
          amountToman: 790_000,
          status: "paid",
          trackingCode: "IDP-1404-710402",
          sourceChannel: "direct",
        },
        {
          userId: rezaInv.id,
          paymentType: "investor_membership",
          referenceId: insertedInvestors[0].id,
          planName: "عضویت سرمایه‌گذار حرفه‌ای (۶ ماهه)",
          amountToman: 4_500_000,
          status: "paid",
          trackingCode: "INV-1404-880112",
          sourceChannel: "prestashop",
        },
        {
          userId: maryamInv.id,
          paymentType: "investor_membership",
          referenceId: insertedInvestors[1].id,
          planName: "عضویت سرمایه‌گذار حرفه‌ای (۶ ماهه)",
          amountToman: 4_500_000,
          status: "paid",
          trackingCode: "INV-1404-880159",
          sourceChannel: "direct",
        },
        {
          userId: keyvanInv.id,
          paymentType: "investor_membership",
          referenceId: insertedInvestors[2].id,
          planName: "عضویت سازمانی و هلدینگ‌ها (سالانه)",
          amountToman: 9_800_000,
          status: "paid",
          trackingCode: "INV-1404-880204",
          sourceChannel: "prestashop",
        },
      ]);

      // 5. Seed Initial AI Matches using our live AI scoring engine
      const matchRows: Array<typeof aiMatches.$inferInsert> = [];
      for (const idea of insertedIdeas) {
        for (const inv of insertedInvestors) {
          const result = computeAiMatch(idea, inv);
          if (result.compatibilityScore >= 70) {
            let status: string = "suggested";
            let investorMessage: string | null = null;
            let proposedAmountToman: number | null = null;

            if (idea.slug === "solarcube-portable-power" && inv.id === insertedInvestors[2].id) {
              status = "meeting_requested";
              investorMessage =
                "سلام پویا جان، ایده پاورباکس خورشیدی دقیقاً هم‌راستای خطوط تولید جدید هلدینگ ماست. مایلیم این هفته جلسه ارزیابی فنی و قرارداد مشارکت برگزار کنیم.";
              proposedAmountToman = 2_400_000_000;
            } else if (
              idea.slug === "microfab-3d-recycled-filament" &&
              inv.id === insertedInvestors[2].id
            ) {
              status = "funded";
              investorMessage =
                "قرارداد سرمایه‌گذاری به مبلغ ۱.۹ میلیارد تومان با تیم بازچرخ ۳D نهایی و تأیید شد.";
              proposedAmountToman = 1_900_000_000;
            }

            matchRows.push({
              ideaId: idea.id,
              investorProfileId: inv.id,
              compatibilityScore: result.compatibilityScore,
              categoryScore: result.categoryScore,
              budgetScore: result.budgetScore,
              stageScore: result.stageScore,
              synergyScore: result.synergyScore,
              aiSummary: result.aiSummary,
              aiHighlights: result.aiHighlights,
              aiRiskNote: result.aiRiskNote,
              status,
              investorMessage,
              proposedAmountToman,
            });
          }
        }
      }

      if (matchRows.length > 0) {
        await db.insert(aiMatches).values(matchRows);
      }
    } catch (err) {
      seedingPromise = null;
      throw err;
    }
  })();

  return seedingPromise;
}
