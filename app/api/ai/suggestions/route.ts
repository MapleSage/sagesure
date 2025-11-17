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

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    if (
      !process.env.AZURE_OPENAI_API_KEY ||
      !process.env.AZURE_OPENAI_ENDPOINT
    ) {
      // Fallback to basic suggestions
      const suggestions: string[] = [];

      if (content.length < 50) {
        suggestions.push(
          "Consider adding more details to make your post more engaging (aim for 50-280 characters)"
        );
      } else if (content.length > 280) {
        suggestions.push(
          "Your post is quite long. Consider breaking it into multiple posts or shortening for better engagement"
        );
      }

      const hashtagCount = (content.match(/#\w+/g) || []).length;
      if (hashtagCount === 0) {
        suggestions.push(
          "Add 2-3 relevant hashtags to increase discoverability"
        );
      } else if (hashtagCount > 5) {
        suggestions.push(
          "Too many hashtags can look spammy. Try limiting to 3-5 relevant ones"
        );
      }

      const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || [])
        .length;
      if (emojiCount === 0) {
        suggestions.push(
          "Consider adding 1-2 emojis to make your post more visually appealing"
        );
      }

      const hasCallToAction =
        /\b(click|visit|check out|learn more|sign up|register|join|download|get|try)\b/i.test(
          content
        );
      if (!hasCallToAction) {
        suggestions.push("Add a clear call-to-action to encourage engagement");
      }

      if (suggestions.length === 0) {
        suggestions.push("Your post looks great!");
      }

      return NextResponse.json({ suggestions });
    }

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a social media expert analyzing posts for engagement optimization. Provide 3-5 specific, actionable suggestions to improve the post. Focus on:
- Content structure and clarity
- Engagement tactics (questions, CTAs, hooks)
- Hashtag usage and relevance
- Tone and professionalism
- Length and readability
- Visual elements (emojis, formatting)

Return suggestions as a JSON array of strings. Each suggestion should be concise and actionable.`,
        },
        {
          role: "user",
          content: `Analyze this social media post and provide suggestions:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(response);
    const suggestions = parsed.suggestions || [];

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
