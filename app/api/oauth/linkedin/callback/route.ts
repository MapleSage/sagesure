import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeLinkedInCode } from "@/lib/platforms/linkedin";
import { saveToken } from "@/lib/dynamodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(
        new URL("/dashboard?error=linkedin_auth_failed", req.url)
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/linkedin/callback`;
    const tokenData = await exchangeLinkedInCode(code, redirectUri);

    await saveToken(session.userId, "linkedin", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });

    return NextResponse.redirect(
      new URL("/dashboard?connected=linkedin", req.url)
    );
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=linkedin_auth_failed", req.url)
    );
  }
}
