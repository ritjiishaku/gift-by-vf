import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "../../../../lib/admin-session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "giftbyvf-admin");

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ password: "" }));
  const password = String(body.password ?? "").trim();

  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, message: "Admin password is not configured." }, { status: 503 });
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, message: "Incorrect access code. Please use a valid staff password." },
      { status: 401 }
    );
  }

  const session = await createAdminSession();
  if (!session) return NextResponse.json({ ok: false, message: "Admin session signing is not configured." }, { status: 503 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "giftbyvf-admin-auth",
    value: session,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
