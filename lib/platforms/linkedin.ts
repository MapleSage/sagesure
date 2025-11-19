import axios from "axios";

export async function postToLinkedIn(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    // Get user profile
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const userId = profileResponse.data.sub;

    // Create post using new API
    const postData: any = {
      author: `urn:li:person:${userId}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (imageUrl) {
      // For now, just post text - image upload requires downloading and re-uploading
      // which is complex. User can add images via URL in the post text
      console.log("Image URL provided but not uploaded:", imageUrl);
    }

    const response = await axios.post(
      "https://api.linkedin.com/rest/posts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202401",
        },
      }
    );

    return {
      success: true,
      postId: response.headers["x-restli-id"] || "posted",
      platform: "linkedin",
    };
  } catch (error: any) {
    console.error(
      "LinkedIn post error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      platform: "linkedin",
    };
  }
}

export async function getLinkedInAuthUrl(redirectUri: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "openid profile email w_member_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export function getDefaultRedirectUri() {
  return `${process.env.NEXTAUTH_URL}/oauth/linkedin/callback`;
}

export async function exchangeLinkedInCode(code: string, redirectUri: string) {
  const response = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    null,
    {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    }
  );
  return response.data;
}
