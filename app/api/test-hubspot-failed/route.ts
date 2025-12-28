import { NextRequest, NextResponse } from "next/server";
import { getFailedHubSpotSocialPosts } from "@/lib/hubspot-social";

/**
 * Test endpoint to manually check what failed posts HubSpot returns
 * Access: https://social.sagesure.io/api/test-hubspot-failed
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[Test HubSpot Failed] Starting test...");

    const failedPosts = await getFailedHubSpotSocialPosts();

    console.log(`[Test HubSpot Failed] Got ${failedPosts.length} failed posts`);

    return NextResponse.json({
      success: true,
      count: failedPosts.length,
      posts: failedPosts,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Test HubSpot Failed] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
