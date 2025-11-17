import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

    const suggestions: string[] = [];

    // Length suggestions
    if (content.length < 50) {
      suggestions.push(
        "Consider adding more details to make your post more engaging (aim for 50-280 characters)"
      );
    } else if (content.length > 280) {
      suggestions.push(
        "Your post is quite long. Consider breaking it into multiple posts or shortening for better engagement"
      );
    }

    // Hashtag suggestions
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount === 0) {
      suggestions.push("Add 2-3 relevant hashtags to increase discoverability");
    } else if (hashtagCount > 5) {
      suggestions.push(
        "Too many hashtags can look spammy. Try limiting to 3-5 relevant ones"
      );
    }

    // Emoji suggestions
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount === 0) {
      suggestions.push(
        "Consider adding 1-2 emojis to make your post more visually appealing"
      );
    }

    // Call-to-action suggestions
    const hasCallToAction =
      /\b(click|visit|check out|learn more|sign up|register|join|download|get|try)\b/i.test(
        content
      );
    if (!hasCallToAction) {
      suggestions.push(
        "Add a clear call-to-action to encourage engagement (e.g., 'Learn more', 'Visit our website')"
      );
    }

    // Question suggestions
    const hasQuestion = content.includes("?");
    if (!hasQuestion && content.length > 100) {
      suggestions.push(
        "Consider ending with a question to encourage comments and engagement"
      );
    }

    // URL suggestions
    const hasUrl = /https?:\/\//.test(content);
    if (!hasUrl) {
      suggestions.push(
        "Consider adding a link to drive traffic to your website or landing page"
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        "Your post looks great! It has good length, hashtags, and engagement elements."
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
