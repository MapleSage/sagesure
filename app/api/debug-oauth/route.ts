import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserOAuthCredentials, getUserTokens } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[Debug OAuth] userId:", userId);

    // Get all saved OAuth credentials
    const credentials = await getUserOAuthCredentials(userId);

    // Get all connected tokens
    const tokens = await getUserTokens(userId);

    // Mask secrets for security
    const maskedCredentials = credentials.map((cred) => ({
      platformBrandKey: cred.platformBrandKey,
      clientId: cred.clientId,
      clientSecret: cred.clientSecret ? `${cred.clientSecret.substring(0, 4)}...` : "not set",
      redirectUri: cred.redirectUri,
    }));

    const tokenInfo = tokens.map((t) => ({
      platform: t.platform,
      brand: t.brand,
      hasAccessToken: !!t.accessToken,
      organizationId: t.organizationId,
      organizationName: t.organizationName,
      expiresAt: t.expiresAt,
      expired: t.expiresAt ? t.expiresAt < Date.now() : false,
    }));

    return NextResponse.json({
      success: true,
      userId,
      savedCredentials: maskedCredentials,
      connectedTokens: tokenInfo,
      debug: {
        credentialsCount: credentials.length,
        tokensCount: tokens.length,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("[Debug OAuth] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
