import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { investorProfiles, users, payments, ideas, aiMatches } from "@/db/schema";
import { createSessionCookie, getCurrentUser, hashPassword } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";
import { INVESTOR_MEMBERSHIP_PLANS, generateTrackingCode } from "@/lib/constants";
import { computeAiMatch } from "@/lib/ai-matcher";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select({
        profile: investorProfiles,
        userName: users.fullName,
        city: users.city,
      })
      .from(investorProfiles)
      .innerJoin(users, eq(investorProfiles.userId, users.id))
      .where(eq(investorProfiles.membershipStatus, "active"))
      .orderBy(desc(investorProfiles.createdAt));

    return NextResponse.json({
      investors: rows.map((r) => ({
        ...r.profile,
        userName: r.userName,
        city: r.city,
      })),
    });
  } catch (error) {
    console.error("GET /api/investors error:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست سرمایه‌گذاران" }, { status: 500 });
  }
}

const investorEnrollSchema = z.object({
  organizationName: z.string().min(2, "نام شرکت یا صندوق را وارد کنید"),
  membershipPlan: z.enum(["starter", "pro", "enterprise"]),
  preferredCategories: z.array(z.string()).min(1, "حداقل یک حوزه علاقه‌مندی انتخاب کنید"),
  preferredStages: z.array(z.string()).min(1, "حداقل یک مرحله بلوغ محصول انتخاب کنید"),
  minBudgetToman: z.number().min(50_000_000),
  maxBudgetToman: z.number().min(100_000_000),
  investmentThesis: z.string().min(15, "توضیح رویکرد سرمایه‌گذاری را کامل‌تر بنویسید"),
  keywords: z.array(z.string()).default([]),
  sourceChannel: z.string().default("direct"),
  // Guest fields if not logged in
  guestFullName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  city: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const parsed = investorEnrollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "اطلاعات عضویت ناقص است" },
        { status: 400 }
      );
    }

    if (parsed.data.maxBudgetToman < parsed.data.minBudgetToman) {
      return NextResponse.json(
        { error: "حداکثر بودجه باید بزرگتر یا مساوی حداقل بودجه باشد" },
        { status: 400 }
      );
    }

    let currentUser = await getCurrentUser();
    let userId: number;

    if (currentUser) {
      userId = currentUser.id;
      await db
        .update(users)
        .set({
          role: "investor",
          companyName: parsed.data.organizationName.trim(),
        })
        .where(eq(users.id, userId));
    } else {
      if (!parsed.data.guestFullName || !parsed.data.guestEmail) {
        return NextResponse.json(
          { error: "لطفاً نام و ایمیل خود را وارد کنید یا وارد حساب کاربری شوید" },
          { status: 400 }
        );
      }

      const emailNorm = parsed.data.guestEmail.trim().toLowerCase();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, emailNorm))
        .limit(1);

      if (existing) {
        userId = existing.id;
        await db
          .update(users)
          .set({ role: "investor", companyName: parsed.data.organizationName.trim() })
          .where(eq(users.id, userId));
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            fullName: parsed.data.guestFullName.trim(),
            email: emailNorm,
            phone: parsed.data.guestPhone?.trim() || null,
            passwordHash: hashPassword("123456"),
            role: "investor",
            city: parsed.data.city || "تهران",
            companyName: parsed.data.organizationName.trim(),
          })
          .returning();
        userId = newUser.id;
      }
      await createSessionCookie(userId);
    }

    const plan =
      INVESTOR_MEMBERSHIP_PLANS.find((p) => p.id === parsed.data.membershipPlan) ??
      INVESTOR_MEMBERSHIP_PLANS[1];

    const durationDays =
      plan.id === "enterprise" ? 365 : plan.id === "pro" ? 180 : 90;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * durationDays);

    const [existingProfile] = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, userId))
      .limit(1);

    let profile;
    if (existingProfile) {
      [profile] = await db
        .update(investorProfiles)
        .set({
          organizationName: parsed.data.organizationName.trim(),
          membershipPlan: plan.id,
          membershipStatus: "active",
          membershipExpiresAt: expiresAt,
          preferredCategories: parsed.data.preferredCategories,
          preferredStages: parsed.data.preferredStages,
          minBudgetToman: parsed.data.minBudgetToman,
          maxBudgetToman: parsed.data.maxBudgetToman,
          investmentThesis: parsed.data.investmentThesis.trim(),
          keywords:
            parsed.data.keywords.length > 0
              ? parsed.data.keywords
              : parsed.data.preferredCategories,
          verified: true,
        })
        .where(eq(investorProfiles.id, existingProfile.id))
        .returning();
    } else {
      [profile] = await db
        .insert(investorProfiles)
        .values({
          userId,
          organizationName: parsed.data.organizationName.trim(),
          membershipPlan: plan.id,
          membershipStatus: "active",
          membershipExpiresAt: expiresAt,
          preferredCategories: parsed.data.preferredCategories,
          preferredStages: parsed.data.preferredStages,
          minBudgetToman: parsed.data.minBudgetToman,
          maxBudgetToman: parsed.data.maxBudgetToman,
          investmentThesis: parsed.data.investmentThesis.trim(),
          keywords:
            parsed.data.keywords.length > 0
              ? parsed.data.keywords
              : parsed.data.preferredCategories,
          verified: true,
        })
        .returning();
    }

    // Record paid membership receipt
    const trackingCode = generateTrackingCode("INV");
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        userId,
        paymentType: "investor_membership",
        referenceId: profile.id,
        planName: `${plan.name} (${plan.durationLabel})`,
        amountToman: plan.priceToman,
        status: "paid",
        trackingCode,
        sourceChannel: parsed.data.sourceChannel || "direct",
      })
      .returning();

    // Immediately run AI matching engine against all published ideas!
    const allIdeas = await db
      .select()
      .from(ideas)
      .where(eq(ideas.listingFeePaid, true));

    // Clear old suggested matches for this investor so fresh scores populate cleanly
    await db
      .delete(aiMatches)
      .where(eq(aiMatches.investorProfileId, profile.id));

    const newMatches = [];
    for (const idea of allIdeas) {
      const score = computeAiMatch(idea, profile);
      const [m] = await db
        .insert(aiMatches)
        .values({
          ideaId: idea.id,
          investorProfileId: profile.id,
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
      newMatches.push({
        ...m,
        ideaTitle: idea.title,
        ideaCategory: idea.category,
      });
    }

    newMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json(
      {
        profile,
        payment: paymentRecord,
        topMatches: newMatches.slice(0, 5),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/investors error:", error);
    return NextResponse.json(
      { error: "خطا در فعال‌سازی عضویت کارفرما و پرداخت" },
      { status: 500 }
    );
  }
}
