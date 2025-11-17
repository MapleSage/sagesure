import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

// Parse connection string to get account name and key
function parseConnectionString(connStr: string) {
  const parts = connStr.split(";");
  const accountName = parts
    .find((p) => p.startsWith("AccountName="))
    ?.split("=")[1];
  const accountKey = parts
    .find((p) => p.startsWith("AccountKey="))
    ?.split("=")[1];
  return { accountName, accountKey };
}

const { accountName, accountKey } = parseConnectionString(connectionString);
const credential = new AzureNamedKeyCredential(accountName!, accountKey!);

// Table clients
const postsTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "posts",
  credential
);

const tokensTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "tokens",
  credential
);

// Initialize tables
export async function initializeTables() {
  try {
    await postsTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error; // 409 = already exists
  }
  try {
    await tokensTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }
}

// Posts operations
export async function savePost(post: {
  userId: string;
  content: string;
  platforms: string[];
  scheduledFor?: string;
  status: string;
}) {
  const postId = Date.now().toString();
  const entity = {
    partitionKey: post.userId,
    rowKey: postId,
    content: post.content,
    platforms: JSON.stringify(post.platforms),
    scheduledFor: post.scheduledFor || "",
    status: post.status,
    createdAt: new Date().toISOString(),
  };
  await postsTable.createEntity(entity);
  return { ...post, id: postId };
}

export async function getUserPosts(userId: string) {
  const posts = [];
  const entities = postsTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    posts.push({
      id: entity.rowKey,
      userId: entity.partitionKey,
      content: entity.content,
      platforms: JSON.parse(entity.platforms as string),
      scheduledFor: entity.scheduledFor,
      status: entity.status,
      createdAt: entity.createdAt,
    });
  }

  return posts;
}

// Token operations
export async function saveToken(
  userId: string,
  platform: string,
  token: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }
) {
  const entity = {
    partitionKey: userId,
    rowKey: platform,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken || "",
    expiresAt: token.expiresAt || 0,
    updatedAt: new Date().toISOString(),
  };
  await tokensTable.upsertEntity(entity);
}

export async function getToken(userId: string, platform: string) {
  try {
    const entity = await tokensTable.getEntity(userId, platform);
    return {
      accessToken: entity.accessToken as string,
      refreshToken: entity.refreshToken as string,
      expiresAt: entity.expiresAt as number,
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function deleteToken(userId: string, platform: string) {
  try {
    await tokensTable.deleteEntity(userId, platform);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}
