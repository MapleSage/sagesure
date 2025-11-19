import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
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

    console.log("[Import URL] Downloading from:", url);

    // Download file from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = url.split("/").pop() || "imported-file";
    const extension = filename.split(".").pop()?.toLowerCase();

    let contentType = blob.type || "application/octet-stream";
    let type: "image" | "video" = "image";

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
      type = "image";
    } else if (["mp4", "mov", "avi"].includes(extension || "")) {
      contentType = `video/${extension}`;
      type = "video";
    }

    console.log("[Import URL] Uploading to Vercel Blob...");

    // Upload to Vercel Blob
    const uploadedBlob = await put(
      `${userId}/${Date.now()}-${filename}`,
      blob,
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    console.log("[Import URL] Upload successful! URL:", uploadedBlob.url);

    // Save metadata to database
    const media = await saveMedia({
      userId,
      url: uploadedBlob.url,
      thumbnail: uploadedBlob.url,
      filename,
      type,
      mimeType: contentType,
      size: blob.size,
      folder,
      description,
      tags,
      source: "url",
    });

    console.log("[Import URL] Metadata saved to database");

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
