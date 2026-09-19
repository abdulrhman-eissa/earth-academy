import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  AUTH_COOKIE,
  createSessionToken,
  readSessionToken,
  ALL_AUTH_COOKIES,
  cookieNameForRole,
  type AuthRole,
} from "@/lib/session-token";

export { AUTH_COOKIE, createSessionToken, readSessionToken, cookieNameForRole };

export async function currentSession(expectedRole?: AuthRole) {
  const cookieStore = await cookies();
  if (expectedRole) {
    const name = cookieNameForRole(expectedRole);
    const value = cookieStore.get(name)?.value;
    if (!value) return null;
    return readSessionToken(value);
  }
  for (const name of ALL_AUTH_COOKIES) {
    const value = cookieStore.get(name)?.value;
    if (!value) continue;
    const session = await readSessionToken(value);
    if (session) return session;
  }
  return null;
}

export async function authenticate(identifier: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: identifier.trim().toLowerCase() } });
  if (!user || user.status !== "ACTIVE" || !(await verifyPassword(password, user.passwordHash))) return null;
  return user;
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  );
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [, saltPart, hashPart] = encoded.split("$");
    if (!saltPart || !hashPart) return false;
    const expected = Buffer.from(hashPart, "base64url");
    const actual = await new Promise<Buffer>((resolve, reject) =>
      crypto.scrypt(password, Buffer.from(saltPart, "base64url"), expected.length, { N: 16384, r: 8, p: 1 }, (error, key) =>
        error ? reject(error) : resolve(key)
      )
    );
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function sessionCookie(token: string, role: string) {
  return {
    name: cookieNameForRole(role as AuthRole),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
