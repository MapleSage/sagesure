import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getHubSpotBlogPosts } from "@/lib/hubspot";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    console.log("[HubSpot Sync] Starting sync...");
    console.log("[HubSpot Sync] API Key configured:", !!process.env.HUBSPOT_API_KEY);
    console.log("[HubSpot Sync] API Key length:", process.env.HUBSPOT_API_KEY?.length);
    console.log("[HubSpot Sync] API Key first 10 chars:", process.env.HUBSPOT_API_KEY?.substring(0, 10));

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

    console.log("[HubSpot Sync] Successfully fetched", blogs.length, "blogs");
    return NextResponse.json({ blogs });
  } catch (error: any) {
    console.error("[HubSpot Sync] Error:", error);
    console.error("[HubSpot Sync] Error message:", error.message);
    console.error("[HubSpot Sync] Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "Failed to sync with HubSpot",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
