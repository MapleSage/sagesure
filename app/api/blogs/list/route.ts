import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserBlogs } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(req.url);
    const blogFilter = searchParams.get("blog"); // 'sagesure', 'maplesage', or null for all

    console.log(`[Blogs API] Fetching user blogs, filter: ${blogFilter || 'all'}`);

    // Get user's saved blogs (including synced RSS posts)
    let allBlogs = await getUserBlogs(userId);

    // Filter by blog brand if specified
    if (blogFilter && blogFilter !== "all") {
      allBlogs = allBlogs.filter((blog: any) => blog.blogBrand === blogFilter);
      console.log(`[Blogs API] Filtered to ${allBlogs.length} blogs for brand: ${blogFilter}`);
    }

    console.log(`[Blogs API] Total blogs: ${allBlogs.length}`);

    return NextResponse.json({
      success: true,
      blogs: allBlogs
    });
  } catch (error: any) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch blogs"
      },
      { status: 500 }
    );
  }
}
