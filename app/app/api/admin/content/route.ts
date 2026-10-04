import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "../../../../lib/access";
import { getSiteContent, saveSiteContent } from "../../../../lib/content-store";
import { hashRepAccessCode } from "../../../../lib/rep-access-code";

function hideRepCredentials<T extends { accessCode?: string; accessCodeHash?: string }>(rep: T) {
  const { accessCode, accessCodeHash, ...publicRep } = rep;
  return { ...publicRep, hasAccessCode: Boolean(accessCodeHash || accessCode) };
}

export async function GET(request: NextRequest) {
  if (!await hasAdminAccess(request)) return NextResponse.json({ message: "Admin access required." }, { status: 401 });
  const content = await getSiteContent();
  return NextResponse.json({ ...content, reps: content.reps.map(hideRepCredentials) });
}

export async function POST(request: NextRequest) {
  if (!await hasAdminAccess(request)) return NextResponse.json({ message: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (Array.isArray(body.reps) && body.reps.some((rep: { accessCode?: string }) => rep.accessCode && String(rep.accessCode).length < 8)) {
    return NextResponse.json({ message: "Rep access codes must be at least 8 characters." }, { status: 400 });
  }
  if (Array.isArray(body.reps)) {
    const current = await getSiteContent();
    body.reps = await Promise.all(body.reps.map(async (rep: { repId: string; accessCode?: string; isActive: boolean; [key: string]: unknown }) => {
      const previous = current.reps.find((item) => item.repId === rep.repId);
      const accessCodeHash = rep.accessCode
        ? await hashRepAccessCode(rep.accessCode)
        : previous?.accessCodeHash || (previous?.accessCode ? await hashRepAccessCode(previous.accessCode) : "");
      const safeRep = { ...rep } as Record<string, unknown>;
      delete safeRep.accessCode;
      delete safeRep.accessCodeHash;
      delete safeRep.hasAccessCode;
      return { ...safeRep, accessCodeHash };
    }));
  }

  const content = await saveSiteContent(body);
  return NextResponse.json({ ok: true, content: { ...content, reps: content.reps.map(hideRepCredentials) } });
}
