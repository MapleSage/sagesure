import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMedia, updateMedia, deleteMedia } from "@/lib/azure-storage";
import { deleteFile } from "@/lib/azure-blob";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await getMedia(userId, params.id);

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error: any) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get media" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();

    const media = await updateMedia(userId, params.id, updates);

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error: any) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update media" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get media to get the blob URL
    const media = await getMedia(userId, params.id);

    if (media) {
      // Delete from blob storage
      await deleteFile(media.url);

      // Delete from database
      await deleteMedia(userId, params.id);
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete media" },
      { status: 500 }
    );
  }
}
