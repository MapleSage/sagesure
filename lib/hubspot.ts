import { Client } from "@hubspot/api-client";

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY,
});

export async function publishBlogToHubSpot(blog: {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  authorName?: string;
}) {
  try {
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

export async function getHubSpotBlogPosts(limit = 10) {
  try {
    const response: any = await hubspotClient.apiRequest({
      method: "GET",
      path: `/cms/v3/blogs/posts`,
      qs: {
        limit: limit,
      },
    });
    return response.results || [];
  } catch (error: any) {
    console.error("HubSpot fetch error:", error);
    throw new Error(error.message || "Failed to fetch HubSpot blogs");
  }
}
