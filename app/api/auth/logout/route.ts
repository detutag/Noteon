import { NextResponse } from "next/server";
import { serialize } from "cookie";

const AUTH_COOKIE_NAME = "auth_token";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.headers.set(
    "Set-Cookie",
    serialize(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  );

  return response;
}
