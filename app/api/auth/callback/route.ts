import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getUserFromToken } from "@/lib/cognito";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // Get the origin from the request
    const origin =
      req.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "https://social.sagesure.io";
    const redirectUri = `${origin}/auth/callback`;

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const user = getUserFromToken(tokens.id_token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Set cookies
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: tokens.expires_in,
      path: "/", // Ensure cookie is available for all paths including OAuth callbacks
    };

    cookieStore.set("accessToken", tokens.access_token, cookieOptions);
    cookieStore.set("idToken", tokens.id_token, cookieOptions);
    cookieStore.set("userId", user.id, cookieOptions);

    console.log("[Auth Callback] Cookies set for user:", user.id);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Auth callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
