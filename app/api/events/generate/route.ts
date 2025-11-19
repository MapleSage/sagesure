import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSettings, saveEvent, getUserEvents } from "@/lib/azure-storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get settings
    const settings = await getSettings(userId);
    if (!settings || !settings.companyName) {
      return NextResponse.json(
        { error: "Company name not set. Please update settings first." },
        { status: 400 }
      );
    }

    // Check for existing events in the next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const existingEvents = await getUserEvents(
      userId,
      today.toISOString(),
      thirtyDaysLater.toISOString()
    );

    // If we have enough events, return them
    if (existingEvents.length >= 10) {
      return NextResponse.json({
        success: true,
        events: existingEvents,
        message: "Using existing events",
      });
    }

    // Generate new events using AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a social media marketing expert. Generate 15 business-relevant calendar events for the next 30 days that would be good opportunities for social media posts.

Company: ${settings.companyName}
Brand Identity: ${settings.brandIdentity || "Professional and engaging"}
Target Customer: ${settings.customerProfile || "General business audience"}

For each event, provide:
1. Event title (concise)
2. Date (in YYYY-MM-DD format, spread across the next 30 days)
3. Brief description (1-2 sentences)
4. Category (e.g., Holiday, Industry Event, Awareness Day, Seasonal)

Format your response as a JSON array with this structure:
[
  {
    "title": "Event Name",
    "date": "2025-11-20",
    "description": "Brief description",
    "category": "Holiday"
  }
]

Focus on events that align with the brand identity and would resonate with the target customer profile.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const events = JSON.parse(jsonMatch[0]);

    // Save events to database
    const savedEvents = [];
    for (const event of events) {
      const saved = await saveEvent({
        userId,
        title: event.title,
        date: event.date,
        description: event.description,
        category: event.category,
      });
      savedEvents.push(saved);
    }

    return NextResponse.json({
      success: true,
      events: savedEvents,
      message: "Generated new events",
    });
  } catch (error: any) {
    console.error("Generate events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate events" },
      { status: 500 }
    );
  }
}
