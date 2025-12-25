import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { uploadFile, ensureContainerExists } from "@/lib/azure-blob";
import { saveMedia } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("[Upload] File received:", file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed: JPG, PNG, GIF, WEBP, MP4, MOV, AVI",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB for images, 100MB for videos)
    const maxSize = file.type.startsWith("video/")
      ? 100 * 1024 * 1024
      : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${
            file.type.startsWith("video/") ? "100MB" : "10MB"
          }`,
        },
        { status: 400 }
      );
    }

    // Ensure container exists
    await ensureContainerExists();

    // Convert file to buffer
    console.log("[Upload] Uploading to Azure Blob Storage...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Azure Blob Storage
    const blobUrl = await uploadFile(userId, buffer, file.name, file.type);

    console.log("[Upload] Upload successful! URL:", blobUrl);

    // Determine media type
    const type = file.type.startsWith("video/") ? "video" : "image";

    // Save metadata to database
    console.log("[Upload] Saving metadata to database...");
    try {
      const media = await saveMedia({
        userId,
        url: blobUrl,
        thumbnail: blobUrl, // For images, use same URL. For videos, would need thumbnail generation
        filename: file.name,
        type,
        mimeType: file.type,
        size: file.size,
        folder: folder || undefined,
        description: description || undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        source: "upload",
      });

      console.log("[Upload] Metadata saved to database successfully");

      return NextResponse.json({
        success: true,
        media: {
          id: media.id,
          url: media.url,
          thumbnail: media.thumbnail,
          filename: media.filename,
          type: media.type,
          size: media.size,
          width: media.width,
          height: media.height,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (dbError: any) {
      console.error("[Upload] Database error:", dbError);
      console.error(
        "[Upload] Error details:",
        JSON.stringify(dbError, null, 2)
      );
      return NextResponse.json(
        {
          error: "Failed to save media metadata to database",
          details: dbError.message || dbError.toString(),
          code: dbError.code || dbError.statusCode,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Upload] General upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload media" },
      { status: 500 }
    );
  }
}
