import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getFailedHubSpotSocialPosts } from "@/lib/hubspot-social";
import { savePost } from "@/lib/azure-storage";

/**
 * Retry Failed Social Posts Cron Job
 *
 * This endpoint:
 * 1. Fetches blog posts from HubSpot that have failed social media publishing
 * 2. Creates scheduled posts in our system to retry publishing
 * 3. Runs daily to ensure all posts eventually get published
 *
 * This addresses the original purpose: publishing posts that failed in HubSpot
 * due to quota limits or other errors.
 */

const DEFAULT_USER_ID = "info@sagesure.io";

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron job
    const authHeader = req.headers.get("authorization");
    const vercelCron = req.headers.get("x-vercel-cron");

    const isVercelCron = vercelCron !== null;
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !isAuthorized) {
      console.log("[Retry Failed] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Retry Failed] Starting check for failed HubSpot social posts");
    const startTime = new Date().toISOString();

    // Fetch failed/unsuccessful social posts from HubSpot
    const failedPosts = await getFailedHubSpotSocialPosts();

    console.log(`[Retry Failed] Found ${failedPosts.length} posts with failed social publishing`);

    const results = {
      postsFound: failedPosts.length,
      postsScheduled: 0,
      errors: [] as any[],
    };

    // Schedule each failed post for retry
    for (const post of failedPosts) {
      try {
        console.log(`[Retry Failed] Scheduling retry for: ${post.blogTitle}`);

        // Determine which platforms failed
        const failedPlatforms = post.failedPlatforms || ["linkedin", "facebook", "twitter"];

        // Schedule for immediate publishing (next cron run)
        const scheduleTime = new Date();
        scheduleTime.setMinutes(scheduleTime.getMinutes() + 5);

        // Create social post from blog content
        const postContent = post.socialContent || `${post.blogTitle}\n\n${post.blogUrl}`;

        await savePost({
          userId: DEFAULT_USER_ID,
          content: postContent,
          platforms: failedPlatforms,
          scheduledFor: scheduleTime.toISOString(),
          status: "scheduled",
          imageUrl: post.featuredImage,
        });

        results.postsScheduled++;
        console.log(`[Retry Failed] Scheduled post ${post.blogId} for ${scheduleTime.toISOString()}`);

      } catch (error: any) {
        console.error(`[Retry Failed] Error scheduling post ${post.blogId}:`, error);
        results.errors.push({
          blogId: post.blogId,
          error: error.message,
        });
      }
    }

    console.log(
      `[Retry Failed] Complete - Found: ${results.postsFound}, ` +
      `Scheduled: ${results.postsScheduled}, ` +
      `Errors: ${results.errors.length}`
    );

    return NextResponse.json({
      success: true,
      executedAt: startTime,
      postsFound: results.postsFound,
      postsScheduled: results.postsScheduled,
      errors: results.errors,
      message: `Scheduled ${results.postsScheduled} failed posts for retry`,
    });

  } catch (error: any) {
    console.error("[Retry Failed] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retry unsuccessful posts",
      },
      { status: 500 }
    );
  }
}
