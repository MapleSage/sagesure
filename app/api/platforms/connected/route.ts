import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserTokens } from "@/lib/azure-storage";
import { parsePlatformKey, type Brand } from "@/lib/brand-detection";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[Connected Platforms] userId:", userId);

    const tokens = await getUserTokens(userId);

    // Parse platform keys to extract brand information
    const platforms = tokens.map((t) => {
      const { platform, brand } = parsePlatformKey(t.platform);

      return {
        platform,
        brand: brand || "sagesure",
        platformKey: t.platform,
        connected: !!t.accessToken,
        accountName: t.organizationName || t.pageName || null,
        accountHandle: null, // Could be added to tokens table if needed
        organizationId: t.organizationId || null,
        pageId: t.pageId || null,
        expiresAt: t.expiresAt || null,
      };
    });

    console.log("[Connected Platforms] Found platforms:", platforms);

    return NextResponse.json({ success: true, platforms });
  } catch (error: any) {
    console.error("[Connected Platforms] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
