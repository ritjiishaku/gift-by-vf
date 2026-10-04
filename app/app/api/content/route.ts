import { NextResponse } from "next/server";
import { getSiteContent } from "../../../lib/content-store";

export async function GET() {
  const content = await getSiteContent();
  const visibleInOrder = <T extends { isVisible?: boolean; displayOrder?: number }>(items: T[]) => items
    .filter((item) => item.isVisible !== false)
    .sort((left, right) => (left.displayOrder ?? 999) - (right.displayOrder ?? 999));

  return NextResponse.json({
    products: visibleInOrder(content.products),
    galleryItems: visibleInOrder(content.galleryItems),
    testimonials: visibleInOrder(content.testimonials),
    reasons: visibleInOrder(content.reasons),
    steps: visibleInOrder(content.steps),
    settings: content.settings,
  });
}