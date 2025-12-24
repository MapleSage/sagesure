import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert to buffer for Azure OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Use Azure OpenAI Whisper for transcription
    const whisperFormData = new FormData();
    whisperFormData.append(
      "file",
      new Blob([buffer], { type: "audio/webm" }),
      "audio.webm"
    );
    whisperFormData.append("model", "whisper-1");

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/whisper/audio/transcriptions?api-version=2024-02-01`,
      {
        method: "POST",
        headers: {
          "api-key": process.env.AZURE_OPENAI_API_KEY!,
        },
        body: whisperFormData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Whisper API error:", error);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      text: data.text,
    });
  } catch (error: any) {
    console.error("Speech-to-text error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
