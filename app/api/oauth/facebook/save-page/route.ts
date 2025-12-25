import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { saveToken } from "@/lib/azure-storage";

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
    } = await req.json();

    console.log("[Facebook Save Page] userId:", userId);
    console.log("[Facebook Save Page] pageId:", pageId);
    console.log("[Facebook Save Page] pageName:", pageName);
    console.log("[Facebook Save Page] hasInstagram:", !!instagramAccountId);

    // Save Facebook token with page info
    await saveToken(userId, "facebook", {
      accessToken: pageAccessToken, // Use page access token, not user token
      expiresAt: Date.now() + (expiresIn || 5184000) * 1000,
      pageId: pageId,
      pageName: pageName,
    });

    // Save Instagram token if Instagram account exists
    if (instagramAccountId) {
      await saveToken(userId, "instagram", {
        accessToken: pageAccessToken, // Same token as Facebook
        expiresAt: Date.now() + (expiresIn || 5184000) * 1000,
        pageId: pageId,
        pageName: pageName,
        instagramAccountId: instagramAccountId,
      });
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
