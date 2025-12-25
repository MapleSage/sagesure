import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserBlogs } from "@/lib/azure-storage";
import { getHubSpotBlogPosts } from "@/lib/hubspot";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(req.url);
    const includeHubspot = searchParams.get("includeHubspot") !== "false";
    const blogFilter = searchParams.get("blog"); // 'sagesure', 'maplesage', or null for all

    // Get user's blogs
    const userBlogs = await getUserBlogs(userId);

    let allBlogs = userBlogs;

    // Optionally include HubSpot blogs
    if (includeHubspot) {
      try {
        // Get the contentGroupId based on filter
        let contentGroupId = undefined;
        if (blogFilter === "sagesure") {
          // Will be set once we know the actual blog IDs
          contentGroupId = process.env.HUBSPOT_SAGESURE_BLOG_ID;
        } else if (blogFilter === "maplesage") {
          contentGroupId = process.env.HUBSPOT_MAPLESAGE_BLOG_ID;
        }

        const hubspotBlogs = await getHubSpotBlogPosts(50, contentGroupId);
        const formattedHubspotBlogs = hubspotBlogs.map((blog: any) => ({
          id: `hubspot-${blog.id}`,
          title: blog.name,
          content: blog.postBody || "",
          excerpt: blog.metaDescription || "",
          status: blog.state?.toLowerCase() || "published",
          tags: [],
          createdAt: blog.publishDate || blog.created,
          updatedAt: blog.updated,
          hubspotUrl: blog.url,
          source: "hubspot",
          blogId: blog.blogId,
          blogName: blog.blogName,
        }));
        allBlogs = [...userBlogs, ...formattedHubspotBlogs];
      } catch (hubspotError) {
        console.error("Failed to fetch HubSpot blogs:", hubspotError);
        // Continue with just user blogs if HubSpot fails
      }
    }

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
