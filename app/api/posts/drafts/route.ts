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

    const allPosts = await getUserPosts(userId);
    const drafts = allPosts.filter((post: any) => post.status === "draft");

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error("Get drafts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
