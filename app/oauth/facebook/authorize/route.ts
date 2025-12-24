import { NextRequest, NextResponse } from "next/server";
import { getFacebookAuthUrl, getDefaultRedirectUri } from "@/lib/platforms/facebook";

export async function GET(req: NextRequest) {
  const redirectUri = getDefaultRedirectUri();
  const authUrl = await getFacebookAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
