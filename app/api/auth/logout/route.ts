import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Since we don't have real authentication, just return success
    // In a real app, this would clear cookies/sessions
    return NextResponse.json({
      success: true,
      logoutUrl: "/",
    });
  } catch (error: any) {
    console.error("[Auth Logout] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to logout",
      },
      { status: 500 }
    );
  }
}
