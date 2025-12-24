import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { exchangeFacebookCode } from "@/lib/platforms/facebook";
import { saveToken } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[Facebook Callback] userId:", userId);

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[Facebook Callback] code:", code ? "present" : "missing");
    console.log("[Facebook Callback] error:", error);
    console.log("[Facebook Callback] error_description:", errorDescription);

    if (error || !code) {
      console.log(
        "[Facebook Callback] OAuth failed:",
        error || "no code provided"
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=facebook_auth_failed&details=${encodeURIComponent(
            errorDescription || error || "no_code"
          )}`,
          process.env.NEXTAUTH_URL || req.url
        )
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/oauth/facebook/callback`;
    console.log(
      "[Facebook Callback] Exchanging code with redirectUri:",
      redirectUri
    );

    const tokenData = await exchangeFacebookCode(code, redirectUri);
    console.log("[Facebook Callback] Token received, saving...");

    // Save token for both Facebook and Instagram (same token)
    await saveToken(userId, "facebook", {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    });

    await saveToken(userId, "instagram", {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    });

    console.log("[Facebook Callback] Success! Redirecting to dashboard");
    return NextResponse.redirect(
      new URL(
        "/dashboard?connected=facebook,instagram",
        process.env.NEXTAUTH_URL || req.url
      )
    );
  } catch (error: any) {
    console.error("[Facebook OAuth error]", error);
    console.error("[Facebook OAuth error details]", error.response?.data);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=facebook_auth_failed&details=${encodeURIComponent(
          error.message || "unknown"
        )}`,
        process.env.NEXTAUTH_URL || req.url
      )
    );
  }
}
