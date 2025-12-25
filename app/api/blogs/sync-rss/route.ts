import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { fetchAllRSSFeeds } from "@/lib/rss-feeds";
import { saveBlog, getBlogByRssId } from "@/lib/azure-storage";
import { uploadFile, ensureContainerExists } from "@/lib/azure-blob";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();
    const { blogFilter } = await req.json();

    console.log(`[RSS Sync] Starting RSS sync to storage, filter: ${blogFilter || 'all'}`);

    // Fetch RSS feed posts
    const rssBlogs = await fetchAllRSSFeeds(blogFilter || undefined);
    console.log(`[RSS Sync] Fetched ${rssBlogs.length} posts from RSS feeds`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Sync each post to Azure Storage
    for (const blog of rssBlogs) {
      try {
        // Check if post already exists by rssId
        const existingBlog = await getBlogByRssId(userId, blog.id);

        if (existingBlog) {
          console.log(`[RSS Sync] ⊘ Skipped (duplicate): ${blog.title}`);
          results.skipped++;
          continue;
        }

        console.log(`[RSS Sync] Syncing post: ${blog.title}`);

        // Download and store featured image if present
        let featuredImageUrl: string | undefined;
        if (blog.featuredImage) {
          try {
            console.log(`[RSS Sync] Downloading featured image: ${blog.featuredImage}`);
            const imageResponse = await fetch(blog.featuredImage);
            if (imageResponse.ok) {
              // Ensure container exists
              await ensureContainerExists();

              // Convert to buffer
              const imageBlob = await imageResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              const filename = blog.featuredImage.split('/').pop() || 'featured-image';
              const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
              const sanitizedFilename = `${Date.now()}-${blog.id.substring(0, 20)}.${extension}`;

              // Determine content type
              const contentType = imageBlob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

              // Upload to Azure Blob Storage (will be stored as userId/timestamp-filename)
              featuredImageUrl = await uploadFile(
                userId,
                buffer,
                `blog-${sanitizedFilename}`,
                contentType
              );

              console.log(`[RSS Sync] ✓ Featured image uploaded: ${featuredImageUrl}`);
            } else {
              console.log(`[RSS Sync] ⚠ Failed to download featured image (${imageResponse.status})`);
            }
          } catch (imgError: any) {
            console.error(`[RSS Sync] ⚠ Image download error:`, imgError.message);
            // Continue without image
          }
        }

        // Save to Azure Storage
        await saveBlog({
          userId: userId,
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

        console.log(`[RSS Sync] ✓ Synced: ${blog.title}`);
        results.success++;
      } catch (error: any) {
        console.error(`[RSS Sync] ✗ Error syncing ${blog.title}:`, error.message);
        results.failed++;
        results.errors.push({
          title: blog.title,
          error: error.message,
        });
      }
    }

    console.log(`[RSS Sync] Complete - Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return NextResponse.json({
      success: true,
      message: `Synced ${results.success} posts, skipped ${results.skipped} duplicates`,
      results,
    });
  } catch (error: any) {
    console.error("[RSS Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync RSS feeds",
      },
      { status: 500 }
    );
  }
}
