import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN
        ? "✓ Set"
        : "✗ Missing",
      NODE_ENV: process.env.NODE_ENV,
    },
    vercelBlob: {
      status: process.env.BLOB_READ_WRITE_TOKEN
        ? "Configured"
        : "NOT CONFIGURED - Need to enable Vercel Blob in project settings",
      instructions: !process.env.BLOB_READ_WRITE_TOKEN
        ? [
            "1. Go to https://vercel.com/maplesage-s-projects/sagesure-social",
            "2. Click 'Storage' tab",
            "3. Click 'Create Database'",
            "4. Select 'Blob'",
            "5. Click 'Continue'",
            "6. Redeploy the project",
          ]
        : ["Vercel Blob is configured and ready to use"],
    },
    testUpload: {
      endpoint: "/api/media/upload",
      method: "POST",
      requiresAuth: true,
      requiresFile: true,
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
