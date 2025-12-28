import { NextRequest, NextResponse } from "next/server";
import { fetchAllRSSFeeds } from "@/lib/rss-feeds";
import { getBlogByRssId, saveBlog } from "@/lib/azure-storage";
import { uploadFile, ensureContainerExists } from "@/lib/azure-blob";

/**
 * RSS Auto-Publish Cron Job
 *
 * This endpoint automatically:
 * 1. Checks RSS feeds for new posts
 * 2. Generates social media posts from new blog content
 * 3. Schedules them for optimal posting times
 *
 * Should be called via Vercel Cron (every 30 minutes)
 * Configured in vercel.json
 */

const DEFAULT_USER_ID = "info@sagesure.io"; // Default user for auto-publishing

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron job
    const authHeader = req.headers.get("authorization");
    const vercelCron = req.headers.get("x-vercel-cron");

    // Allow either Vercel cron header OR Bearer token (for manual testing)
    const isVercelCron = vercelCron !== null;
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron && !isAuthorized) {
      console.log("[RSS Auto-Publish] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[RSS Auto-Publish] Starting RSS auto-publish check");
    const startTime = new Date().toISOString();

    // Fetch all RSS feeds
    const rssBlogs = await fetchAllRSSFeeds();
    console.log(`[RSS Auto-Publish] Fetched ${rssBlogs.length} total posts from RSS feeds`);

    const results = {
      newPosts: 0,
      socialPostsGenerated: 0,
      errors: [] as any[],
    };

    // Process each RSS post
    for (const blog of rssBlogs) {
      try {
        // Check if post already exists
        const existingBlog = await getBlogByRssId(DEFAULT_USER_ID, blog.id);

        if (existingBlog) {
          // Post already processed, skip
          continue;
        }

        console.log(`[RSS Auto-Publish] New post detected: ${blog.title}`);

        // Download and store featured image if present
        let featuredImageUrl: string | undefined;
        if (blog.featuredImage) {
          try {
            const imageResponse = await fetch(blog.featuredImage);
            if (imageResponse.ok) {
              await ensureContainerExists();
              const imageBlob = await imageResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              const filename = blog.featuredImage.split('/').pop() || 'featured-image';
              const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
              const sanitizedFilename = `${Date.now()}-${blog.id.substring(0, 20)}.${extension}`;
              const contentType = imageBlob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

              featuredImageUrl = await uploadFile(
                DEFAULT_USER_ID,
                buffer,
                `blog-${sanitizedFilename}`,
                contentType
              );

              console.log(`[RSS Auto-Publish] Featured image uploaded`);
            }
          } catch (imgError: any) {
            console.error(`[RSS Auto-Publish] Image download error:`, imgError.message);
          }
        }

        // Save blog to storage
        await saveBlog({
          userId: DEFAULT_USER_ID,
          title: blog.title,
          content: blog.content,
          excerpt: blog.excerpt,
          status: "published",
          tags: blog.categories || [],
          source: "rss",
          blogName: blog.blogName,
          blogBrand: blog.blogBrand,
          link: blog.link,
          author: blog.author,
          pubDate: blog.pubDate,
          rssId: blog.id,
          featuredImageUrl,
        });

        results.newPosts++;

        // Auto-generate social media posts (HubSpot-style with summary)
        try {
          const socialResponse = await fetch(
            `${process.env.NEXTAUTH_URL || 'https://social.sagesure.io'}/api/ai/blog-to-social`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                blogContent: blog.content,
                count: 3, // Generate 3 social posts (like HubSpot)
                blogTitle: blog.title,
                blogUrl: blog.link,
                summarize: true, // Use HubSpot-style summarization
              }),
            }
          );

          if (socialResponse.ok) {
            const socialData = await socialResponse.json();
            const posts = socialData.posts || [];

            // Schedule posts HubSpot-style: 15 minutes after blog publish, spread over time
            const blogPublishDate = new Date(blog.pubDate);

            // Post 1: 15 minutes after blog (LinkedIn)
            // Post 2: 1 hour after blog (Facebook/Twitter)
            // Post 3: 3 hours after blog (Instagram)
            const scheduleDelays = [15, 60, 180]; // minutes

            for (let i = 0; i < posts.length && i < 3; i++) {
              const scheduleTime = new Date(blogPublishDate);
              scheduleTime.setMinutes(scheduleTime.getMinutes() + scheduleDelays[i]);

              // Platform assignment (like HubSpot)
              const platforms = i === 0
                ? ["linkedin"] // Professional post goes to LinkedIn first
                : i === 1
                ? ["facebook", "twitter"] // Conversational to Facebook/Twitter
                : ["instagram"]; // Visual to Instagram

              // Create scheduled post (ready to publish, not draft)
              await fetch(`${process.env.NEXTAUTH_URL || 'https://social.sagesure.io'}/api/posts/create`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: DEFAULT_USER_ID,
                  content: posts[i],
                  platforms: platforms,
                  scheduledFor: scheduleTime.toISOString(),
                  isDraft: false, // Ready to publish automatically
                  mediaUrl: featuredImageUrl,
                }),
              });

              results.socialPostsGenerated++;
            }

            console.log(`[RSS Auto-Publish] Generated ${posts.length} social posts for: ${blog.title} (LinkedIn at +15min, FB/Twitter at +1hr, Instagram at +3hr)`);
          }
        } catch (socialError: any) {
          console.error(`[RSS Auto-Publish] Social generation error:`, socialError.message);
          results.errors.push({
            blog: blog.title,
            error: `Social generation failed: ${socialError.message}`,
          });
        }

        console.log(`[RSS Auto-Publish] ✓ Processed: ${blog.title}`);
      } catch (error: any) {
        console.error(`[RSS Auto-Publish] Error processing ${blog.title}:`, error.message);
        results.errors.push({
          blog: blog.title,
          error: error.message,
        });
      }
    }

    console.log(
      `[RSS Auto-Publish] Complete - New posts: ${results.newPosts}, ` +
      `Social posts generated: ${results.socialPostsGenerated}, ` +
      `Errors: ${results.errors.length}`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${results.newPosts} new blog posts`,
      executedAt: startTime,
      totalBlogsChecked: rssBlogs.length,
      newPostsFound: results.newPosts,
      socialPostsGenerated: results.socialPostsGenerated,
      results,
    });
  } catch (error: any) {
    console.error("[RSS Auto-Publish] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "RSS auto-publish failed",
      },
      { status: 500 }
    );
  }
}
