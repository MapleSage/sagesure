import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserTokens } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    console.log("[Connected Platforms] userId:", userId);

    if (!userId) {
      console.log("[Connected Platforms] No userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await getUserTokens(userId);
    const platforms = tokens.map((t) => t.platform);

    console.log("[Connected Platforms] Found platforms:", platforms);

    return NextResponse.json({ platforms });
  } catch (error: any) {
    console.error("[Connected Platforms] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
