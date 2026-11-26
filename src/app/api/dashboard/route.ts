import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ideas, payments, aiMatches, investorProfiles, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const user = await getCurrentUser();

    // Also compute global platform stats
    const allIdeas = await db.select().from(ideas);
    const allInvestors = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.membershipStatus, "active"));
    const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));

    const platformStats = {
      totalIdeas: allIdeas.length,
      unfundedIdeas: allIdeas.filter((i) => i.fundingStatus === "unfunded").length,
      fundedOrNegotiating: allIdeas.filter((i) => i.fundingStatus !== "unfunded").length,
      activeInvestors: allInvestors.length,
      totalTransactions: allPayments.length,
    };

    if (!user) {
      return NextResponse.json({
        user: null,
        platformStats,
        myIdeas: [],
        myPayments: [],
        myMatches: [],
      });
    }

    const myIdeas = await db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, user.id))
      .orderBy(desc(ideas.createdAt));

    const myPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, user.id))
      .orderBy(desc(payments.createdAt));

    let myMatches: Array<Record<string, unknown>> = [];

    if (user.investorProfile) {
      const rows = await db
        .select({
          match: aiMatches,
          idea: ideas,
          innovatorName: users.fullName,
          innovatorPhone: users.phone,
          innovatorEmail: users.email,
        })
        .from(aiMatches)
        .innerJoin(ideas, eq(aiMatches.ideaId, ideas.id))
        .innerJoin(users, eq(ideas.userId, users.id))
        .where(eq(aiMatches.investorProfileId, user.investorProfile.id))
        .orderBy(desc(aiMatches.compatibilityScore));

      myMatches = rows.map((r) => ({
        ...r.match,
        direction: "outgoing",
        idea: r.idea,
        counterpartName: r.innovatorName,
        counterpartPhone: r.innovatorPhone,
        counterpartEmail: r.innovatorEmail,
      }));
    } else if (myIdeas.length > 0) {
      const ideaIds = myIdeas.map((i) => i.id);
      const rows = await db
        .select({
          match: aiMatches,
          idea: ideas,
          investor: investorProfiles,
          investorUserName: users.fullName,
        })
        .from(aiMatches)
        .innerJoin(ideas, eq(aiMatches.ideaId, ideas.id))
        .innerJoin(investorProfiles, eq(aiMatches.investorProfileId, investorProfiles.id))
        .innerJoin(users, eq(investorProfiles.userId, users.id))
        .where(inArray(aiMatches.ideaId, ideaIds))
        .orderBy(desc(aiMatches.compatibilityScore));

      myMatches = rows.map((r) => ({
        ...r.match,
        direction: "incoming",
        idea: r.idea,
        investor: r.investor,
        counterpartName: r.investor.organizationName,
        counterpartContactName: r.investorUserName,
      }));
    }

    return NextResponse.json({
      user,
      platformStats,
      myIdeas,
      myPayments,
      myMatches,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "خطا در بارگذاری اطلاعات پنل" }, { status: 500 });
  }
}
