import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/azure-storage";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const platforms = ["linkedin", "facebook", "twitter", "instagram"];
    const tokens: any = {};

    for (const platform of platforms) {
      const tokenData = await getToken(userId, platform);
      if (tokenData) {
        tokens[platform] = {
          hasToken: !!tokenData.accessToken,
          tokenPreview: tokenData.accessToken ? tokenData.accessToken.substring(0, 20) + "..." : null,
          organizationId: tokenData.organizationId || null,
          pageId: tokenData.pageId || null,
          instagramAccountId: tokenData.instagramAccountId || null,
          expiresAt: tokenData.expiresAt,
        };
      } else {
        tokens[platform] = { connected: false };
      }
    }

    return NextResponse.json({ userId, tokens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
