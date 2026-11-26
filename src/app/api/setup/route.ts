import { NextResponse } from "next/server";
import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, investorProfiles, ideas, payments, aiMatches } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ساخت خودکار جدول‌ها + درج داده‌های نمونه، فقط با باز کردن یک آدرس در مرورگر.
 * برای هاست‌های رایگان (Liara / Render / Vercel ...) که ترمینال در دسترس نیست.
 *
 *   https://YOUR-DOMAIN/api/setup?token=idehpol-setup
 *
 * توکن را می‌توانید با متغیر محیطی SETUP_TOKEN تغییر دهید.
 */
const DEFAULT_TOKEN = "idehpol-setup";

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'innovator',
    city text DEFAULT 'تهران',
    bio text,
    company_name text,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS investor_profiles (
    id serial PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name text NOT NULL,
    membership_plan text NOT NULL DEFAULT 'pro',
    membership_status text NOT NULL DEFAULT 'active',
    membership_expires_at timestamp,
    preferred_categories jsonb NOT NULL,
    preferred_stages jsonb NOT NULL,
    min_budget_toman bigint NOT NULL,
    max_budget_toman bigint NOT NULL,
    investment_thesis text NOT NULL,
    keywords jsonb NOT NULL,
    verified boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ideas (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    tagline text NOT NULL,
    description text NOT NULL,
    market_potential text NOT NULL,
    category text NOT NULL,
    stage text NOT NULL,
    funding_needed_toman bigint NOT NULL,
    equity_offered_percent integer NOT NULL DEFAULT 15,
    team_size integer NOT NULL DEFAULT 2,
    innovator_age integer DEFAULT 24,
    city text DEFAULT 'تهران',
    tags jsonb NOT NULL,
    cover_image text NOT NULL,
    demo_url text,
    prestashop_product_ref text,
    listing_fee_paid boolean NOT NULL DEFAULT false,
    listing_plan text NOT NULL DEFAULT 'standard',
    funding_status text NOT NULL DEFAULT 'unfunded',
    ai_readiness_score integer NOT NULL DEFAULT 80,
    views_count integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_type text NOT NULL,
    reference_id integer,
    plan_name text NOT NULL,
    amount_toman bigint NOT NULL,
    status text NOT NULL DEFAULT 'paid',
    tracking_code text NOT NULL UNIQUE,
    gateway text NOT NULL DEFAULT 'زرین‌پال (شبیه‌ساز اختصاصی)',
    source_channel text DEFAULT 'direct',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ai_matches (
    id serial PRIMARY KEY,
    idea_id integer NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    investor_profile_id integer NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,
    compatibility_score integer NOT NULL,
    category_score integer NOT NULL,
    budget_score integer NOT NULL,
    stage_score integer NOT NULL,
    synergy_score integer NOT NULL,
    ai_summary text NOT NULL,
    ai_highlights jsonb NOT NULL,
    ai_risk_note text NOT NULL,
    status text NOT NULL DEFAULT 'suggested',
    investor_message text,
    proposed_amount_toman bigint,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
];

function wantsHtml(req: Request): boolean {
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

function page(title: string, inner: string, status = 200) {
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} | ایده‌پل</title>
<style>
  body{margin:0;background:#faf9f6;color:#0f172a;font-family:Vazirmatn,Tahoma,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{max-width:640px;width:100%;background:#fff;border:1px solid #e7e5de;border-radius:20px;padding:28px;box-shadow:0 10px 30px -18px rgba(15,23,42,.25)}
  h1{font-size:20px;margin:0 0 12px}
  p{font-size:14px;line-height:1.9;color:#475569;margin:0 0 10px}
  .ok{color:#047857;font-weight:800}
  .bad{color:#be123c;font-weight:800}
  ul{font-size:13px;line-height:2;color:#334155;padding-right:18px}
  code{background:#f1f5f9;border-radius:6px;padding:2px 6px;font-family:monospace;direction:ltr;display:inline-block}
  a.btn{display:inline-block;margin-top:14px;background:#4338ca;color:#fff;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:700;font-size:14px}
</style>
</head>
<body><div class="card">${inner}</div></body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("token") || req.headers.get("x-setup-token") || "";
  const expected = (process.env.SETUP_TOKEN || DEFAULT_TOKEN).trim();

  if (provided.trim() !== expected) {
    const message = "توکن راه‌اندازی نامعتبر است. آدرس را با توکن صحیح باز کنید.";
    if (wantsHtml(req)) {
      return page(
        "دسترسی غیرمجاز",
        `<h1 class="bad">دسترسی غیرمجاز</h1>
         <p>${message}</p>
         <p>نمونه آدرس صحیح:</p>
         <p><code>/api/setup?token=YOUR_SETUP_TOKEN</code></p>`,
        403
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }

  try {
    for (const statement of DDL_STATEMENTS) {
      await db.execute(sql.raw(statement));
    }

    await ensureDatabaseSeeded();

    const [{ value: usersCount }] = await db.select({ value: count() }).from(users);
    const [{ value: ideasCount }] = await db.select({ value: count() }).from(ideas);
    const [{ value: investorsCount }] = await db
      .select({ value: count() })
      .from(investorProfiles);
    const [{ value: paymentsCount }] = await db.select({ value: count() }).from(payments);
    const [{ value: matchesCount }] = await db.select({ value: count() }).from(aiMatches);

    const stats = { usersCount, ideasCount, investorsCount, paymentsCount, matchesCount };

    if (wantsHtml(req)) {
      return page(
        "راه‌اندازی موفق",
        `<h1 class="ok">✅ دیتابیس با موفقیت آماده شد</h1>
         <p>جدول‌ها ساخته شدند و داده‌های نمونه درج شدند. سایت اکنون آماده استفاده است.</p>
         <ul>
           <li>کاربران: ${usersCount}</li>
           <li>ایده‌های ثبت‌شده: ${ideasCount}</li>
           <li>سرمایه‌گذاران عضو: ${investorsCount}</li>
           <li>رسیدهای پرداخت: ${paymentsCount}</li>
           <li>تطبیق‌های هوش مصنوعی: ${matchesCount}</li>
         </ul>
         <p>ورود آزمایشی ایده‌پرداز: <code>sara@idehpol.ir</code> / رمز: <code>123456</code></p>
         <p>ورود آزمایشی سرمایه‌گذار: <code>investor@idehpol.ir</code> / رمز: <code>123456</code></p>
         <a class="btn" href="/">رفتن به سایت ایده‌پل</a>`
      );
    }

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Setup error:", error);

    if (wantsHtml(req)) {
      return page(
        "خطای راه‌اندازی",
        `<h1 class="bad">راه‌اندازی انجام نشد</h1>
         <p>علت احتمالی: مقدار <code>DATABASE_URL</code> در تنظیمات هاست درست نیست،
         یا دیتابیس هنوز ساخته نشده / آماده نیست.</p>
         <p>پیام سرور:</p>
         <p><code>${detail.replace(/</g, "&lt;").slice(0, 400)}</code></p>
         <p>پس از اصلاح متغیر محیطی، همین صفحه را دوباره باز کنید.</p>
         <a class="btn" href="/api/health">بررسی سلامت اتصال دیتابیس</a>`,
        500
      );
    }

    return NextResponse.json({ ok: false, error: detail }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
