import axios from "axios";

export async function postToFacebook(
  accessToken: string,
  content: string,
  imageUrl?: string
) {
  try {
    // Get user's pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error("No Facebook pages found");
    }

    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // Post to page
    const postData: any = {
      message: content,
      access_token: pageAccessToken,
    };

    if (imageUrl) {
      postData.url = imageUrl;
    }

    const endpoint = imageUrl
      ? `https://graph.facebook.com/v18.0/${pageId}/photos`
      : `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const response = await axios.post(endpoint, postData);

    return {
      success: true,
      postId: response.data.id || response.data.post_id,
      platform: "facebook",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
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
    // Get Instagram business account
    const accountResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    const page = accountResponse.data.data[0];
    const pageAccessToken = page.access_token;

    const igAccountResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const igAccountId = igAccountResponse.data.instagram_business_account.id;

    // Create container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        image_url: imageUrl,
        caption: content,
        access_token: pageAccessToken,
      }
    );

    const creationId = containerResponse.data.id;

    // Publish container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: pageAccessToken,
      }
    );

    return {
      success: true,
      postId: publishResponse.data.id,
      platform: "instagram",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
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

export async function exchangeFacebookCode(code: string, redirectUri: string) {
  const response = await axios.get(
    "https://graph.facebook.com/v18.0/oauth/access_token",
    {
      params: {
        client_id: process.env.META_CLIENT_ID,
        client_secret: process.env.META_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    }
  );
  return response.data;
}
