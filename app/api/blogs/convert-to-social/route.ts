import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBlog } from "@/lib/azure-storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogId, blogUrl, platforms } = await req.json();

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
    }

    // Get blog from database
    const blog = await getBlog(userId, blogId);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Generate platform-specific posts
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a social media expert. Convert this blog post into engaging social media posts for different platforms.

Blog Title: ${blog.title}
Blog Content: ${blog.content.substring(0, 1000)}...

Create social media posts for these platforms: ${platforms.join(", ")}

Requirements:
- LinkedIn: Professional tone, 150-300 characters, include key insights
- Facebook: Conversational, 100-250 characters, engaging hook
- Twitter/X: Concise, max 280 characters, include hashtags
- Instagram: Visual description, 100-200 characters, emoji-friendly

Each post MUST end with: "Read the full story →"

Format as JSON:
{
  "linkedin": "post content here. Read the full story →",
  "facebook": "post content here. Read the full story →",
  "twitter": "post content here. Read the full story →",
  "instagram": "post content here. Read the full story →"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const posts = JSON.parse(jsonMatch[0]);

    // Add blog URL to each post
    const finalPosts: Record<string, string> = {};
    const blogLink = blogUrl || `${process.env.NEXTAUTH_URL}/blogs/${blogId}`;

    for (const platform of platforms) {
      if (posts[platform]) {
        // Ensure "Read the full story →" is at the end
        let postContent = posts[platform];
        if (!postContent.includes("Read the full story")) {
          postContent += "\n\nRead the full story →";
        }
        finalPosts[platform] = postContent;
      }
    }

    return NextResponse.json({
      success: true,
      posts: finalPosts,
      blogUrl: blogLink,
      blogTitle: blog.title,
      blogExcerpt: blog.excerpt,
    });
  } catch (error: any) {
    console.error("Convert blog to social error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert blog to social posts" },
      { status: 500 }
    );
  }
}
