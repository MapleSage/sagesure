import { NextRequest, NextResponse } from "next/server";
import { getFacebookAuthUrl, getDefaultRedirectUri } from "@/lib/platforms/facebook";
import type { Brand } from "@/lib/brand-detection";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brand = (searchParams.get("brand") as Brand) || "sagesure";

  const redirectUri = getDefaultRedirectUri();
  const authUrl = await getFacebookAuthUrl(redirectUri);

  // Add brand to state parameter
  const urlWithState = new URL(authUrl);
  urlWithState.searchParams.set("state", brand);

  return NextResponse.redirect(urlWithState.toString());
}
