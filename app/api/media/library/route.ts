import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUserMedia, getUserFolders, searchMedia } from "@/lib/azure-storage";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "image" | "video" | null;
    const folder = searchParams.get("folder");
    const limit = searchParams.get("limit");
    const query = searchParams.get("q");

    // If search query provided, search media
    if (query) {
      const media = await searchMedia(userId, query);
      return NextResponse.json({
        success: true,
        media,
        total: media.length,
      });
    }

    // Otherwise, list media
    const media = await getUserMedia(
      userId,
      type || undefined,
      folder || undefined,
      limit ? parseInt(limit) : undefined
    );

    // Get folders
    const folders = await getUserFolders(userId);

    return NextResponse.json({
      success: true,
      media,
      folders,
      total: media.length,
    });
  } catch (error: any) {
    console.error("Media library error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load media library" },
      { status: 500 }
    );
  }
}
