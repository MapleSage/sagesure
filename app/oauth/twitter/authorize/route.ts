import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getTwitterAuthUrl,
  generatePKCEChallenge,
} from "@/lib/platforms/twitter";

export async function GET(req: NextRequest) {
  const { verifier, challenge } = generatePKCEChallenge();

  // Store verifier in cookie for callback
  const cookieStore = await cookies();
  cookieStore.set("twitter_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  const redirectUri = `${process.env.NEXTAUTH_URL}/oauth/twitter/callback`;
  const authUrl = await getTwitterAuthUrl(redirectUri, challenge);
  return NextResponse.redirect(authUrl);
}
