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

export async function GET(req: NextRequest) {
  try {
    console.log("[CRON] Starting scheduled posts check...");
    const startTime = new Date().toISOString();

    const now = new Date();
    const results = [];
    let totalChecked = 0;

    // Get all scheduled posts
    const entities = postsTable.listEntities({
      queryOptions: { filter: `status eq 'scheduled'` },
    });

    for await (const entity of entities) {
      totalChecked++;
      const scheduledFor = new Date(entity.scheduledFor as string);

      // Check if it's time to publish
      if (scheduledFor <= now) {
        console.log(
          `[CRON] Publishing post ${entity.rowKey} for user ${entity.partitionKey}`
        );

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
          const tokenData = await getToken(userId, platform);

          if (!tokenData?.accessToken) {
            console.log(`[CRON] No token for ${platform}`);
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
          } catch (error: any) {
            console.error(`[CRON] Error posting to ${platform}:`, error);
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

        results.push({
          postId,
          userId,
          results: postResults,
        });
      }
    }

    console.log(`[CRON] Processed ${results.length} scheduled posts`);

    return NextResponse.json({
      success: true,
      executedAt: startTime,
      totalScheduledPostsChecked: totalChecked,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[CRON] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process scheduled posts" },
      { status: 500 }
    );
  }
}
