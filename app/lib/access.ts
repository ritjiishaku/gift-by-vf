import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "./admin-session";

export const ADMIN_COOKIE = "giftbyvf-admin-auth";
export const REP_COOKIE = "giftbyvf-rep-session";

export async function hasAdminAccess(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function currentRepId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(REP_COOKIE)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  const secret = getRepSessionSecret();
  if (!payload || !signature || !secret) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { repId: string; expiresAt: number };
    return session.expiresAt > Date.now() ? session.repId : null;
  } catch {
    return null;
  }
}

export function signRepSession(repId: string) {
  const secret = getRepSessionSecret();
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({ repId, expiresAt: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getRepSessionSecret() {
  return process.env.REP_SESSION_SECRET || "giftbyvf-rep-session-secret-key-12345";
}