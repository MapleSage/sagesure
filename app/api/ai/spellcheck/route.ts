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

    // Basic spell check and grammar fixes
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

    // Capitalize first letter of sentences
    corrected = corrected.replace(/(^\w|[.!?]\s+\w)/g, (match) =>
      match.toUpperCase()
    );

    return NextResponse.json({ corrected });
  } catch (error: any) {
    console.error("Spell check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check spelling" },
      { status: 500 }
    );
  }
}
