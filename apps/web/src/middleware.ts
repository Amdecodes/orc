import { NextRequest, NextResponse } from "next/server";

/**
 * Web app middleware — Better Auth ONLY.
 * No Clerk imports. No admin routes. No /sign-in.
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get("better-auth.session_token") ||
    req.cookies.get("__Secure-better-auth.session_token");

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isPublicRoute =
    pathname === "/" ||
    isAuthRoute ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/bot") ||
    pathname.startsWith("/api/topup") ||
    pathname.startsWith("/api/jobs/download");

  // Redirect already-logged-in users away from auth pages
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Block unauthorized access to protected routes
  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)",
  ],
};
