import { NextRequest, NextResponse } from "next/server";
import { getHubSpotBlogs } from "@/lib/hubspot";

export async function GET(req: NextRequest) {
  try {
    console.log("[Blog Discovery] Fetching all available HubSpot blogs...");

    const blogs = await getHubSpotBlogs();

    console.log("[Blog Discovery] Found blogs:", blogs.length);
    blogs.forEach((blog: any) => {
      console.log(`[Blog Discovery] - ${blog.name} (ID: ${blog.id})`);
      console.log(`[Blog Discovery]   URL: ${blog.absoluteUrl || blog.domain}`);
    });

    return NextResponse.json({
      success: true,
      count: blogs.length,
      blogs: blogs.map((blog: any) => ({
        id: blog.id,
        name: blog.name,
        url: blog.absoluteUrl || blog.domain,
        language: blog.language,
        created: blog.created,
      })),
    });
  } catch (error: any) {
    console.error("[Blog Discovery] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to discover blogs",
      },
      { status: 500 }
    );
  }
}
