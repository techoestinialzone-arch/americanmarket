import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 1. Check for session cookie
  const sessionCookie = req.cookies.get("session_id");
  
  const isAuthRoute = req.nextUrl.pathname.startsWith("/dashboard");
  const isLoginRoute = req.nextUrl.pathname.startsWith("/login");

  // 2. Protect Dashboard
  if (isAuthRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Redirect logged-in users away from login page
  if (isLoginRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};