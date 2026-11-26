import crypto from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, investorProfiles, type User, type InvestorProfile } from "@/db/schema";

const SESSION_COOKIE_NAME = "idehpol_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "idehpol-persian-ai-matchmaking-secret-key-1404";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(payload: { userId: number; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string): { userId: number; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof parsed.userId !== "number" || typeof parsed.exp !== "number") {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: number) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const token = signToken({ userId, exp });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export type SessionUser = Omit<User, "passwordHash"> & {
  investorProfile: InvestorProfile | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) return null;

    const [profile] = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, user.id))
      .limit(1);

    const { passwordHash: _, ...safeUser } = user;
    void _;
    return {
      ...safeUser,
      investorProfile: profile ?? null,
    };
  } catch {
    return null;
  }
}
