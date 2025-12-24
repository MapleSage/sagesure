import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserBlogs } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const blogs = await getUserBlogs(userId);

    return NextResponse.json({ blogs });
  } catch (error: any) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
