import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { exchangeFacebookCode, getDefaultRedirectUri } from "@/lib/platforms/facebook";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[Facebook Callback] userId:", userId);

    if (!userId) {
      console.log("[Facebook Callback] No userId found, redirecting to home");
      return NextResponse.redirect(
        new URL("/", process.env.NEXTAUTH_URL || req.url)
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const state = searchParams.get("state");
    const brand = state || "sagesure";

    console.log("[Facebook Callback] code:", code ? "present" : "missing");
    console.log("[Facebook Callback] error:", error);
    console.log("[Facebook Callback] error_description:", errorDescription);
    console.log("[Facebook Callback] brand:", brand);

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

    const redirectUri = getDefaultRedirectUri();
    console.log(
      "[Facebook Callback] Exchanging code with redirectUri:",
      redirectUri
    );

    const tokenData = await exchangeFacebookCode(code, redirectUri);
    console.log("[Facebook Callback] Token received, redirecting to page selection...");

    // Redirect to page selection with token and brand
    const selectPageUrl = new URL(
      "/oauth/facebook/select-page",
      process.env.NEXTAUTH_URL || req.url
    );
    selectPageUrl.searchParams.set("token", tokenData.access_token);
    selectPageUrl.searchParams.set("expires_in", String(tokenData.expires_in || 5184000));
    selectPageUrl.searchParams.set("brand", brand);

    console.log("[Facebook Callback] Redirecting to:", selectPageUrl.toString());
    return NextResponse.redirect(selectPageUrl);
  } catch (error: any) {
    console.error("[Facebook OAuth error]", error);
    const details = error.response?.data?.error?.message || error.message || "unknown";
    console.error("[Facebook OAuth error details]", error.response?.data);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=facebook_auth_failed&details=${encodeURIComponent(details)}`,
        process.env.NEXTAUTH_URL || req.url
      )
    );
  }
}
