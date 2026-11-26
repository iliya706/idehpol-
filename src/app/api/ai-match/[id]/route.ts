import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiMatches, ideas } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/lib/seed";

const updateMatchSchema = z.object({
  status: z.enum(["suggested", "interested", "meeting_requested", "funded", "declined"]),
  investorMessage: z.string().optional(),
  proposedAmountToman: z.number().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { id } = await context.params;
    const matchId = Number(id);
    if (!Number.isInteger(matchId)) {
      return NextResponse.json({ error: "شناسه تطبیق نامعتبر است" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "اطلاعات وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(aiMatches)
      .where(eq(aiMatches.id, matchId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "رکورد تطبیق یافت نشد" }, { status: 404 });
    }

    const [updated] = await db
      .update(aiMatches)
      .set({
        status: parsed.data.status,
        investorMessage:
          parsed.data.investorMessage !== undefined
            ? parsed.data.investorMessage
            : existing.investorMessage,
        proposedAmountToman:
          parsed.data.proposedAmountToman !== undefined
            ? parsed.data.proposedAmountToman
            : existing.proposedAmountToman,
        updatedAt: new Date(),
      })
      .where(eq(aiMatches.id, matchId))
      .returning();

    // Update parent idea funding status automatically!
    if (parsed.data.status === "funded") {
      await db
        .update(ideas)
        .set({ fundingStatus: "funded" })
        .where(eq(ideas.id, existing.ideaId));
    } else if (
      parsed.data.status === "meeting_requested" ||
      parsed.data.status === "interested"
    ) {
      const [idea] = await db
        .select()
        .from(ideas)
        .where(eq(ideas.id, existing.ideaId))
        .limit(1);

      if (idea && idea.fundingStatus === "unfunded") {
        await db
          .update(ideas)
          .set({ fundingStatus: "negotiating" })
          .where(eq(ideas.id, existing.ideaId));
      }
    }

    return NextResponse.json({ match: updated });
  } catch (error) {
    console.error("PATCH /api/ai-match/[id] error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی وضعیت تطبیق" },
      { status: 500 }
    );
  }
}
