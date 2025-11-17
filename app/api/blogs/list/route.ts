import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBlogs } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
