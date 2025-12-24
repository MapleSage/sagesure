import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publishBlogToHubSpot, saveDraftToHubSpot } from "@/lib/hubspot";
import { saveBlog } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();
    const userEmail = "demo@sagesure.io"; // Default user email

    const { title, content, excerpt, tags, status } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    // Publish to HubSpot
    let hubspotResult;
    if (status === "published") {
      hubspotResult = await publishBlogToHubSpot({
        title,
        content,
        excerpt,
        tags,
        authorName: userEmail,
      });
    } else {
      hubspotResult = await saveDraftToHubSpot({
        title,
        content,
        excerpt,
        tags,
      });
    }

    // Also save to Azure for our records
    const blog = await saveBlog({
      userId,
      title,
      content,
      excerpt,
      status,
      tags: tags || [],
    });

    return NextResponse.json({
      success: true,
      blog,
      hubspot: hubspotResult,
      message: `Blog ${
        status === "published" ? "published" : "saved as draft"
      } to HubSpot!`,
    });
  } catch (error: any) {
    console.error("HubSpot publish error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish to HubSpot" },
      { status: 500 }
    );
  }
}
