import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiMatches, ideas, investorProfiles, users } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/lib/seed";
import { computeAiMatch } from "@/lib/ai-matcher";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const investorProfileId = searchParams.get("investorProfileId");
    const ideaId = searchParams.get("ideaId");
    const onlyUnfunded = searchParams.get("onlyUnfunded") === "true";

    const conditions = [];
    if (investorProfileId && Number.isInteger(Number(investorProfileId))) {
      conditions.push(eq(aiMatches.investorProfileId, Number(investorProfileId)));
    }
    if (ideaId && Number.isInteger(Number(ideaId))) {
      conditions.push(eq(aiMatches.ideaId, Number(ideaId)));
    }
    if (onlyUnfunded) {
      conditions.push(eq(ideas.fundingStatus, "unfunded"));
    }

    const rows = await db
      .select({
        match: aiMatches,
        idea: ideas,
        innovatorName: users.fullName,
        investor: investorProfiles,
      })
      .from(aiMatches)
      .innerJoin(ideas, eq(aiMatches.ideaId, ideas.id))
      .innerJoin(users, eq(ideas.userId, users.id))
      .innerJoin(investorProfiles, eq(aiMatches.investorProfileId, investorProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiMatches.compatibilityScore), desc(aiMatches.updatedAt));

    return NextResponse.json({
      matches: rows.map((r) => ({
        ...r.match,
        idea: {
          ...r.idea,
          innovatorName: r.innovatorName,
        },
        investor: r.investor,
      })),
    });
  } catch (error) {
    console.error("GET /api/ai-match error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نتایج تطبیق هوش مصنوعی" },
      { status: 500 }
    );
  }
}

const runMatchSchema = z.object({
  investorProfileId: z.number().optional(),
  ideaId: z.number().optional(),
  customKeywords: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const parsed = runMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "پارامترهای ورودی نامعتبر است" }, { status: 400 });
    }

    const { investorProfileId, ideaId, customKeywords } = parsed.data;

    const targetInvestors = investorProfileId
      ? await db
          .select()
          .from(investorProfiles)
          .where(eq(investorProfiles.id, investorProfileId))
      : await db
          .select()
          .from(investorProfiles)
          .where(eq(investorProfiles.membershipStatus, "active"));

    const targetIdeas = ideaId
      ? await db.select().from(ideas).where(eq(ideas.id, ideaId))
      : await db.select().from(ideas).where(eq(ideas.listingFeePaid, true));

    if (targetInvestors.length === 0 || targetIdeas.length === 0) {
      return NextResponse.json(
        { error: "ایده یا سرمایه‌گذار فعالی برای اجرای تطبیق یافت نشد" },
        { status: 404 }
      );
    }

    let computedCount = 0;

    for (const inv of targetInvestors) {
      const augmentedInvestor =
        customKeywords && customKeywords.trim().length > 0
          ? {
              ...inv,
              keywords: [
                ...inv.keywords,
                ...customKeywords
                  .split(/[،,\s]+/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              ],
            }
          : inv;

      for (const idea of targetIdeas) {
        const score = computeAiMatch(idea, augmentedInvestor);

        const [existing] = await db
          .select()
          .from(aiMatches)
          .where(
            and(
              eq(aiMatches.ideaId, idea.id),
              eq(aiMatches.investorProfileId, inv.id)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(aiMatches)
            .set({
              compatibilityScore: score.compatibilityScore,
              categoryScore: score.categoryScore,
              budgetScore: score.budgetScore,
              stageScore: score.stageScore,
              synergyScore: score.synergyScore,
              aiSummary: score.aiSummary,
              aiHighlights: score.aiHighlights,
              aiRiskNote: score.aiRiskNote,
              updatedAt: new Date(),
            })
            .where(eq(aiMatches.id, existing.id));
        } else {
          await db.insert(aiMatches).values({
            ideaId: idea.id,
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
          });
        }
        computedCount += 1;
      }
    }

    // Return refreshed matches
    const conditions = [];
    if (investorProfileId) {
      conditions.push(eq(aiMatches.investorProfileId, investorProfileId));
    }
    if (ideaId) {
      conditions.push(eq(aiMatches.ideaId, ideaId));
    }

    const refreshed = await db
      .select({
        match: aiMatches,
        idea: ideas,
        innovatorName: users.fullName,
        investor: investorProfiles,
      })
      .from(aiMatches)
      .innerJoin(ideas, eq(aiMatches.ideaId, ideas.id))
      .innerJoin(users, eq(ideas.userId, users.id))
      .innerJoin(investorProfiles, eq(aiMatches.investorProfileId, investorProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiMatches.compatibilityScore));

    return NextResponse.json({
      computedCount,
      matches: refreshed.map((r) => ({
        ...r.match,
        idea: { ...r.idea, innovatorName: r.innovatorName },
        investor: r.investor,
      })),
    });
  } catch (error) {
    console.error("POST /api/ai-match error:", error);
    return NextResponse.json(
      { error: "خطا در اجرای موتور هوش مصنوعی" },
      { status: 500 }
    );
  }
}
