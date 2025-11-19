import { NextRequest, NextResponse } from "next/server";
import { getLinkedInAuthUrl } from "@/lib/platforms/linkedin";

export async function GET(req: NextRequest) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/oauth/linkedin/callback`;
  const authUrl = await getLinkedInAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
