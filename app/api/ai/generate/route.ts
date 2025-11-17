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

    const { prompt, platforms } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
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

    const platformText =
      platforms?.length > 0 ? ` for ${platforms.join(", ")}` : "";

    const systemPrompt = `You are a professional social media content writer for SageSure, an AI-powered assistant for specialty insurance (Marine, Cyber, Renewable Energy, D&O). 

Create engaging, professional social media posts that:
- Start with a compelling hook or problem statement
- Use storytelling and specific examples
- Include relevant emojis (but not too many - 1-3 max)
- Add 3-5 relevant hashtags at the end
- Include a clear call-to-action when appropriate
- Are optimized for ${platformText || "social media"}
- Keep the tone professional but conversational
- Focus on the insurance industry, technology, and innovation
- Use bullet points with checkmarks (✓) when listing features or benefits

The post should be between 150-300 words for optimal engagement.`;

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
