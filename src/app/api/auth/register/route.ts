import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

const registerSchema = z.object({
  fullName: z.string().min(2, "نام و نام خانوادگی حداقل باید ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل واردشده معتبر نیست"),
  phone: z.string().optional(),
  password: z.string().min(6, "رمز عبور حداقل باید ۶ کاراکتر باشد"),
  role: z.enum(["innovator", "investor"]).default("innovator"),
  city: z.string().optional(),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "اطلاعات ورودی نامعتبر است" },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً در سامانه ثبت شده است. لطفاً وارد شوید." },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(users)
      .values({
        fullName: parsed.data.fullName.trim(),
        email: emailNormalized,
        phone: parsed.data.phone?.trim() || null,
        passwordHash: hashPassword(parsed.data.password),
        role: parsed.data.role,
        city: parsed.data.city?.trim() || "تهران",
        companyName: parsed.data.companyName?.trim() || null,
      })
      .returning();

    await createSessionCookie(created.id);

    const { passwordHash: _, ...safeUser } = created;
    void _;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "خطای سرور هنگام ثبت‌نام رخ داد" },
      { status: 500 }
    );
  }
}
