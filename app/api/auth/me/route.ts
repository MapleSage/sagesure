import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    return NextResponse.json({
      authenticated: true,
      user: {
        sub: userId,
        id: userId,
        email: userId,
        name: "SageSure User",
      },
    });
  } catch (error: any) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: error.message || "Failed to get user info",
      },
      { status: 500 }
    );
  }
}
