import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getHubSpotBlogPosts } from "@/lib/hubspot";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const hubspotBlogs = await getHubSpotBlogPosts(20);

    // Transform HubSpot blogs to our format
    const blogs = hubspotBlogs.map((blog: any) => ({
      id: blog.id,
      title: blog.name,
      content: blog.postBody || "",
      excerpt: blog.metaDescription || "",
      status: blog.state?.toLowerCase() || "published",
      tags: [],
      createdAt: blog.publishDate || blog.created,
      updatedAt: blog.updated,
      hubspotUrl: blog.url,
      source: "hubspot",
    }));

    return NextResponse.json({ blogs });
  } catch (error: any) {
    console.error("HubSpot sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync with HubSpot" },
      { status: 500 }
    );
  }
}
