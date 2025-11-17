import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

    // Call OpenAI or other AI service
    // For now, return a template-based response
    const platformText =
      platforms?.length > 0 ? ` for ${platforms.join(", ")}` : "";
    const content = `🚀 ${prompt}

Here's an engaging post about this topic${platformText}. This content is optimized for social media engagement with relevant hashtags and a clear call-to-action.

#SocialMedia #ContentMarketing #DigitalMarketing`;

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
