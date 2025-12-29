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
 * Fallback method: Use RSS feeds to get all blog posts that need social publishing
 * This is more reliable than the HubSpot API
 *
 * Returns ALL posts from RSS feeds published since Dec 15, 2025
 * These correspond to the unsuccessful posts shown in HubSpot's social publishing UI
 */
async function getFallbackBlogPostsForSocial() {
  try {
    console.log("[HubSpot Social] Using RSS fallback: Fetching from RSS feeds...");

    // Import RSS feeds function
    const { fetchAllRSSFeeds } = require("@/lib/rss-feeds");

    const rssBlogs = await fetchAllRSSFeeds();
    console.log(`[HubSpot Social] Found ${rssBlogs.length} posts in RSS feeds`);

    const cutoffDate = new Date("2025-12-15T00:00:00Z");
    const postsNeedingSocial = [];

    // Return ALL RSS posts from Dec 15, 2025 onwards
    // These are posts that should have been published to social media via HubSpot but failed
    for (const blog of rssBlogs) {
      try {
        const pubDate = new Date(blog.pubDate);

        // Only process posts from Dec 15, 2025 onwards
        if (pubDate < cutoffDate) {
          continue;
        }

        postsNeedingSocial.push({
          blogId: blog.id,
          blogTitle: blog.title,
          blogUrl: blog.link,
          socialContent: `${blog.title}\n\n${blog.excerpt || ""}\n\nRead more: ${blog.link}`,
          featuredImage: blog.featuredImage || "",
          publishDate: blog.pubDate,
          failedPlatforms: ["linkedin", "facebook", "twitter"],
          failureReason: "HubSpot social publishing failed - retry needed",
          rssId: blog.id,
          retryAttempts: 0,
        });
      } catch (err) {
        console.error(`[HubSpot Social] Error processing blog ${blog.id}:`, err);
      }
    }

    console.log(`[HubSpot Social] Found ${postsNeedingSocial.length} RSS posts needing social publishing`);
    return postsNeedingSocial;

  } catch (error: any) {
    console.error("[HubSpot Social] RSS fallback error:", error.message);
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
