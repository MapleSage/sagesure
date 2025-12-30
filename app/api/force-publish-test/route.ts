import { NextRequest, NextResponse } from "next/server";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import { getToken } from "@/lib/azure-storage";
import { postToLinkedIn } from "@/lib/platforms/linkedin";
import { postToFacebook, postToInstagram } from "@/lib/platforms/facebook";
import { postToTwitter } from "@/lib/platforms/twitter";

// Parse connection string
function parseConnectionString(connStr: string) {
  const parts = connStr.split(";");
  const accountName = parts
    .find((p) => p.startsWith("AccountName="))
    ?.split("=")[1];
  const accountKey = parts
    .find((p) => p.startsWith("AccountKey="))
    ?.split("=")[1];
  return { accountName, accountKey };
}

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const { accountName, accountKey } = parseConnectionString(connectionString);
const credential = new AzureNamedKeyCredential(accountName!, accountKey!);

const postsTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "posts",
  credential
);

/**
 * Force publish ONE scheduled post immediately (for testing)
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[FORCE PUBLISH] Starting force publish test...");

    // Get first scheduled post
    const entities = postsTable.listEntities({
      queryOptions: { filter: `status eq 'scheduled'` },
    });

    let entity: any = null;
    for await (const e of entities) {
      entity = e;
      break; // Just get the first one
    }

    if (!entity) {
      return NextResponse.json({
        success: false,
        error: "No scheduled posts found",
      });
    }

    console.log(`[FORCE PUBLISH] Found post ${entity.rowKey}, forcing publish...`);

    const userId = entity.partitionKey as string;
    const postId = entity.rowKey as string;
    const content = entity.content as string;
    const platforms = JSON.parse(entity.platforms as string);
    const platformContent = entity.platformContent
      ? JSON.parse(entity.platformContent as string)
      : {};
    const imageUrl = entity.imageUrl as string;
    const mediaUrls = entity.mediaUrls
      ? JSON.parse(entity.mediaUrls as string)
      : {};

    const postResults = [];

    // Post to each platform
    for (const platform of platforms) {
      console.log(`[FORCE PUBLISH] Posting to ${platform}...`);
      const tokenData = await getToken(userId, platform);

      if (!tokenData?.accessToken) {
        console.log(`[FORCE PUBLISH] No token for ${platform}`);
        postResults.push({
          platform,
          success: false,
          error: "Platform not connected",
        });
        continue;
      }

      const platformText = platformContent[platform] || content;
      const platformMedia = mediaUrls[platform] || imageUrl;

      let result;
      try {
        switch (platform) {
          case "linkedin":
            result = await postToLinkedIn(
              tokenData.accessToken,
              platformText,
              platformMedia,
              tokenData.organizationId
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
                error: "Instagram requires media",
                platform: "instagram",
              };
            } else {
              result = await postToInstagram(
                tokenData.accessToken,
                platformText,
                platformMedia,
                tokenData.pageId,
                tokenData.instagramAccountId
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
            result = {
              success: false,
              error: "Unknown platform",
              platform,
            };
        }

        console.log(`[FORCE PUBLISH] ${platform} result:`, result);
      } catch (error: any) {
        console.error(`[FORCE PUBLISH] Error posting to ${platform}:`, error);
        result = {
          success: false,
          error: error.message,
          platform,
        };
      }

      postResults.push(result);
    }

    // Update post status
    const updated = {
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      ...entity,
      status: "published",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await postsTable.updateEntity(updated, "Replace");

    console.log(`[FORCE PUBLISH] Successfully published post ${postId}`);

    return NextResponse.json({
      success: true,
      postId,
      userId,
      content: content.substring(0, 100) + "...",
      results: postResults,
      summary: {
        total: platforms.length,
        succeeded: postResults.filter((r) => r.success).length,
        failed: postResults.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error("[FORCE PUBLISH] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to force publish" },
      { status: 500 }
    );
  }
}
