import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "../../../../lib/access";

export async function POST(request: NextRequest) {
  const isAdmin = await hasAdminAccess(request);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, message: "Unauthorized staff access." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, message: "No image file provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, message: "Only image files (JPG, PNG, WebP) are allowed." }, { status: 400 });
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "Image size must be under 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ ok: true, url: dataUrl });
  } catch {
    return NextResponse.json({ ok: false, message: "Image processing failed." }, { status: 500 });
  }
}
