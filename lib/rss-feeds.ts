import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'excerpt'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
    ]
  }
});

// Hardcoded RSS feed URLs for the two blogs
export const RSS_FEEDS = {
  sagesure: {
    url: "https://sagesure.io/ai-you-can-be-sure/rss.xml",
    name: "SageSure AI",
    brand: "sagesure",
    blogUrl: "https://sagesure.io/ai-you-can-be-sure",
  },
  maplesage: {
    url: "https://blog.maplesage.com/rss.xml",
    name: "MapleSage Blog",
    brand: "maplesage",
    blogUrl: "https://blog.maplesage.com",
  },
};

// Helper function to strip HTML tags and clean text
function stripHtml(html: string): string {
  if (!html) return "";

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Truncate to reasonable length for excerpt
  if (text.length > 250) {
    text = text.substring(0, 250).trim() + "...";
  }

  return text;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  link: string;
  pubDate: string;
  author?: string;
  categories?: string[];
  source: string;
  blogName: string;
  blogBrand: string;
  featuredImage?: string; // URL to featured image
}

export async function fetchRSSFeed(feedUrl: string, blogBrand: string): Promise<BlogPost[]> {
  try {
    console.log(`[RSS] Fetching feed from: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    const blogConfig = Object.values(RSS_FEEDS).find(f => f.brand === blogBrand);
    const blogName = blogConfig?.name || "Unknown Blog";

    console.log(`[RSS] Fetched ${feed.items?.length || 0} posts from ${blogName}`);

    const posts: BlogPost[] = (feed.items || []).map((item: any) => {
      // Extract featured image from various RSS formats
      let featuredImage: string | undefined;

      // Try enclosure (common for podcast/media RSS)
      if (item.enclosure && item.enclosure.url) {
        featuredImage = item.enclosure.url;
      }
      // Try media:content
      else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        featuredImage = item.mediaContent.$.url;
      }
      // Try parsing content for first image
      else {
        const content = item.contentEncoded || item['content:encoded'] || item.content || "";
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
          featuredImage = imgMatch[1];
        }
      }

      return {
        id: item.guid || item.link || item.title,
        title: item.title || "",
        content: item.contentEncoded || item['content:encoded'] || item.content || item.description || "",
        excerpt: stripHtml(item.description || item.excerpt || ""),
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item.creator || item.author || "",
        categories: item.categories || [],
        source: "rss",
        blogName: blogName,
        blogBrand: blogBrand,
        featuredImage,
      };
    });

    return posts;
  } catch (error: any) {
    console.error(`[RSS] Error fetching feed from ${feedUrl}:`, error.message);
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
  }
}

export async function fetchAllRSSFeeds(blogFilter?: string): Promise<BlogPost[]> {
  try {
    const feedsToFetch = blogFilter
      ? [RSS_FEEDS[blogFilter as keyof typeof RSS_FEEDS]]
      : Object.values(RSS_FEEDS);

    console.log(`[RSS] Fetching ${feedsToFetch.length} RSS feed(s)`);

    const allPosts: BlogPost[] = [];

    for (const feed of feedsToFetch) {
      if (!feed) continue;
      try {
        const posts = await fetchRSSFeed(feed.url, feed.brand);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`[RSS] Failed to fetch ${feed.name}:`, error);
        // Continue with other feeds even if one fails
      }
    }

    // Sort by publication date, newest first
    allPosts.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    console.log(`[RSS] Total posts fetched: ${allPosts.length}`);
    return allPosts;
  } catch (error: any) {
    console.error("[RSS] Error fetching RSS feeds:", error);
    throw error;
  }
}
