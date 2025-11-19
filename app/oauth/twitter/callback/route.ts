import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeTwitterCode } from "@/lib/platforms/twitter";
import { saveToken } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const codeVerifier = cookieStore.get("twitter_verifier")?.value;

    console.log("[Twitter Callback] userId:", userId);
    console.log(
      "[Twitter Callback] codeVerifier:",
      codeVerifier ? "present" : "missing"
    );

    if (!userId || !codeVerifier) {
      console.log(
        "[Twitter Callback] Missing userId or verifier, redirecting to home"
      );
      return NextResponse.redirect(
        new URL("/", process.env.NEXTAUTH_URL || req.url)
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[Twitter Callback] code:", code ? "present" : "missing");
    console.log("[Twitter Callback] error:", error);
    console.log("[Twitter Callback] error_description:", errorDescription);

    if (error || !code) {
      console.log(
        "[Twitter Callback] OAuth failed:",
        error || "no code provided"
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=twitter_auth_failed&details=${encodeURIComponent(
            errorDescription || error || "no_code"
          )}`,
          process.env.NEXTAUTH_URL || req.url
        )
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/oauth/twitter/callback`;
    console.log(
      "[Twitter Callback] Exchanging code with redirectUri:",
      redirectUri
    );

    const tokenData = await exchangeTwitterCode(
      code,
      redirectUri,
      codeVerifier
    );
    console.log("[Twitter Callback] Token received, saving...");

    await saveToken(userId, "twitter", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 7200) * 1000,
    });

    // Clear the verifier cookie
    cookieStore.delete("twitter_verifier");

    console.log("[Twitter Callback] Success! Redirecting to dashboard");
    return NextResponse.redirect(
      new URL(
        "/dashboard?connected=twitter",
        process.env.NEXTAUTH_URL || req.url
      )
    );
  } catch (error: any) {
    console.error("[Twitter OAuth error]", error);
    console.error("[Twitter OAuth error details]", error.response?.data);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=twitter_auth_failed&details=${encodeURIComponent(
          error.message || "unknown"
        )}`,
        process.env.NEXTAUTH_URL || req.url
      )
    );
  }
}
