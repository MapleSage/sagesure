export const cognitoConfig = {
  domain: "us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com",
  clientId: "3537esq1en2a1118s8qi88qfvp",
  clientSecret: "1ra15otjjofs6j3oldgk0v46jf8idtr9cvvgktetcidv2t6mdhoh",
};

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL || "https://social.sagesure.io";
}

export function getLoginUrl() {
  const redirectUri = `${getBaseUrl()}/auth/callback`;
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
  });
  return `https://${cognitoConfig.domain}/oauth2/authorize?${params}`;
}

export function getLogoutUrl() {
  const logoutUri = getBaseUrl();
  const params = new URLSearchParams();
  params.append("client_id", cognitoConfig.clientId);
  params.append("logout_uri", logoutUri);
  return `https://${cognitoConfig.domain}/logout?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const credentials = Buffer.from(
    `${cognitoConfig.clientId}:${cognitoConfig.clientSecret}`
  ).toString("base64");

  const response = await fetch(`https://${cognitoConfig.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoConfig.clientId,
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", error);
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

export function getUserFromToken(idToken: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString()
    );
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
    };
  } catch (error) {
    return null;
  }
}
