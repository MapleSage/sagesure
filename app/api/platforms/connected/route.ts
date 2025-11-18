import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserTokens } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await getUserTokens(userId);
    const platforms = tokens.map((t) => t.platform);

    return NextResponse.json({ platforms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
