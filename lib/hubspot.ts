import { Client } from "@hubspot/api-client";

const hubspotClient = process.env.HUBSPOT_API_KEY
  ? new Client({
      accessToken: process.env.HUBSPOT_API_KEY,
    })
  : null;

// HubSpot Portal ID: 3475345
// Blog configurations
export const HUBSPOT_BLOGS = {
  sagesure: {
    id: "SAGESURE_BLOG_ID", // Will need to fetch this from HubSpot API
    name: "SageSure AI",
    url: "https://sagesure.io/ai-you-can-be-sure",
    brand: "sagesure",
  },
  maplesage: {
    id: "MAPLESAGE_BLOG_ID", // Will need to fetch this from HubSpot API
    name: "MapleSage Blog",
    url: "https://blog.maplesage.com",
    brand: "maplesage",
  },
};

export async function publishBlogToHubSpot(blog: {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  authorName?: string;
}) {
  try {
    if (!hubspotClient) {
      throw new Error("HubSpot API key not configured");
    }

    const htmlContent = convertMarkdownToHTML(blog.content);

    const blogPost = {
      name: blog.title,
      postBody: htmlContent,
      metaDescription: blog.excerpt || blog.title,
      contentGroupId: process.env.HUBSPOT_BLOG_ID,
      state: "PUBLISHED",
      publishDate: new Date().toISOString(),
      tagIds: [],
    };

    const response: any = await hubspotClient.apiRequest({
      method: "POST",
      path: "/cms/v3/blogs/posts",
      body: blogPost,
    });

    return {
      success: true,
      url: response.url,
      id: response.id,
    };
  } catch (error: any) {
    console.error("HubSpot publish error:", error);
    throw new Error(error.message || "Failed to publish to HubSpot");
  }
}

export async function saveDraftToHubSpot(blog: {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
}) {
  try {
    if (!hubspotClient) {
      throw new Error("HubSpot API key not configured");
    }

    const htmlContent = convertMarkdownToHTML(blog.content);

    const blogPost = {
      name: blog.title,
      postBody: htmlContent,
      metaDescription: blog.excerpt || blog.title,
      contentGroupId: process.env.HUBSPOT_BLOG_ID,
      state: "DRAFT",
    };

    const response: any = await hubspotClient.apiRequest({
      method: "POST",
      path: "/cms/v3/blogs/posts",
      body: blogPost,
    });

    return {
      success: true,
      url: response.url,
      id: response.id,
    };
  } catch (error: any) {
    console.error("HubSpot draft error:", error);
    throw new Error(error.message || "Failed to save draft to HubSpot");
  }
}

function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/gim, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
  html = html.replace(/_(.*?)_/gim, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Clean up
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p><h/g, "<h");
  html = html.replace(/<\/h([1-6])><\/p>/g, "</h$1>");
  html = html.replace(/<p><ul>/g, "<ul>");
  html = html.replace(/<\/ul><\/p>/g, "</ul>");

  return html;
}

// Fetch all available blogs/content groups from HubSpot
export async function getHubSpotBlogs() {
  try {
    if (!hubspotClient) {
      throw new Error("HubSpot API key not configured");
    }

    console.log("[HubSpot] Fetching available blogs...");
    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/cms/v3/blogs`,
    });
    console.log("[HubSpot] Available blogs:", response.results?.length || 0);
    return response.results || [];
  } catch (error: any) {
    console.error("[HubSpot] Fetch blogs error:", error.message);
    throw new Error(error.message || "Failed to fetch HubSpot blogs");
  }
}

export async function getHubSpotBlogPosts(limit = 10, contentGroupId?: string) {
  try {
    if (!hubspotClient) {
      throw new Error("HubSpot API key not configured");
    }

    console.log("[HubSpot] Fetching blog posts, limit:", limit);
    console.log("[HubSpot] API Key exists:", !!process.env.HUBSPOT_API_KEY);
    console.log("[HubSpot] Content Group ID filter:", contentGroupId || "all blogs");

    const queryParams: any = {
      limit: limit,
    };

    // Filter by specific blog if provided
    if (contentGroupId) {
      queryParams.contentGroupId = contentGroupId;
    }

    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/cms/v3/blogs/posts`,
      qs: queryParams,
    });

    console.log("[HubSpot] Response received, results count:", response.results?.length || 0);

    // Add blog source metadata to each post
    const postsWithMetadata = (response.results || []).map((post: any) => ({
      ...post,
      blogId: post.contentGroupId,
      blogName: post.contentGroupId ? getHubSpotBlogName(post.contentGroupId) : "Unknown",
    }));

    return postsWithMetadata;
  } catch (error: any) {
    console.error("[HubSpot] Fetch error:", error.message);
    console.error("[HubSpot] Error details:", error);
    throw new Error(error.message || "Failed to fetch HubSpot blogs");
  }
}

// Helper function to get blog name from ID
function getHubSpotBlogName(blogId: string): string {
  const blogs = Object.values(HUBSPOT_BLOGS);
  const blog = blogs.find(b => b.id === blogId);
  return blog?.name || "Unknown Blog";
}
