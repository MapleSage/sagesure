import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { saveBlog } from "@/lib/azure-storage";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();

    const { title, content, excerpt, status, tags } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    const blog = await saveBlog({
      userId,
      title,
      content,
      excerpt,
      status: status || "draft",
      tags: tags || [],
    });

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    console.error("Blog creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create blog" },
      { status: 500 }
    );
  }
}
