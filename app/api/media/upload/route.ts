import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadFile, ensureContainerExists } from "@/lib/azure-blob";
import { saveMedia } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure blob container exists
    await ensureContainerExists();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Azure Blob Storage
    const url = await uploadFile(userId, buffer, file.name, file.type);

    // Determine media type
    const type = file.type.startsWith("video/") ? "video" : "image";

    // Save metadata to database
    const media = await saveMedia({
      userId,
      url,
      filename: file.name,
      type,
      mimeType: file.type,
      size: file.size,
      folder: folder || undefined,
      description: description || undefined,
      tags: tags ? JSON.parse(tags) : undefined,
      source: "upload",
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
        width: media.width,
        height: media.height,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload media" },
      { status: 500 }
    );
  }
}
