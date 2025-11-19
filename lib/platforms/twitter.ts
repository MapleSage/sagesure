import axios from "axios";
import crypto from "crypto";

export async function postToTwitter(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    // Create tweet (text only for now - media upload is complex)
    const tweetData: any = {
      text: content,
    };

    if (imageUrl) {
      // For now, just post text - media upload requires downloading and re-uploading
      console.log("Image URL provided but not uploaded:", imageUrl);
    }

    const response = await axios.post(
      "https://api.twitter.com/2/tweets",
      tweetData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      postId: response.data.data.id,
      platform: "twitter",
    };
  } catch (error: any) {
    console.error("Twitter post error:", error.response?.data || error.message);

    let errorMessage = error.message;
    if (error.response?.data) {
      const data = error.response.data;
      errorMessage =
        data.detail ||
        data.errors?.[0]?.message ||
        data.title ||
        JSON.stringify(data);
    }

    // Check for specific errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage =
        "Twitter/X token expired or invalid. Please reconnect your X account.";
    } else if (errorMessage.includes("Unauthorized")) {
      errorMessage =
        "Twitter/X authorization failed. Please reconnect your X account.";
    }

    return {
      success: false,
      error: errorMessage,
      platform: "twitter",
    };
  }
}

export function generatePKCEChallenge() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return { verifier, challenge };
}

export async function getTwitterAuthUrl(
  redirectUri: string,
  codeChallenge: string
) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state: crypto.randomBytes(16).toString("hex"),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params}`;
}

export function getDefaultRedirectUri() {
  return `${process.env.NEXTAUTH_URL}/oauth/twitter/callback`;
}

export async function exchangeTwitterCode(
  code: string,
  redirectUri: string,
  codeVerifier: string
) {
  const response = await axios.post(
    "https://api.twitter.com/2/oauth2/token",
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID!,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );
  return response.data;
}
