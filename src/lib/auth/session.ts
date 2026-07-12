import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { RoleKey } from "@prisma/client";

const COOKIE_NAME = "transitops_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours (default session)
const REMEMBER_AGE = 60 * 60 * 24 * 30; // 30 days ("Remember me")

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload, rememberMe = false) {
  const maxAge = rememberMe ? REMEMBER_AGE : MAX_AGE;

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as RoleKey,
    };
  } catch {
    return null;
  }
}
