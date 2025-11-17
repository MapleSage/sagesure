import axios from "axios";

export async function postToLinkedIn(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    // Get user profile
    const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = profileResponse.data.id;

    // Create post
    const postData: any = {
      author: `urn:li:person:${userId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    if (imageUrl) {
      // Upload image first
      const uploadResponse = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${userId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const uploadUrl =
        uploadResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      const asset = uploadResponse.data.value.asset;

      // Upload image to LinkedIn
      await axios.put(uploadUrl, imageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          media: asset,
        },
      ];
    }

    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      postId: response.data.id,
      platform: "linkedin",
    };
  } catch (error: any) {
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
    scope: "r_liteprofile w_member_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
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
