import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSettings, savePost } from "@/lib/azure-storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, events } = await req.json();

    if (!userId || !events || events.length === 0) {
      return NextResponse.json(
        { error: "User ID and events required" },
        { status: 400 }
      );
    }

    // Get settings
    const settings = await getSettings(userId);
    if (!settings || !settings.companyName) {
      return NextResponse.json(
        { error: "Company name not set. Please update settings first." },
        { status: 400 }
      );
    }

    // Generate post suggestions for each event
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const eventsList = events
      .map(
        (e: any, i: number) =>
          `${i + 1}. ${e.title} (${e.date}) - ${e.description}`
      )
      .join("\n");

    const prompt = `You are a social media marketing expert. Generate engaging social media post suggestions for these upcoming events:

${eventsList}

Company: ${settings.companyName}
Brand Identity: ${settings.brandIdentity || "Professional and engaging"}
Target Customer: ${settings.customerProfile || "General business audience"}

For each event, create a social media post that:
- Aligns with the brand identity
- Resonates with the target customer profile
- Is engaging and actionable
- Includes relevant hashtags
- Is suitable for LinkedIn, Facebook, Twitter, and Instagram

Format your response as a JSON array with this structure:
[
  {
    "eventTitle": "Event Name",
    "eventDate": "2025-11-20",
    "content": "The social media post content with hashtags",
    "platforms": ["linkedin", "facebook", "twitter", "instagram"]
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Save suggestions as drafts
    const savedSuggestions = [];
    for (const suggestion of suggestions) {
      const saved = await savePost({
        userId,
        content: suggestion.content,
        platforms: suggestion.platforms,
        status: "draft",
        scheduledFor: suggestion.eventDate,
      });
      savedSuggestions.push(saved);
    }

    // Generate a URL to view the suggestions (drafts page)
    const socialAgentUrl = `/dashboard?tab=drafts`;

    return NextResponse.json({
      success: true,
      suggestions: savedSuggestions,
      socialAgentUrl,
      message: "Generated post suggestions",
    });
  } catch (error: any) {
    console.error("Generate suggestions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
