import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

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
    const userId = getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all posts for the user
    const entities = postsTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${userId}'` },
    });

    const posts: any[] = [];
    for await (const entity of entities) {
      const createdAt = new Date(entity.createdAt as string);
      if (createdAt >= startDate && createdAt <= endDate) {
        posts.push({
          id: entity.rowKey,
          content: entity.content,
          platforms: JSON.parse(entity.platforms as string),
          status: entity.status,
          createdAt: entity.createdAt,
          scheduledFor: entity.scheduledFor,
          publishedAt: entity.publishedAt,
        });
      }
    }

    // Calculate analytics
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "published").length;
    const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
    const draftPosts = posts.filter((p) => p.status === "draft").length;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    posts.forEach((post) => {
      post.platforms.forEach((platform: string) => {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
    });

    // Posts per day for chart
    const postsPerDay: Record<string, number> = {};
    posts.forEach((post) => {
      const date = new Date(post.createdAt).toISOString().split("T")[0];
      postsPerDay[date] = (postsPerDay[date] || 0) + 1;
    });

    // Fill in missing days with 0
    const chartData: { date: string; posts: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      chartData.push({
        date: dateStr,
        posts: postsPerDay[dateStr] || 0,
      });
    }

    // Platform performance (mock data for now - would need to fetch from platform APIs)
    const platformPerformance = Object.entries(platformCounts).map(
      ([platform, count]) => ({
        platform,
        posts: count,
        // These would come from actual platform APIs in production
        engagement: Math.floor(Math.random() * 1000),
        reach: Math.floor(Math.random() * 10000),
      })
    );

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalPosts,
          publishedPosts,
          scheduledPosts,
          draftPosts,
        },
        platformCounts,
        chartData,
        platformPerformance,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
      },
    });
  } catch (error: any) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
