import { NextResponse } from "next/server";
import { REP_COOKIE } from "../../../../lib/access";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: REP_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}