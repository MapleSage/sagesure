import { NextRequest, NextResponse } from "next/server";
import { getLinkedInAuthUrl } from "@/lib/platforms/linkedin";
import { getUserId } from "@/lib/auth";
import { getOAuthCredentials } from "@/lib/azure-storage";
import { getPlatformKey, type Brand } from "@/lib/brand-detection";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = (searchParams.get("brand") as Brand) || "sagesure";
    const userId = getUserId();

    // Check for user-configured credentials
    const platformBrandKey = getPlatformKey("linkedin", brand);
    const credentials = await getOAuthCredentials(userId, platformBrandKey);

    console.log("[LinkedIn Authorize] brand:", brand);
    console.log("[LinkedIn Authorize] platformBrandKey:", platformBrandKey);
    console.log("[LinkedIn Authorize] custom credentials:", !!credentials);

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/linkedin/callback`;
    const authUrl = await getLinkedInAuthUrl(
      redirectUri,
      credentials?.clientId // Use custom client ID if available
    );

    // Add brand to state parameter
    const urlWithState = new URL(authUrl);
    urlWithState.searchParams.set("state", brand);

    return NextResponse.redirect(urlWithState.toString());
  } catch (error: any) {
    console.error("[LinkedIn Authorize] Error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=linkedin_auth_failed&details=${encodeURIComponent(error.message)}`, process.env.NEXTAUTH_URL!)
    );
  }
}
