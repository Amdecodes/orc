import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow the sign-in page publicly
  if (pathname === "/sign-in") {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
