import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { savePost, getToken } from "@/lib/azure-storage";
import { postToLinkedIn } from "@/lib/platforms/linkedin";
import { postToFacebook, postToInstagram } from "@/lib/platforms/facebook";
import { postToTwitter } from "@/lib/platforms/twitter";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, platforms, imageUrl, scheduledFor } = await req.json();

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Content and platforms required" },
        { status: 400 }
      );
    }

    const results = [];

    if (scheduledFor) {
      const post = await savePost({
        userId,
        content,
        platforms,
        scheduledFor,
        status: "scheduled",
      });

      return NextResponse.json({
        success: true,
        postId: post.id,
        status: "scheduled",
        scheduledFor,
      });
    }

    for (const platform of platforms) {
      const tokenData = await getToken(userId, platform);

      if (!tokenData?.accessToken) {
        results.push({
          platform,
          success: false,
          error: "Platform not connected",
        });
        continue;
      }

      let result;
      switch (platform) {
        case "linkedin":
          result = await postToLinkedIn(
            tokenData.accessToken,
            content,
            imageUrl
          );
          break;
        case "facebook":
          result = await postToFacebook(
            tokenData.accessToken,
            content,
            imageUrl
          );
          break;
        case "instagram":
          if (!imageUrl) {
            result = {
              success: false,
              error: "Instagram requires an image",
              platform: "instagram",
            };
          } else {
            result = await postToInstagram(
              tokenData.accessToken,
              content,
              imageUrl
            );
          }
          break;
        case "twitter":
          result = await postToTwitter(
            tokenData.accessToken,
            content,
            imageUrl
          );
          break;
        default:
          result = { success: false, error: "Unknown platform", platform };
      }

      results.push(result);
    }

    const post = await savePost({
      userId,
      content,
      platforms,
      status: "published",
    });

    return NextResponse.json({
      success: true,
      postId: post.id,
      results,
    });
  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
