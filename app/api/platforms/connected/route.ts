import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserTokens } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[Connected Platforms] userId:", userId);

    const tokens = await getUserTokens(userId);
    const platforms = tokens.map((t) => t.platform);

    console.log("[Connected Platforms] Found platforms:", platforms);

    return NextResponse.json({ platforms });
  } catch (error: any) {
    console.error("[Connected Platforms] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
