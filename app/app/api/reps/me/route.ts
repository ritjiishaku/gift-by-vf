import { NextResponse } from "next/server";
import { currentRepId } from "../../../../lib/access";
import { getSiteContent } from "../../../../lib/content-store";

export async function GET() {
  const repId = await currentRepId();
  if (!repId) return NextResponse.json({ message: "Rep sign-in required." }, { status: 401 });

  const content = await getSiteContent();
  const rep = content.reps.find((item) => item.isActive && item.repId.toLowerCase() === repId.toLowerCase());
  if (!rep) return NextResponse.json({ message: "This rep account is inactive." }, { status: 403 });

  return NextResponse.json({
    rep: { repId: rep.repId, name: rep.name, commissionRate: rep.commissionRate },
    products: content.products.filter((item) => item.isVisible !== false),
    payouts: content.payouts.filter((item) => item.repId.toLowerCase() === rep.repId.toLowerCase()),
  });
}