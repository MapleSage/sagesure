import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getSettings(userId);

    return NextResponse.json({
      success: true,
      settings: settings || {
        companyName: "",
        brandIdentity: "",
        customerProfile: "",
      },
    });
  } catch (error: any) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, companyName, brandIdentity, customerProfile } =
      await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await saveSettings(userId, {
      companyName,
      brandIdentity,
      customerProfile,
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("Save settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
