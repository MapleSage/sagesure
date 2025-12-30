import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { deleteToken } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();
    const { platformKey } = await req.json();

    if (!platformKey) {
      return NextResponse.json(
        { success: false, error: "Platform key required" },
        { status: 400 }
      );
    }

    console.log("[Disconnect] userId:", userId);
    console.log("[Disconnect] platformKey:", platformKey);

    await deleteToken(userId, platformKey);

    console.log("[Disconnect] Successfully disconnected");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Disconnect] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
