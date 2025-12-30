import { NextRequest, NextResponse } from "next/server";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import { getUserId } from "@/lib/auth";

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

const tokensTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "tokens",
  credential
);

/**
 * Fix LinkedIn token to include organization ID
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId();
    const organizationId = process.env.LINKEDIN_ORGANIZATION_ID || "109911035";

    console.log("[FIX] Updating LinkedIn token for user:", userId);
    console.log("[FIX] Organization ID:", organizationId);

    // Get existing LinkedIn token
    const entity = await tokensTable.getEntity(userId, "linkedin");

    if (!entity) {
      return NextResponse.json({
        success: false,
        error: "LinkedIn not connected. Please connect LinkedIn first.",
      });
    }

    // Update with organization ID
    const updated = {
      ...entity,
      organizationId,
      organizationName: "SageSure AI",
      updatedAt: new Date().toISOString(),
    };

    await tokensTable.updateEntity(updated, "Replace");

    console.log("[FIX] LinkedIn token updated successfully");

    return NextResponse.json({
      success: true,
      message: "LinkedIn organization ID updated",
      organizationId,
      note: "Future posts will now go to the SageSure AI organization page instead of your personal profile",
    });
  } catch (error: any) {
    console.error("[FIX] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
