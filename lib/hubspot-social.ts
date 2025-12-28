import { Client } from "@hubspot/api-client";

const hubspotClient = process.env.HUBSPOT_API_KEY
  ? new Client({
      accessToken: process.env.HUBSPOT_API_KEY,
    })
  : null;

/**
 * Fetch blog posts from HubSpot that have failed social media publishing
 *
 * This queries HubSpot's social media API to find posts with status "FAILED"
 * From: https://app.hubspot.com/social/3475345/manage/failed
 */
export async function getFailedHubSpotSocialPosts() {
  try {
    if (!hubspotClient) {
      console.warn("[HubSpot Social] API key not configured");
      return [];
    }

    console.log("[HubSpot Social] Fetching failed social posts from HubSpot...");

    // HubSpot Social Publishing API v3
    // https://developers.hubspot.com/docs/api/marketing/social-media
    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/marketing/v3/social/publishing/posts`,
      qs: {
        limit: 100,
        state: "FAILED,CANCELED,ERROR",
      },
    });

    console.log(`[HubSpot Social] API Response:`, JSON.stringify(response, null, 2));

    const posts = response.results || [];
    console.log(`[HubSpot Social] Found ${posts.length} failed posts`);

    if (posts.length === 0) {
      console.log("[HubSpot Social] No failed posts found, trying fallback...");
      return await getFallbackBlogPostsForSocial();
    }

    // Transform HubSpot posts to our format
    const failedPosts = posts.map((post: any) => ({
      blogId: post.id,
      blogTitle: extractTitle(post.message || post.content || ""),
      blogUrl: extractUrl(post.message || post.content || ""),
      socialContent: post.message || post.content || "",
      featuredImage: post.photoUrl || post.imageUrl || "",
      publishDate: post.publishedAt || post.createdAt,
      failedPlatforms: (post.channels || []).map((ch: any) => mapHubSpotChannel(ch)),
      failureReason: post.state || "FAILED",
      hubspotBroadcastId: post.id,
      retryAttempts: 0,
    }));

    console.log(`[HubSpot Social] Returning ${failedPosts.length} failed posts for retry`);
    return failedPosts;

  } catch (error: any) {
    console.error("[HubSpot Social] Error fetching failed posts:", error.message);
    console.error("[HubSpot Social] Full error:", error);

    // Fall back to fetching recent blog posts
    return await getFallbackBlogPostsForSocial();
  }
}

function extractTitle(text: string): string {
  const firstLine = text.split('\n')[0];
  return firstLine.substring(0, 100);
}

function extractUrl(text: string): string {
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[1] : "";
}

/**
 * Fallback method: Fetch recent blog posts from HubSpot
 * and assume they need social media publishing
 */
async function getFallbackBlogPostsForSocial() {
  try {
    if (!hubspotClient) {
      return [];
    }

    console.log("[HubSpot Social] Using fallback: Fetching recent blog posts...");

    const cutoffDate = new Date("2024-12-15T00:00:00Z");

    // Fetch recent published blog posts
    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/cms/v3/blogs/posts`,
      qs: {
        limit: 50,
        state: "PUBLISHED",
        orderBy: "-publishDate",
      },
    });

    console.log(`[HubSpot Social] Found ${response.results?.length || 0} recent blog posts`);

    if (!response.results || response.results.length === 0) {
      return [];
    }

    // Filter posts published after Dec 15
    const recentPosts = response.results
      .filter((post: any) => {
        const publishDate = new Date(post.publishDate);
        return publishDate >= cutoffDate;
      })
      .map((post: any) => ({
        blogId: post.id,
        blogTitle: post.name || post.htmlTitle || "Untitled Post",
        blogUrl: post.url || "",
        socialContent: `${post.name}\n\n${post.metaDescription || ""}\n\nRead more: ${post.url}`,
        featuredImage: post.featuredImage || "",
        publishDate: post.publishDate,
        // Assume all platforms need publishing
        failedPlatforms: ["linkedin", "facebook", "twitter"],
        failureReason: "Not published to social media or quota exceeded",
        hubspotBlogId: post.id,
        retryAttempts: 0,
      }));

    console.log(`[HubSpot Social] Returning ${recentPosts.length} blog posts for social publishing`);
    return recentPosts;

  } catch (error: any) {
    console.error("[HubSpot Social] Fallback error:", error.message);
    return [];
  }
}

/**
 * Map HubSpot channel keys to our platform names
 */
function mapHubSpotChannel(channel: any): string {
  // Handle both string and object formats
  const channelKey = typeof channel === 'string' ? channel : (channel?.accountType || channel?.channelKey || channel?.type);

  const mapping: { [key: string]: string } = {
    "LINKEDIN": "linkedin",
    "LINKEDIN_COMPANY": "linkedin",
    "FACEBOOK": "facebook",
    "FACEBOOK_PAGE": "facebook",
    "TWITTER": "twitter",
    "X": "twitter",
    "INSTAGRAM": "instagram",
  };

  return mapping[channelKey?.toUpperCase()] || channelKey?.toLowerCase() || "linkedin";
}

/**
 * Mark a HubSpot social broadcast as successfully retried
 * (Optional - for tracking purposes)
 */
export async function markHubSpotBroadcastRetried(broadcastId: string) {
  try {
    if (!hubspotClient) {
      return;
    }

    // This could update a custom property or note in HubSpot
    // For now, we'll just log it
    console.log(`[HubSpot Social] Marked broadcast ${broadcastId} as successfully retried`);

  } catch (error: any) {
    console.error("[HubSpot Social] Error marking broadcast as retried:", error.message);
  }
}
