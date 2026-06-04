import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/register"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (pathname.startsWith("/dashboard") || pathname === "/") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
