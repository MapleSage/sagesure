import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-08-01-preview",
});

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();

    const { blogContent, count, blogTitle, blogUrl, summarize } = await req.json();

    if (!blogContent) {
      return NextResponse.json(
        { error: "Blog content required" },
        { status: 400 }
      );
    }

    if (
      !process.env.AZURE_OPENAI_API_KEY ||
      !process.env.AZURE_OPENAI_ENDPOINT
    ) {
      return NextResponse.json(
        { error: "Azure OpenAI not configured" },
        { status: 500 }
      );
    }

    const postCount = count || 3;

    // If summarize is true, create HubSpot-style posts with title + summary + link
    const systemPrompt = summarize
      ? `You are a social media expert creating promotional posts for a blog article.

The blog title is: "${blogTitle}"
The blog URL is: ${blogUrl || "[LINK]"}

Create ${postCount} different social media posts that:
- Start with an engaging hook or question
- Include a 1-2 sentence summary of the key insight
- Reference the blog title naturally
- End with "Read more: ${blogUrl || "[LINK]"}"
- Are 200-280 characters total
- Include 2-3 relevant hashtags at the end
- Have platform-specific tone:
  * LinkedIn: Professional, insightful
  * Twitter/X: Concise, punchy
  * Facebook: Conversational, engaging

Return as JSON: {"posts": ["post1", "post2", "post3"]}`
      : `You are a social media expert. Convert blog posts into engaging social media posts.

Create ${postCount} different social media posts from the blog content. Each post should:
- Be 150-280 characters
- Have a unique angle or hook
- Include 1-2 relevant emojis
- Add 3-5 relevant hashtags
- Be engaging and shareable
- Include a call-to-action when appropriate

Return as JSON: {"posts": ["post1", "post2", "post3"]}`;

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Convert this blog post into ${postCount} social media posts:\n\n${blogContent}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(response);
    const posts = parsed.posts || [];

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Blog to social error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert blog to social posts" },
      { status: 500 }
    );
  }
}
