import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHubSpotBlogPosts } from "@/lib/hubspot";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
