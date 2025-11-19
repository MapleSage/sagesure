import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeLinkedInCode } from "@/lib/platforms/linkedin";
import { saveToken } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

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

    const redirectUri = `${process.env.NEXTAUTH_URL}/oauth/linkedin/callback`;
    console.log(
      "[LinkedIn Callback] Exchanging code with redirectUri:",
      redirectUri
    );

    const tokenData = await exchangeLinkedInCode(code, redirectUri);
    console.log("[LinkedIn Callback] Token received, saving...");

    await saveToken(userId, "linkedin", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });

    console.log("[LinkedIn Callback] Success! Redirecting to dashboard");
    return NextResponse.redirect(
      new URL(
        "/dashboard?connected=linkedin",
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
