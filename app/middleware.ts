import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "./lib/admin-session";

const ADMIN_COOKIE = "giftbyvf-admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/admin/login";
  const hasAdminAccess = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);

  if (isAdminRoute && !isLoginRoute && !hasAdminAccess) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && hasAdminAccess) {
    const dashboardUrl = new URL("/admin", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
