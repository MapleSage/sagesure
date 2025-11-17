import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserPosts } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await getUserPosts(userId);

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
