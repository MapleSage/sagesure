import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Use Gemini 2.0 Flash to enhance the image prompt
    // Gemini doesn't generate images directly, but helps create better prompts
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      `Create a detailed, professional image generation prompt for: "${prompt}". 
      The image should be suitable for social media posts (professional, engaging, high quality).
      Return ONLY the enhanced prompt, no explanations.`
    );

    const enhancedPrompt = result.response.text();

    return NextResponse.json({
      success: true,
      enhancedPrompt,
      originalPrompt: prompt,
      poweredBy: "Google Gemini AI",
    });
  } catch (error: any) {
    console.error("Image prompt generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image prompt" },
      { status: 500 }
    );
  }
}
