import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ideas, users, payments, investorProfiles, aiMatches } from "@/db/schema";
import { createSessionCookie, getCurrentUser, hashPassword } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";
import {
  IDEA_LISTING_PLANS,
  generateSlug,
  generateTrackingCode,
  COVER_IMAGE_PRESETS,
} from "@/lib/constants";
import { calculateIdeaReadinessScore, computeAiMatch } from "@/lib/ai-matcher";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const stage = searchParams.get("stage");
    const fundingStatus = searchParams.get("fundingStatus");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") || "featured";

    const conditions = [eq(ideas.listingFeePaid, true)];

    if (category && category !== "all") {
      conditions.push(eq(ideas.category, category));
    }
    if (stage && stage !== "all") {
      conditions.push(eq(ideas.stage, stage));
    }
    if (fundingStatus && fundingStatus !== "all") {
      conditions.push(eq(ideas.fundingStatus, fundingStatus));
    }
    if (search) {
      conditions.push(
        or(
          ilike(ideas.title, `%${search}%`),
          ilike(ideas.tagline, `%${search}%`),
          ilike(ideas.description, `%${search}%`)
        )!
      );
    }

    const orderBy =
      sort === "budget_asc"
        ? [ideas.fundingNeededToman]
        : sort === "budget_desc"
          ? [desc(ideas.fundingNeededToman)]
          : sort === "score"
            ? [desc(ideas.aiReadinessScore), desc(ideas.createdAt)]
            : [
                sql`CASE WHEN ${ideas.listingPlan} = 'featured' THEN 0 ELSE 1 END`,
                desc(ideas.createdAt),
              ];

    const rows = await db
      .select({
        idea: ideas,
        innovatorName: users.fullName,
        innovatorCity: users.city,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.userId, users.id))
      .where(and(...conditions))
      .orderBy(...orderBy);

    // Fetch top match score per idea
    const allMatches = await db.select().from(aiMatches);
    const matchesByIdea = new Map<number, { count: number; topScore: number }>();
    for (const m of allMatches) {
      const existing = matchesByIdea.get(m.ideaId) || { count: 0, topScore: 0 };
      existing.count += 1;
      existing.topScore = Math.max(existing.topScore, m.compatibilityScore);
      matchesByIdea.set(m.ideaId, existing);
    }

    const result = rows.map((r) => {
      const stats = matchesByIdea.get(r.idea.id) || { count: 0, topScore: 0 };
      return {
        ...r.idea,
        innovatorName: r.innovatorName,
        innovatorCity: r.innovatorCity,
        aiMatchCount: stats.count,
        topMatchScore: stats.topScore,
      };
    });

    return NextResponse.json({ ideas: result });
  } catch (error) {
    console.error("GET /api/ideas error:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست ایده‌ها" }, { status: 500 });
  }
}

const createIdeaSchema = z.object({
  title: z.string().min(4, "عنوان ایده حداقل باید ۴ کاراکتر باشد"),
  tagline: z.string().min(8, "خلاصه یک‌خطی ایده را کامل‌تر بنویسید"),
  description: z.string().min(20, "توضیحات ایده حداقل باید ۲۰ کاراکتر باشد"),
  marketPotential: z.string().min(10, "بازار هدف و مدل درآمدی را وارد کنید"),
  category: z.string().min(2),
  stage: z.enum(["concept", "prototype", "mvp", "growth"]),
  fundingNeededToman: z.number().min(10_000_000, "حداقل سرمایه مورد نیاز ۱۰ میلیون تومان است"),
  equityOfferedPercent: z.number().min(1).max(80),
  teamSize: z.number().min(1).max(50).default(2),
  innovatorAge: z.number().min(14).max(45).default(24),
  city: z.string().default("تهران"),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  demoUrl: z.string().optional(),
  prestashopProductRef: z.string().optional(),
  listingPlan: z.enum(["standard", "featured"]).default("standard"),
  sourceChannel: z.string().default("direct"),
  // Optional inline account creation if guest came directly from PrestaShop
  guestFullName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const parsed = createIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "اطلاعات فرم ناقص است" },
        { status: 400 }
      );
    }

    let currentUser = await getCurrentUser();
    let userId: number;

    if (currentUser) {
      userId = currentUser.id;
    } else {
      if (!parsed.data.guestFullName || !parsed.data.guestEmail) {
        return NextResponse.json(
          { error: "لطفاً نام و ایمیل خود را وارد کنید یا وارد حساب کاربری شوید" },
          { status: 400 }
        );
      }

      const emailNorm = parsed.data.guestEmail.trim().toLowerCase();
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, emailNorm))
        .limit(1);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            fullName: parsed.data.guestFullName.trim(),
            email: emailNorm,
            phone: parsed.data.guestPhone?.trim() || null,
            passwordHash: hashPassword("123456"),
            role: "innovator",
            city: parsed.data.city || "تهران",
          })
          .returning();
        userId = newUser.id;
      }
      await createSessionCookie(userId);
    }

    const plan =
      IDEA_LISTING_PLANS.find((p) => p.id === parsed.data.listingPlan) ??
      IDEA_LISTING_PLANS[0];

    const readinessScore = calculateIdeaReadinessScore({
      stage: parsed.data.stage,
      description: parsed.data.description,
      marketPotential: parsed.data.marketPotential,
      teamSize: parsed.data.teamSize,
      tags: parsed.data.tags,
      demoUrl: parsed.data.demoUrl,
      equityOfferedPercent: parsed.data.equityOfferedPercent,
    });

    const coverImage =
      parsed.data.coverImage && parsed.data.coverImage.trim().length > 0
        ? parsed.data.coverImage.trim()
        : COVER_IMAGE_PRESETS[0].url;

    const [createdIdea] = await db
      .insert(ideas)
      .values({
        slug: generateSlug(parsed.data.title),
        userId,
        title: parsed.data.title.trim(),
        tagline: parsed.data.tagline.trim(),
        description: parsed.data.description.trim(),
        marketPotential: parsed.data.marketPotential.trim(),
        category: parsed.data.category,
        stage: parsed.data.stage,
        fundingNeededToman: parsed.data.fundingNeededToman,
        equityOfferedPercent: parsed.data.equityOfferedPercent,
        teamSize: parsed.data.teamSize,
        innovatorAge: parsed.data.innovatorAge,
        city: parsed.data.city || "تهران",
        tags: parsed.data.tags.length > 0 ? parsed.data.tags : [parsed.data.category],
        coverImage,
        demoUrl: parsed.data.demoUrl?.trim() || null,
        prestashopProductRef: parsed.data.prestashopProductRef?.trim() || null,
        listingFeePaid: true,
        listingPlan: plan.id,
        fundingStatus: "unfunded",
        aiReadinessScore: readinessScore,
      })
      .returning();

    // Record simulated gateway payment for youth idea submission
    const trackingCode = generateTrackingCode("IDP");
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        userId,
        paymentType: "idea_listing",
        referenceId: createdIdea.id,
        planName: plan.name,
        amountToman: plan.priceToman,
        status: "paid",
        trackingCode,
        sourceChannel: parsed.data.sourceChannel || "direct",
      })
      .returning();

    // Immediately run AI matching against all active paid investors!
    const activeInvestors = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.membershipStatus, "active"));

    const generatedMatches = [];
    for (const inv of activeInvestors) {
      const score = computeAiMatch(createdIdea, inv);
      if (score.compatibilityScore >= 55) {
        const [m] = await db
          .insert(aiMatches)
          .values({
            ideaId: createdIdea.id,
            investorProfileId: inv.id,
            compatibilityScore: score.compatibilityScore,
            categoryScore: score.categoryScore,
            budgetScore: score.budgetScore,
            stageScore: score.stageScore,
            synergyScore: score.synergyScore,
            aiSummary: score.aiSummary,
            aiHighlights: score.aiHighlights,
            aiRiskNote: score.aiRiskNote,
            status: "suggested",
          })
          .returning();
        generatedMatches.push({
          ...m,
          organizationName: inv.organizationName,
        });
      }
    }

    generatedMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json(
      {
        idea: createdIdea,
        payment: paymentRecord,
        matches: generatedMatches,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ideas error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت ایده و تکمیل پرداخت" },
      { status: 500 }
    );
  }
}
