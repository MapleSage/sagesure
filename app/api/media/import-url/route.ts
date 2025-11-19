import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  uploadFile,
  ensureContainerExists,
  downloadFromUrl,
} from "@/lib/azure-blob";
import { saveMedia } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, folder, description, tags } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Ensure blob container exists
    await ensureContainerExists();

    // Download file from URL
    const buffer = await downloadFromUrl(url);

    // Detect content type from URL or buffer
    const filename = url.split("/").pop() || "imported-file";
    const extension = filename.split(".").pop()?.toLowerCase();

    let contentType = "application/octet-stream";
    let type: "image" | "video" = "image";

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
      type = "image";
    } else if (["mp4", "mov", "avi"].includes(extension || "")) {
      contentType = `video/${extension}`;
      type = "video";
    }

    // Upload to Azure Blob Storage
    const blobUrl = await uploadFile(userId, buffer, filename, contentType);

    // Save metadata to database
    const media = await saveMedia({
      userId,
      url: blobUrl,
      filename,
      type,
      mimeType: contentType,
      size: buffer.length,
      folder,
      description,
      tags,
      source: "url",
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: media.url,
        thumbnail: media.thumbnail,
        filename: media.filename,
        type: media.type,
        size: media.size,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Import from URL error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import from URL" },
      { status: 500 }
    );
  }
}
