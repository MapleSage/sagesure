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

    const {
      content,
      platforms,
      imageUrl,
      scheduledFor,
      isDraft,
      platformContent, // Platform-specific content
      mediaUrls, // Platform-specific media
    } = await req.json();

    // If saving as draft, minimal validation
    if (isDraft) {
      const post = await savePost({
        userId,
        content: content || "",
        platforms: platforms || [],
        status: "draft",
        platformContent,
        imageUrl,
        mediaUrls,
      });

      return NextResponse.json({
        success: true,
        postId: post.id,
        status: "draft",
      });
    }

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Content and platforms required" },
        { status: 400 }
      );
    }

    // Validation: Instagram requires media
    if (platforms.includes("instagram") && !imageUrl && !mediaUrls?.instagram) {
      return NextResponse.json(
        { error: "Instagram requires an image or video" },
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
        platformContent,
        imageUrl,
        mediaUrls,
      });

      return NextResponse.json({
        success: true,
        postId: post.id,
        status: "scheduled",
        scheduledFor,
      });
    }

    for (const platform of platforms) {
      console.log(
        `[POST] Attempting to post to ${platform} for user ${userId}`
      );

      const tokenData = await getToken(userId, platform);

      if (!tokenData?.accessToken) {
        console.log(`[POST] No token found for ${platform}`);
        results.push({
          platform,
          success: false,
          error: "Platform not connected. Please reconnect your account.",
        });
        continue;
      }

      console.log(`[POST] Token found for ${platform}`);
      console.log(
        `[POST] Token preview: ${tokenData.accessToken.substring(0, 20)}...`
      );
      console.log(
        `[POST] Token expires at: ${
          tokenData.expiresAt
            ? new Date(tokenData.expiresAt * 1000).toISOString()
            : "N/A"
        }`
      );

      // Use platform-specific content if available, otherwise use default
      const platformText = platformContent?.[platform] || content;
      const platformMedia = mediaUrls?.[platform] || imageUrl;

      let result;
      try {
        switch (platform) {
          case "linkedin":
            result = await postToLinkedIn(
              tokenData.accessToken,
              platformText,
              platformMedia
            );
            break;
          case "facebook":
            result = await postToFacebook(
              tokenData.accessToken,
              platformText,
              platformMedia
            );
            break;
          case "instagram":
            if (!platformMedia) {
              result = {
                success: false,
                error: "Instagram requires an image",
                platform: "instagram",
              };
            } else {
              result = await postToInstagram(
                tokenData.accessToken,
                platformText,
                platformMedia
              );
            }
            break;
          case "twitter":
            result = await postToTwitter(
              tokenData.accessToken,
              platformText,
              platformMedia
            );
            break;
          default:
            result = { success: false, error: "Unknown platform", platform };
        }

        console.log(`[POST] Result for ${platform}:`, result);
      } catch (error: any) {
        console.error(`[POST] Error posting to ${platform}:`, error);
        result = {
          success: false,
          error: error.message,
          platform,
        };
      }

      results.push(result);
    }

    const post = await savePost({
      userId,
      content,
      platforms,
      status: "published",
      platformContent,
      imageUrl,
      mediaUrls,
    });

    // Check if any posts succeeded
    const successCount = results.filter((r) => r.success).length;
    const failedPlatforms = results.filter((r) => !r.success);

    console.log(
      `[POST] Posted to ${successCount}/${platforms.length} platforms`
    );
    if (failedPlatforms.length > 0) {
      console.log("[POST] Failed platforms:", failedPlatforms);
    }

    return NextResponse.json({
      success: true,
      postId: post.id,
      results,
      summary: {
        total: platforms.length,
        succeeded: successCount,
        failed: failedPlatforms.length,
        failedPlatforms: failedPlatforms.map((p) => ({
          platform: p.platform,
          error: p.error,
        })),
      },
    });
  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
