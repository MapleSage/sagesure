import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { saveToken } from "@/lib/azure-storage";
import { getPlatformKey, type Brand } from "@/lib/brand-detection";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const {
      accessToken,
      expiresIn,
      pageId,
      pageName,
      pageAccessToken,
      instagramAccountId,
      brand,
    } = await req.json();

    const brandValue = (brand as Brand) || "sagesure";

    console.log("[Facebook Save Page] userId:", userId);
    console.log("[Facebook Save Page] brand:", brandValue);
    console.log("[Facebook Save Page] pageId:", pageId);
    console.log("[Facebook Save Page] pageName:", pageName);
    console.log("[Facebook Save Page] hasInstagram:", !!instagramAccountId);

    // Save Facebook token with page info and brand
    const facebookPlatformKey = getPlatformKey("facebook", brandValue);
    await saveToken(userId, facebookPlatformKey, {
      accessToken: pageAccessToken, // Use page access token, not user token
      expiresAt: Date.now() + (expiresIn || 5184000) * 1000,
      pageId: pageId,
      pageName: pageName,
      brand: brandValue,
    });

    console.log("[Facebook Save Page] Saved Facebook token as:", facebookPlatformKey);

    // Save Instagram token if Instagram account exists
    if (instagramAccountId) {
      const instagramPlatformKey = getPlatformKey("instagram", brandValue);
      await saveToken(userId, instagramPlatformKey, {
        accessToken: pageAccessToken, // Same token as Facebook
        expiresAt: Date.now() + (expiresIn || 5184000) * 1000,
        pageId: pageId,
        pageName: pageName,
        instagramAccountId: instagramAccountId,
        brand: brandValue,
      });
      console.log("[Facebook Save Page] Saved Instagram token as:", instagramPlatformKey);
    }

    console.log("[Facebook Save Page] Success!");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Facebook Save Page Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save page selection",
      },
      { status: 500 }
    );
  }
}
