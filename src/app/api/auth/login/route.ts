import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, investorProfiles } from "@/db/schema";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

const loginSchema = z.object({
  email: z.string().email("ایمیل واردشده معتبر نیست"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "اطلاعات ورود نامعتبر است" },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور نادرست است" },
        { status: 401 }
      );
    }

    await createSessionCookie(user.id);

    const [profile] = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, user.id))
      .limit(1);

    const { passwordHash: _, ...safeUser } = user;
    void _;

    return NextResponse.json({
      user: { ...safeUser, investorProfile: profile ?? null },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطا در ورود به حساب کاربری" }, { status: 500 });
  }
}
