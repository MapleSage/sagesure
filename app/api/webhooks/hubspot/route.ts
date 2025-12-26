import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

/**
 * HubSpot Webhook Handler for Blog Automation
 *
 * This endpoint receives webhooks from HubSpot when new blog posts are published.
 * It automatically generates social media posts from the blog content.
 *
 * Setup in HubSpot:
 * 1. Go to Settings → Integrations → Private Apps
 * 2. Create a new private app with blog read permissions
 * 3. Go to Settings → Integrations → Webhooks
 * 4. Create webhook for "blog.published" event
 * 5. Set URL to: https://social.sagesure.io/api/webhooks/hubspot
 * 6. Add secret key to environment variable: HUBSPOT_WEBHOOK_SECRET
 *
 * Environment Variables:
 * - HUBSPOT_WEBHOOK_SECRET: Secret key for webhook verification
 * - HUBSPOT_API_KEY: HubSpot private app access token
 * - HUBSPOT_AUTO_GENERATE: Set to 'true' to enable auto-generation
 */

const WEBHOOK_SECRET = process.env.HUBSPOT_WEBHOOK_SECRET;
const AUTO_GENERATE_ENABLED = process.env.HUBSPOT_AUTO_GENERATE === 'true';

interface HubSpotWebhookPayload {
  eventType: string;
  objectId: number;
  objectType: string;
  portalId: number;
  occurredAt: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[HubSpot Webhook] Received webhook');

    // Verify webhook signature
    const signature = req.headers.get('x-hubspot-signature-v3');
    const requestBody = await req.text();

    if (WEBHOOK_SECRET && signature) {
      // TODO: Implement signature verification
      // For now, we'll trust the request if WEBHOOK_SECRET is set
      console.log('[HubSpot Webhook] Signature verification skipped (implement for production)');
    }

    // Parse webhook payload
    const payload: HubSpotWebhookPayload = JSON.parse(requestBody);

    console.log('[HubSpot Webhook] Event type:', payload.eventType);
    console.log('[HubSpot Webhook] Object ID:', payload.objectId);

    // Only process blog.published events
    if (payload.eventType !== 'blog.published') {
      console.log('[HubSpot Webhook] Ignoring non-blog event');
      return NextResponse.json({
        success: true,
        message: 'Event ignored (not a blog.published event)',
      });
    }

    if (!AUTO_GENERATE_ENABLED) {
      console.log('[HubSpot Webhook] Auto-generation disabled');
      return NextResponse.json({
        success: true,
        message: 'Auto-generation disabled',
      });
    }

    // Fetch blog post details from HubSpot
    const blogId = payload.objectId;
    const blogDetails = await fetchBlogDetails(blogId);

    if (!blogDetails) {
      throw new Error('Failed to fetch blog details');
    }

    console.log('[HubSpot Webhook] Blog title:', blogDetails.title);

    // Get user ID (for now, use default user)
    // TODO: Map HubSpot portal ID to user ID
    const userId = getUserId() || 'info@sagesure.io';

    // Generate social media posts from blog content
    const socialPosts = await generateSocialPosts(blogDetails.content, userId);

    console.log('[HubSpot Webhook] Generated', socialPosts.length, 'social posts');

    // Schedule posts for optimal times
    await scheduleSocialPosts(socialPosts, userId);

    return NextResponse.json({
      success: true,
      message: `Generated ${socialPosts.length} social posts from blog`,
      blogId,
      blogTitle: blogDetails.title,
      postsGenerated: socialPosts.length,
    });
  } catch (error: any) {
    console.error('[HubSpot Webhook] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch blog details from HubSpot API
 */
async function fetchBlogDetails(blogId: number) {
  try {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
      throw new Error('HUBSPOT_API_KEY not configured');
    }

    const response = await fetch(
      `https://api.hubapi.com/cms/v3/blogs/posts/${blogId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      title: data.name || data.title,
      content: data.postBody || data.post_body || '',
      url: data.url,
      featuredImage: data.featuredImage || data.featured_image,
      publishDate: data.publishDate || data.publish_date,
    };
  } catch (error) {
    console.error('[HubSpot Webhook] Fetch blog error:', error);
    return null;
  }
}

/**
 * Generate social media posts using AI
 */
async function generateSocialPosts(blogContent: string, userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/ai/blog-to-social`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogContent,
          count: 5, // Generate 5 social posts
        }),
      }
    );

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('[HubSpot Webhook] Generate posts error:', error);
    return [];
  }
}

/**
 * Schedule social posts for optimal times
 */
async function scheduleSocialPosts(posts: string[], userId: string) {
  try {
    // Optimal posting times (EST):
    // LinkedIn: 8 AM, 12 PM, 5 PM (weekdays)
    // Facebook: 9 AM, 1 PM, 3 PM (all days)
    // Twitter: 8 AM, 12 PM, 5 PM (all days)
    // Instagram: 11 AM, 2 PM, 7 PM (all days)

    const optimalTimes = [
      { hour: 8, minute: 0 },   // 8:00 AM
      { hour: 12, minute: 0 },  // 12:00 PM
      { hour: 14, minute: 0 },  // 2:00 PM
      { hour: 17, minute: 0 },  // 5:00 PM
      { hour: 19, minute: 0 },  // 7:00 PM
    ];

    const now = new Date();
    const scheduledPosts = [];

    for (let i = 0; i < posts.length && i < optimalTimes.length; i++) {
      const scheduleTime = new Date(now);
      scheduleTime.setDate(scheduleTime.getDate() + Math.floor(i / 2)); // Spread over multiple days
      scheduleTime.setHours(optimalTimes[i].hour);
      scheduleTime.setMinutes(optimalTimes[i].minute);
      scheduleTime.setSeconds(0);

      // Create draft post (user can review before publishing)
      const post = await fetch(`${process.env.NEXTAUTH_URL}/api/posts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: posts[i],
          platforms: ['linkedin', 'facebook', 'twitter', 'instagram'],
          scheduledFor: scheduleTime.toISOString(),
          isDraft: true, // Save as draft for review
        }),
      });

      if (post.ok) {
        scheduledPosts.push({
          content: posts[i],
          scheduledFor: scheduleTime.toISOString(),
        });
      }
    }

    return scheduledPosts;
  } catch (error) {
    console.error('[HubSpot Webhook] Schedule posts error:', error);
    return [];
  }
}

/**
 * GET endpoint to check webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    webhook: 'HubSpot Blog Automation',
    status: AUTO_GENERATE_ENABLED ? 'enabled' : 'disabled',
    endpoint: '/api/webhooks/hubspot',
    supportedEvents: ['blog.published'],
    configuration: {
      autoGenerate: AUTO_GENERATE_ENABLED,
      webhookSecretConfigured: !!WEBHOOK_SECRET,
      hubspotApiKeyConfigured: !!process.env.HUBSPOT_API_KEY,
    },
    setupInstructions: 'See AZURE_SETUP.md for webhook configuration',
  });
}
