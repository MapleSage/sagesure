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

    const { blogContent, count } = await req.json();

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

    const postCount = count || 5;

    const systemPrompt = `You are a social media expert. Convert blog posts into engaging social media posts.

Create ${postCount} different social media posts from the blog content. Each post should:
- Be 150-280 characters
- Have a unique angle or hook
- Include 1-2 relevant emojis
- Add 3-5 relevant hashtags
- Be engaging and shareable
- Include a call-to-action when appropriate

Return as a JSON array of strings.`;

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
      max_tokens: 1000,
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
