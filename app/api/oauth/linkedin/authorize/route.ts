import { NextRequest, NextResponse } from "next/server";
import { getLinkedInAuthUrl } from "@/lib/platforms/linkedin";
import type { Brand } from "@/lib/brand-detection";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = (searchParams.get("brand") as Brand) || "sagesure";

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/linkedin/callback`;
  const authUrl = await getLinkedInAuthUrl(redirectUri);

  // Add brand to state parameter
  const urlWithState = new URL(authUrl);
  urlWithState.searchParams.set("state", brand);

  return NextResponse.redirect(urlWithState.toString());
}
