import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "cookie";
import { verifyToken } from "./lib/db";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up", "/api/auth/login", "/api/auth/signup"];
const API_ROUTES = ["/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = parse(request.headers.get("cookie") || "")["auth_token"];

  // Check if route requires authentication
  const isProtectedRoute = 
    API_ROUTES.some(route => pathname.startsWith(route)) && 
    !pathname.startsWith("/api/auth");

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // Return 401 for API requests without auth
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Validate token if present
  if (token && !verifyToken(token)) {
    const response = NextResponse.next();
    response.headers.set(
      "Set-Cookie",
      `auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure=${process.env.NODE_ENV === "production"}`
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};
