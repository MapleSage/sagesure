import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { exchangeLinkedInCode } from "@/lib/platforms/linkedin";
import { saveToken } from "@/lib/azure-storage";
import { getPlatformKey, getBrandConfig, type Brand } from "@/lib/brand-detection";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[LinkedIn Callback] userId:", userId);

    if (!userId) {
      console.log("[LinkedIn Callback] No userId found, redirecting to home");
      return NextResponse.redirect(
        new URL("/", process.env.NEXTAUTH_URL || req.url)
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const state = searchParams.get("state");
    const brand = (state as Brand) || "sagesure";

    console.log("[LinkedIn Callback] code:", code ? "present" : "missing");
    console.log("[LinkedIn Callback] error:", error);
    console.log("[LinkedIn Callback] error_description:", errorDescription);

    if (error || !code) {
      console.log(
        "[LinkedIn Callback] OAuth failed:",
        error || "no code provided"
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=linkedin_auth_failed&details=${encodeURIComponent(
            errorDescription || error || "no_code"
          )}`,
          process.env.NEXTAUTH_URL || req.url
        )
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/linkedin/callback`;
    console.log(
      "[LinkedIn Callback] Exchanging code with redirectUri:",
      redirectUri
    );

    const tokenData = await exchangeLinkedInCode(code, redirectUri);
    console.log("[LinkedIn Callback] Token received, saving...");

    // Get brand-specific configuration
    const brandConfig = getBrandConfig(brand);
    const platformKey = getPlatformKey("linkedin", brand);

    console.log("[LinkedIn Callback] Brand:", brand);
    console.log("[LinkedIn Callback] Platform Key:", platformKey);
    console.log("[LinkedIn Callback] Organization ID:", brandConfig.linkedInOrgId);

    await saveToken(userId, platformKey, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      organizationId: brandConfig.linkedInOrgId,
      organizationName: brandConfig.name,
      brand: brand,
    });

    console.log("[LinkedIn Callback] Success! Redirecting to dashboard");
    return NextResponse.redirect(
      new URL(
        `/dashboard?connected=linkedin&brand=${brand}`,
        process.env.NEXTAUTH_URL || req.url
      )
    );
  } catch (error: any) {
    console.error("[LinkedIn OAuth error]", error);
    console.error("[LinkedIn OAuth error details]", error.response?.data);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=linkedin_auth_failed&details=${encodeURIComponent(
          error.message || "unknown"
        )}`,
        process.env.NEXTAUTH_URL || req.url
      )
    );
  }
}
