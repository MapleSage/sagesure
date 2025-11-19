import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      META_CLIENT_ID: process.env.META_CLIENT_ID ? "✓ Set" : "✗ Missing",
      META_CLIENT_SECRET: process.env.META_CLIENT_SECRET
        ? "✓ Set"
        : "✗ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "✗ Missing",
    },
    configuration: {
      redirectUri: `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`,
      authUrl: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
        process.env.META_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`
      )}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish&response_type=code`,
    },
    requiredPermissions: [
      "pages_manage_posts",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
    ],
    checklist: {
      "Environment variables set": !!(
        process.env.META_CLIENT_ID && process.env.META_CLIENT_SECRET
      ),
      "NEXTAUTH_URL configured": !!process.env.NEXTAUTH_URL,
      "Redirect URI format correct":
        process.env.NEXTAUTH_URL?.startsWith("https://"),
    },
    instructions: {
      step1: "Go to https://developers.facebook.com/apps",
      step2: "Select your app",
      step3: "Add this redirect URI to Facebook Login settings:",
      redirectUriToAdd: `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`,
      step4: "Make sure app is in Live mode or use Test Users",
      step5: "Request required permissions in App Review",
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
