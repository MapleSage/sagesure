import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeLinkedInCode } from "@/lib/platforms/linkedin";
import { saveToken } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
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

    await saveToken(userId, "linkedin", {
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
