import axios from "axios";
import crypto from "crypto";

export async function postToTwitter(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    let mediaId;

    if (imageUrl) {
      // Upload media first
      const mediaResponse = await axios.post(
        "https://upload.twitter.com/1.1/media/upload.json",
        { media_data: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      mediaId = mediaResponse.data.media_id_string;
    }

    // Create tweet
    const tweetData: any = {
      text: content,
    };

    if (mediaId) {
      tweetData.media = { media_ids: [mediaId] };
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
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
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
