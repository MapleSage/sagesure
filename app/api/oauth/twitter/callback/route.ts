import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeTwitterCode } from "@/lib/platforms/twitter";
import { saveToken } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const codeVerifier = cookieStore.get("twitter_verifier")?.value;

    if (!userId || !codeVerifier) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(
        new URL("/dashboard?error=twitter_auth_failed", req.url)
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/twitter/callback`;
    const tokenData = await exchangeTwitterCode(
      code,
      redirectUri,
      codeVerifier
    );

    await saveToken(userId, "twitter", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 7200) * 1000,
    });

    // Clear the verifier cookie
    cookieStore.delete("twitter_verifier");

    return NextResponse.redirect(
      new URL("/dashboard?connected=twitter", req.url)
    );
  } catch (error) {
    console.error("Twitter OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=twitter_auth_failed", req.url)
    );
  }
}
