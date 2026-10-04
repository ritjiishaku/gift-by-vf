import { NextRequest, NextResponse } from "next/server";
import { REP_COOKIE, signRepSession } from "../../../../lib/access";
import { getSiteContent } from "../../../../lib/content-store";
import { verifyRepAccessCode } from "../../../../lib/rep-access-code";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const repId = String(body.repId || "").trim().toLowerCase();
  const accessCode = String(body.accessCode || "").trim();
  const content = await getSiteContent();
  const rep = content.reps.find((item) => item.isActive && item.repId.toLowerCase() === repId);

  const validCode = rep?.accessCodeHash
    ? await verifyRepAccessCode(accessCode, rep.accessCodeHash)
    : Boolean(rep?.accessCode && rep.accessCode === accessCode);

  if (!rep || !validCode) {
    return NextResponse.json({ ok: false, message: "Rep ID or access code is incorrect." }, { status: 401 });
  }

  const session = signRepSession(rep.repId);
  if (!session) return NextResponse.json({ ok: false, message: "Rep sign-in is not configured for production." }, { status: 503 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: REP_COOKIE,
    value: session,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}