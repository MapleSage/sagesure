import { NextRequest, NextResponse } from "next/server";
import { initializeTables } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    await initializeTables();
    return NextResponse.json({ success: true, message: "Tables initialized" });
  } catch (error: any) {
    console.error("Initialization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize" },
      { status: 500 }
    );
  }
}
