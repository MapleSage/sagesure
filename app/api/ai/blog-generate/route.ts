import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-08-01-preview",
});

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, keywords } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
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

    const keywordText =
      keywords?.length > 0
        ? `\nKeywords to include: ${keywords.join(", ")}`
        : "";

    const systemPrompt = `You are a professional content writer for SageSure, an AI-powered assistant for specialty insurance (Marine, Cyber, Renewable Energy, D&O).

Write comprehensive, SEO-optimized blog posts that:
- Have a compelling title
- Start with an engaging introduction
- Use clear section headings (##)
- Include specific examples and data
- Are well-structured with bullet points and lists
- End with a strong conclusion and call-to-action
- Are 800-1200 words
- Use markdown formatting
- Focus on insurance industry, technology, and innovation

Return the blog post in markdown format with a title at the top as # Title.`;

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Write a blog post about: ${topic}${keywordText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "";

    // Extract title from markdown
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;

    // Extract first paragraph as excerpt
    const paragraphs = content
      .split("\n\n")
      .filter((p) => !p.startsWith("#") && p.trim().length > 0);
    const excerpt = paragraphs[0]?.substring(0, 200) + "..." || "";

    return NextResponse.json({ title, content, excerpt });
  } catch (error: any) {
    console.error("Blog generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate blog" },
      { status: 500 }
    );
  }
}
