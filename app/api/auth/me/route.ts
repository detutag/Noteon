import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/db";
import { parse } from "cookie";

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const cookies = parse(cookie);
    const token = cookies["auth_token"];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { getUserById } = await import("../../../../lib/db");
    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
