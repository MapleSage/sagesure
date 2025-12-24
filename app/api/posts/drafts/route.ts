import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserPosts } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const allPosts = await getUserPosts(userId);
    const drafts = allPosts.filter((post: any) => post.status === "draft");

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error("Get drafts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
