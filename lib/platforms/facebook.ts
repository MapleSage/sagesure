import axios from "axios";

export async function postToFacebook(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    console.log("[Facebook] Starting post to Facebook...");
    console.log("[Facebook] Content length:", content.length);
    console.log("[Facebook] Has image:", !!imageUrl);

    // Get user's pages
    console.log("[Facebook] Fetching user pages...");
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    console.log(
      "[Facebook] Pages found:",
      pagesResponse.data.data?.length || 0
    );

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error(
        "No Facebook pages found. Please create a Facebook Page first."
      );
    }

    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    console.log("[Facebook] Using page:", page.name, "ID:", pageId);

    // Post to page
    const postData: any = {
      message: content,
      access_token: pageAccessToken,
    };

    if (imageUrl) {
      postData.link = imageUrl; // Use 'link' instead of 'url' for better compatibility
    }

    const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    console.log("[Facebook] Posting to endpoint:", endpoint);
    const response = await axios.post(endpoint, postData);

    console.log("[Facebook] Post successful! ID:", response.data.id);

    return {
      success: true,
      postId: response.data.id || response.data.post_id,
      postUrl: `https://facebook.com/${response.data.id}`,
      platform: "facebook",
    };
  } catch (error: any) {
    console.error(
      "[Facebook] Post failed:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to post to Facebook",
      platform: "facebook",
    };
  }
}

export async function postToInstagram(
  accessToken: string,
  content: string,
  imageUrl: string
) {
  try {
    console.log("[Instagram] Starting post to Instagram...");
    console.log("[Instagram] Content length:", content.length);
    console.log("[Instagram] Image URL:", imageUrl);

    // Get Instagram business account
    console.log("[Instagram] Fetching Facebook pages...");
    const accountResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!accountResponse.data.data || accountResponse.data.data.length === 0) {
      throw new Error("No Facebook pages found");
    }

    const page = accountResponse.data.data[0];
    const pageAccessToken = page.access_token;

    console.log("[Instagram] Using page:", page.name);
    console.log("[Instagram] Fetching Instagram business account...");

    const igAccountResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!igAccountResponse.data.instagram_business_account) {
      throw new Error(
        "No Instagram business account linked to this Facebook page. Please link your Instagram business account in Facebook Page settings."
      );
    }

    const igAccountId = igAccountResponse.data.instagram_business_account.id;
    console.log("[Instagram] Instagram account ID:", igAccountId);

    // Create container
    console.log("[Instagram] Creating media container...");
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        image_url: imageUrl,
        caption: content,
        access_token: pageAccessToken,
      }
    );

    const creationId = containerResponse.data.id;
    console.log("[Instagram] Container created:", creationId);

    // Wait a bit for the image to be processed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Publish container
    console.log("[Instagram] Publishing container...");
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: pageAccessToken,
      }
    );

    console.log("[Instagram] Post successful! ID:", publishResponse.data.id);

    return {
      success: true,
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/p/${publishResponse.data.id}`,
      platform: "instagram",
    };
  } catch (error: any) {
    console.error(
      "[Instagram] Post failed:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to post to Instagram",
      platform: "instagram",
    };
  }
}

export async function getFacebookAuthUrl(redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope:
      "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
    response_type: "code",
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

export function getFacebookRedirectUri(baseUrl?: string) {
  const base = (baseUrl || process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");
  return `${base}/oauth/facebook/callback`;
}

export function getDefaultRedirectUri() {
  return getFacebookRedirectUri();
}

export async function exchangeFacebookCode(code: string, redirectUri: string) {
  try {
    console.log("[Facebook] Exchanging code for access token");
    console.log("[Facebook] Redirect URI:", redirectUri);
    console.log("[Facebook] Client ID:", process.env.META_CLIENT_ID);
    console.log("[Facebook] Code:", code?.substring(0, 20) + "...");

    const response = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_CLIENT_ID,
          client_secret: process.env.META_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code,
          grant_type: "authorization_code",
        },
      }
    );

    console.log("[Facebook] Token exchange successful");
    return response.data;
  } catch (error: any) {
    console.error("[Facebook] Token exchange failed:", error.response?.data || error.message);
    throw error;
  }
}
