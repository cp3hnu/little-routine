import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { children, families, familyMembers, users, type User } from "./db/schema";
import { getEnv } from "./env";
import { hashPassword, newId, verifyPassword } from "./crypto";

const SESSION_COOKIE = "lr_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionData = {
  userId: string;
  createdAt: number;
};

export async function createSession(userId: string) {
  const token = newId();
  const env = getEnv();
  const data: SessionData = { userId, createdAt: Date.now() };
  await env.SESSION_KV.put(`session:${token}`, JSON.stringify(data), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getEnv().SESSION_KV.delete(`session:${token}`);
  }
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const raw = await getEnv().SESSION_KV.get(`session:${token}`);
  if (!raw) return null;
  const data = JSON.parse(raw) as SessionData;
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function registerUser(input: {
  phone: string;
  password: string;
  nickname: string;
  familyName?: string;
  locale?: string;
}) {
  const phone = input.phone.trim();
  const nickname = input.nickname.trim();
  if (!/^\d{6,20}$/.test(phone)) {
    throw new Error("INVALID_PHONE");
  }
  if (nickname.length < 1 || nickname.length > 32) {
    throw new Error("INVALID_NICKNAME");
  }
  if (input.password.length < 6) {
    throw new Error("WEAK_PASSWORD");
  }

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing.length) throw new Error("PHONE_TAKEN");

  const userId = newId();
  const familyId = newId();
  const passwordHash = await hashPassword(input.password);

  await db.insert(users).values({
    id: userId,
    phone,
    nickname,
    passwordHash,
    locale: input.locale === "en" ? "en" : "zh",
  });
  await db.insert(families).values({
    id: familyId,
    name: input.familyName?.trim() || (input.locale === "en" ? "My Family" : "我的家庭"),
    timezone: "Asia/Shanghai",
  });
  await db.insert(familyMembers).values({
    id: newId(),
    userId,
    familyId,
    role: "owner",
  });

  await createSession(userId);
  return userId;
}

export async function loginUser(phone: string, password: string) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.phone, phone.trim())).limit(1);
  if (!user) throw new Error("INVALID_CREDENTIALS");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  await createSession(user.id);
  return user;
}

export async function getUserFamily(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      family: families,
      role: familyMembers.role,
    })
    .from(familyMembers)
    .innerJoin(families, eq(families.id, familyMembers.familyId))
    .where(eq(familyMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function assertChildAccess(userId: string, childId: string) {
  const db = await getDb();
  const rows = await db
    .select({ child: children })
    .from(children)
    .innerJoin(familyMembers, eq(familyMembers.familyId, children.familyId))
    .where(and(eq(children.id, childId), eq(familyMembers.userId, userId)))
    .limit(1);
  if (!rows[0]) throw new Error("FORBIDDEN");
  return rows[0].child;
}
