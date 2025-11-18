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
      // Fallback to basic spell check
      let corrected = content
        .replace(/\bi\b/g, "I")
        .replace(/\bim\b/gi, "I'm")
        .replace(/\bdont\b/gi, "don't")
        .replace(/\bcant\b/gi, "can't")
        .replace(/\bwont\b/gi, "won't")
        .replace(/\byour\s+welcome\b/gi, "you're welcome")
        .replace(/\bits\s+a\b/gi, "it's a")
        .replace(/\btheir\s+is\b/gi, "there is")
        .replace(/\s{2,}/g, " ")
        .trim();

      corrected = corrected.replace(/(^\w|[.!?]\s+\w)/g, (match: string) =>
        match.toUpperCase()
      );
      return NextResponse.json({ corrected });
    }

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional editor. Fix spelling, grammar, and punctuation errors while preserving the original meaning and tone. Return ONLY the corrected text without any explanations or comments.",
        },
        { role: "user", content: content },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const corrected = completion.choices[0]?.message?.content || content;

    return NextResponse.json({ corrected });
  } catch (error: any) {
    console.error("Spell check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check spelling" },
      { status: 500 }
    );
  }
}
