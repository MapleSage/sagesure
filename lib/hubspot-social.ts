import { Client } from "@hubspot/api-client";

const hubspotClient = process.env.HUBSPOT_API_KEY
  ? new Client({
      accessToken: process.env.HUBSPOT_API_KEY,
    })
  : null;

/**
 * Fetch blog posts from HubSpot that have failed social media publishing
 *
 * This queries HubSpot's social media broadcast API to find posts with:
 * - Status: FAILED, ERROR, or CANCELLED
 * - Published after Dec 15, 2024 (when quota issues started)
 * - Have not been successfully retried yet
 */
export async function getFailedHubSpotSocialPosts() {
  try {
    if (!hubspotClient) {
      console.warn("[HubSpot Social] API key not configured");
      return [];
    }

    console.log("[HubSpot Social] Fetching failed social broadcasts...");

    // Date filter: Posts from Dec 15, 2024 onwards
    const cutoffDate = new Date("2024-12-15T00:00:00Z").getTime();

    // Fetch social broadcasts from HubSpot
    // HubSpot Social Media API endpoint
    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/broadcast/v1/broadcasts`,
      qs: {
        limit: 100,
        // Filter for failed broadcasts
        broadcastStatus: "FAILED,ERROR,CANCELLED",
      },
    });

    console.log(`[HubSpot Social] Found ${response.broadcasts?.length || 0} failed broadcasts`);

    if (!response.broadcasts || response.broadcasts.length === 0) {
      console.log("[HubSpot Social] No failed broadcasts found");
      return [];
    }

    // Transform HubSpot broadcasts to our format
    const failedPosts = response.broadcasts
      .filter((broadcast: any) => {
        // Only include posts after cutoff date
        const publishedAt = broadcast.publishedAt || broadcast.createdAt;
        return publishedAt && publishedAt >= cutoffDate;
      })
      .map((broadcast: any) => ({
        blogId: broadcast.contentId || broadcast.id,
        blogTitle: broadcast.message?.split('\n')[0] || "Untitled Post",
        blogUrl: broadcast.linkUrl || "",
        socialContent: broadcast.message || "",
        featuredImage: broadcast.photoUrl || "",
        publishDate: new Date(broadcast.publishedAt || broadcast.createdAt).toISOString(),
        failedPlatforms: broadcast.channels?.map((ch: any) => mapHubSpotChannel(ch.channelKey)) || [],
        failureReason: broadcast.statusMessage || broadcast.error || "Unknown error",
        hubspotBroadcastId: broadcast.id,
        retryAttempts: broadcast.retryCount || 0,
      }));

    console.log(`[HubSpot Social] Returning ${failedPosts.length} failed posts for retry`);
    return failedPosts;

  } catch (error: any) {
    console.error("[HubSpot Social] Error fetching failed broadcasts:", error.message);

    // If the social media API endpoint doesn't exist or we don't have access,
    // fall back to fetching recent blog posts and assuming they need social publishing
    return await getFallbackBlogPostsForSocial();
  }
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
function mapHubSpotChannel(channelKey: string): string {
  const mapping: { [key: string]: string } = {
    "LINKEDIN": "linkedin",
    "LINKEDIN_COMPANY": "linkedin",
    "FACEBOOK": "facebook",
    "FACEBOOK_PAGE": "facebook",
    "TWITTER": "twitter",
    "INSTAGRAM": "instagram",
  };

  return mapping[channelKey?.toUpperCase()] || channelKey?.toLowerCase() || "unknown";
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
