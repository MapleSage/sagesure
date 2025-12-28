import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

/**
 * Test endpoint to check cron job configuration
 * No authentication required for testing
 */

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const hasOpenAI = !!process.env.AZURE_OPENAI_API_KEY;
    const hasCronSecret = !!process.env.CRON_SECRET;
    const hasStorage = !!process.env.AZURE_STORAGE_CONNECTION_STRING;

    // Check current time
    const now = new Date();
    const utcTime = now.toISOString();
    const dubaiTime = new Date(now.getTime() + (4 * 60 * 60 * 1000)).toISOString();

    // Try to fetch scheduled posts
    let scheduledPosts = 0;
    try {
      const userId = "info@sagesure.io";
      // We can't easily query scheduled posts without Azure SDK here, so skip for now
      scheduledPosts = 0;
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      timestamp: {
        utc: utcTime,
        dubai: dubaiTime,
      },
      environment: {
        openAI: hasOpenAI ? "configured" : "missing",
        cronSecret: hasCronSecret ? "configured" : "missing",
        storage: hasStorage ? "configured" : "missing",
      },
      cronSchedule: {
        rssAutoPublish: "30 11 * * * (11:30 AM UTC / 4:00 PM Dubai)",
        publishScheduled: "0 0 * * * (12:00 AM UTC / 4:00 AM Dubai)",
      },
      nextRSSCheck: "Next run at 11:30 AM UTC (4:00 PM Dubai)",
      scheduledPosts: scheduledPosts,
      note: "Vercel Hobby plan limits cron to once per day. Check Vercel dashboard > Cron Jobs to verify they're running."
    });

  } catch (error: any) {
    console.error("[Cron Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Cron test failed",
      },
      { status: 500 }
    );
  }
}
