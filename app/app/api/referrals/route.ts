import { NextRequest, NextResponse } from "next/server";
import { getSiteContent } from "../../../lib/content-store";

export async function GET(request: NextRequest) {
  const repId = (request.nextUrl.searchParams.get("ref") || "").trim().toLowerCase();
  const content = await getSiteContent();
  const rep = content.reps.find((item) => item.isActive && item.repId.toLowerCase() === repId);

  if (!rep) return NextResponse.json({ message: "Referral not found." }, { status: 404 });
  return NextResponse.json({ repId: rep.repId, name: rep.name });
}