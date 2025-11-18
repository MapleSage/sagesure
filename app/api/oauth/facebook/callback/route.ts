import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeFacebookCode } from "@/lib/platforms/facebook";
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
        new URL("/dashboard?error=facebook_auth_failed", req.url)
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`;
    const tokenData = await exchangeFacebookCode(code, redirectUri);

    // Save token for both Facebook and Instagram (same token)
    await saveToken(userId, "facebook", {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    });

    await saveToken(userId, "instagram", {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    });

    return NextResponse.redirect(
      new URL("/dashboard?connected=facebook,instagram", req.url)
    );
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=facebook_auth_failed", req.url)
    );
  }
}
