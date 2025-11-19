import { NextRequest, NextResponse } from "next/server";
import { getFacebookAuthUrl } from "@/lib/platforms/facebook";

export async function GET(req: NextRequest) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`;
  const authUrl = await getFacebookAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
