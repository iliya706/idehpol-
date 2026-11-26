import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ideas, users, aiMatches, investorProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { id } = await context.params;
    const numericId = Number(id);

    const condition = Number.isInteger(numericId)
      ? eq(ideas.id, numericId)
      : eq(ideas.slug, id);

    const [row] = await db
      .select({
        idea: ideas,
        innovator: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          city: users.city,
          bio: users.bio,
        },
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.userId, users.id))
      .where(condition)
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "ایده مورد نظر یافت نشد" }, { status: 404 });
    }

    // Increment view counter cleanly
    await db
      .update(ideas)
      .set({ viewsCount: sql`${ideas.viewsCount} + 1` })
      .where(eq(ideas.id, row.idea.id));

    const currentUser = await getCurrentUser();
    const isActiveInvestor =
      currentUser?.investorProfile?.membershipStatus === "active";
    const isOwner = currentUser?.id === row.idea.userId;

    const matchRows = await db
      .select({
        match: aiMatches,
        investor: {
          id: investorProfiles.id,
          organizationName: investorProfiles.organizationName,
          membershipPlan: investorProfiles.membershipPlan,
          verified: investorProfiles.verified,
          minBudgetToman: investorProfiles.minBudgetToman,
          maxBudgetToman: investorProfiles.maxBudgetToman,
        },
      })
      .from(aiMatches)
      .innerJoin(investorProfiles, eq(aiMatches.investorProfileId, investorProfiles.id))
      .where(eq(aiMatches.ideaId, row.idea.id))
      .orderBy(desc(aiMatches.compatibilityScore));

    return NextResponse.json({
      idea: {
        ...row.idea,
        viewsCount: row.idea.viewsCount + 1,
      },
      innovator: {
        id: row.innovator.id,
        fullName: row.innovator.fullName,
        city: row.innovator.city,
        bio: row.innovator.bio,
        // Unlock direct contact for active paid investors or owner!
        email: isActiveInvestor || isOwner ? row.innovator.email : null,
        phone: isActiveInvestor || isOwner ? row.innovator.phone : null,
        contactUnlocked: isActiveInvestor || isOwner,
      },
      matches: matchRows.map((m) => ({
        ...m.match,
        investor: m.investor,
      })),
    });
  } catch (error) {
    console.error("GET /api/ideas/[id] error:", error);
    return NextResponse.json({ error: "خطا در بارگذاری جزئیات ایده" }, { status: 500 });
  }
}
