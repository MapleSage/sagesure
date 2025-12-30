import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  saveOAuthCredentials,
  getUserOAuthCredentials,
  deleteOAuthCredentials,
} from "@/lib/azure-storage";

// GET - Get all OAuth credentials for the user
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const credentials = await getUserOAuthCredentials(userId);

    // Mask the client secrets for security
    const maskedCredentials = credentials.map((cred) => ({
      ...cred,
      clientSecret: cred.clientSecret ? "••••••••" : "",
    }));

    return NextResponse.json({ success: true, credentials: maskedCredentials });
  } catch (error: any) {
    console.error("[OAuth Credentials GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Save OAuth credentials
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();
    const { platformBrandKey, clientId, clientSecret, redirectUri } = await req.json();

    if (!platformBrandKey || !clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Platform, Client ID, and Client Secret are required" },
        { status: 400 }
      );
    }

    console.log("[OAuth Credentials POST] userId:", userId);
    console.log("[OAuth Credentials POST] platformBrandKey:", platformBrandKey);

    await saveOAuthCredentials(userId, platformBrandKey, {
      clientId,
      clientSecret,
      redirectUri,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[OAuth Credentials POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete OAuth credentials
export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(req.url);
    const platformBrandKey = searchParams.get("platformBrandKey");

    if (!platformBrandKey) {
      return NextResponse.json(
        { success: false, error: "Platform brand key required" },
        { status: 400 }
      );
    }

    console.log("[OAuth Credentials DELETE] userId:", userId);
    console.log("[OAuth Credentials DELETE] platformBrandKey:", platformBrandKey);

    await deleteOAuthCredentials(userId, platformBrandKey);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[OAuth Credentials DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
