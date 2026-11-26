import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

/**
 * اتصال باید «تنبل» (lazy) باشد تا مرحله `next build` روی هاست‌هایی که هنوز
 * متغیرهای محیطی را تزریق نکرده‌اند (مثل بیلد داخل Docker) شکست نخورد.
 * در زمان بیلد هیچ کوئری‌ای اجرا نمی‌شود، پس نبودِ DATABASE_URL مانع ساخت نمی‌شود؛
 * اما در زمان اجرا، اولین کوئری خطای واضح فارسی برمی‌گرداند تا صفحه راه‌اندازی
 * (/api/setup) نمایش داده شود.
 */
function createPool(connectionString: string | undefined): Pool {
  const pool = new Pool(
    connectionString
      ? { connectionString }
      : {
          // مقدار موقت صرفاً برای جلوگیری از کرش در زمان بیلد؛ هرگز به دیتابیس واقعی وصل نمی‌شود.
          host: "127.0.0.1",
          port: 5432,
          user: "postgres",
          password: "postgres",
          database: "app_db",
        }
  );

  // جلوگیری از Unhandled error هنگام خاموش‌شدن دیتابیس
  pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err.message);
  });

  return pool;
}

export const pool: Pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? createPool(databaseUrl);

export const db: NodePgDatabase =
  globalForDb.__arenaNextJsPostgresqlDb ?? drizzle(pool);

if (!databaseUrl) {
  console.error(
    "[idehpol] DATABASE_URL تنظیم نشده است. پس از تنظیم در متغیرهای محیطی، صفحه /api/setup را باز کنید."
  );
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  globalForDb.__arenaNextJsPostgresqlDb = db;
}
