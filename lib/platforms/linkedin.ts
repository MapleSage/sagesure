import axios from "axios";

export async function postToLinkedIn(
  accessToken: string,
  content: string,
  imageUrl?: string,
  organizationId?: string
) {
  try {
    console.log("[LinkedIn] Starting post to LinkedIn...");
    console.log("[LinkedIn] Content length:", content.length);
    console.log("[LinkedIn] Organization ID:", organizationId);

    let author: string;

    if (organizationId) {
      // Post to organization page
      author = `urn:li:organization:${organizationId}`;
      console.log("[LinkedIn] Posting to organization:", author);
    } else {
      // Post to personal profile (fallback)
      console.log("[LinkedIn] Fetching user profile...");
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userId = profileResponse.data.sub;
      author = `urn:li:person:${userId}`;
      console.log("[LinkedIn] Posting to personal profile:", author);
    }

    // Create post using new API
    const postData: any = {
      author: author,
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

    // Add image if provided
    if (imageUrl) {
      console.log("[LinkedIn] Adding image to post:", imageUrl);

      try {
        // Download the image
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        const contentType = imageResponse.headers["content-type"] || "image/jpeg";

        console.log("[LinkedIn] Image downloaded, size:", imageBuffer.length, "bytes");
        console.log("[LinkedIn] Content type:", contentType);

        // Step 1: Initialize upload
        const initResponse = await axios.post(
          "https://api.linkedin.com/rest/images?action=initializeUpload",
          {
            initializeUploadRequest: {
              owner: author,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
              "LinkedIn-Version": "202411",
            },
          }
        );

        const uploadUrl = initResponse.data.value.uploadUrl;
        const imageUrn = initResponse.data.value.image;
        console.log("[LinkedIn] Upload initialized, URN:", imageUrn);

        // Step 2: Upload the image
        await axios.put(uploadUrl, imageBuffer, {
          headers: {
            "Content-Type": contentType,
            Authorization: `Bearer ${accessToken}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        console.log("[LinkedIn] Image uploaded successfully");

        // Step 3: Add image to post data
        postData.content = {
          media: {
            id: imageUrn,
          },
        };

        console.log("[LinkedIn] Image added to post data");
      } catch (imageError: any) {
        console.error("[LinkedIn] Image upload failed:", imageError.response?.data || imageError.message);
        console.error("[LinkedIn] Continuing without image...");
        // Continue posting without image rather than failing completely
      }
    }

    console.log("[LinkedIn] Posting to LinkedIn API...");
    console.log("[LinkedIn] Post data:", JSON.stringify(postData, null, 2));

    const response = await axios.post(
      "https://api.linkedin.com/rest/posts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202411",
        },
      }
    );

    const postId = response.headers["x-restli-id"] || response.data?.id || "posted";
    console.log("[LinkedIn] Post successful!");
    console.log("[LinkedIn] Response status:", response.status);
    console.log("[LinkedIn] Post ID:", postId);
    console.log("[LinkedIn] Response headers:", response.headers);
    console.log("[LinkedIn] Response data:", JSON.stringify(response.data, null, 2));

    return {
      success: true,
      postId: postId,
      platform: "linkedin",
    };
  } catch (error: any) {
    console.error("[LinkedIn] Post failed!");
    console.error("[LinkedIn] Error status:", error.response?.status);
    console.error("[LinkedIn] Error headers:", error.response?.headers);
    console.error("[LinkedIn] Error data:", JSON.stringify(error.response?.data, null, 2));
    console.error("[LinkedIn] Error message:", error.message);

    let errorMessage = error.message;
    if (error.response?.data) {
      const data = error.response.data;
      errorMessage =
        data.message ||
        data.error_description ||
        data.error ||
        JSON.stringify(data);
    }

    // Check for specific errors
    if (errorMessage.includes("version") || errorMessage.includes("20240101")) {
      errorMessage =
        "LinkedIn API version error. Please reconnect your LinkedIn account.";
    } else if (error.response?.status === 401) {
      errorMessage =
        "LinkedIn token expired. Please reconnect your LinkedIn account.";
    } else if (error.response?.status === 403) {
      errorMessage =
        "LinkedIn permission error. Please reconnect your LinkedIn account with the correct permissions (w_member_social).";
    }

    return {
      success: false,
      error: errorMessage,
      platform: "linkedin",
    };
  }
}

export async function getLinkedInAuthUrl(
  redirectUri: string,
  clientId?: string
) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId || process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "openid profile email w_member_social w_organization_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export function getDefaultRedirectUri() {
  return `${process.env.NEXTAUTH_URL}/oauth/linkedin/callback`;
}

export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string,
  clientId?: string,
  clientSecret?: string
) {
  const response = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    null,
    {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId || process.env.LINKEDIN_CLIENT_ID,
        client_secret: clientSecret || process.env.LINKEDIN_CLIENT_SECRET,
      },
    }
  );
  return response.data;
}
