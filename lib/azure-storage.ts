import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import { getCachedToken, cacheToken, invalidateToken } from "./azure-redis";
import { getCDNUrl } from "./azure-cdn";
import { trackEvent, trackException } from "./azure-insights";

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

const blogsTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "blogs",
  credential
);

const eventsTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "events",
  credential
);

const settingsTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "settings",
  credential
);

const mediaTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "media",
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
  try {
    await blogsTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }
  try {
    await eventsTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }
  try {
    await settingsTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }
  try {
    await mediaTable.createTable();
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
  platformContent?: Record<string, string>; // Platform-specific content
  imageUrl?: string;
  mediaUrls?: Record<string, string>; // Platform-specific media
}) {
  const postId = Date.now().toString();
  const entity = {
    partitionKey: post.userId,
    rowKey: postId,
    content: post.content,
    platforms: JSON.stringify(post.platforms),
    platformContent: JSON.stringify(post.platformContent || {}),
    scheduledFor: post.scheduledFor || "",
    status: post.status,
    imageUrl: post.imageUrl || "",
    mediaUrls: JSON.stringify(post.mediaUrls || {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await postsTable.createEntity(entity);
  return { ...post, id: postId };
}

export async function updatePost(userId: string, postId: string, updates: any) {
  const entity = await postsTable.getEntity(userId, postId);
  const updated = {
    ...entity,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await postsTable.updateEntity(updated, "Replace");
  return updated;
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
      platformContent: entity.platformContent ? JSON.parse(entity.platformContent as string) : {},
      scheduledFor: entity.scheduledFor,
      status: entity.status,
      imageUrl: entity.imageUrl || "",
      mediaUrls: entity.mediaUrls ? JSON.parse(entity.mediaUrls as string) : {},
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
    pageId?: string;
    pageName?: string;
    instagramAccountId?: string;
    organizationId?: string;
    organizationName?: string;
    brand?: string;
  }
) {
  const entity = {
    partitionKey: userId,
    rowKey: platform,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken || "",
    expiresAt: token.expiresAt || 0,
    pageId: token.pageId || "",
    pageName: token.pageName || "",
    instagramAccountId: token.instagramAccountId || "",
    organizationId: token.organizationId || "",
    organizationName: token.organizationName || "",
    brand: token.brand || "",
    updatedAt: new Date().toISOString(),
  };
  await tokensTable.upsertEntity(entity);

  // Invalidate cache to ensure fresh data on next read
  await invalidateToken(userId, platform);

  // Track token save event
  trackEvent('TokenSaved', {
    userId,
    platform,
    hasRefreshToken: token.refreshToken ? 'true' : 'false',
  });
}

export async function getToken(userId: string, platform: string) {
  try {
    // Try Redis cache first
    const cached = await getCachedToken(userId, platform);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from Azure Table Storage
    const entity = await tokensTable.getEntity(userId, platform);
    const tokenData = {
      accessToken: entity.accessToken as string,
      refreshToken: entity.refreshToken as string,
      expiresAt: entity.expiresAt as number,
      pageId: entity.pageId as string,
      pageName: entity.pageName as string,
      instagramAccountId: entity.instagramAccountId as string,
      organizationId: entity.organizationId as string,
      organizationName: entity.organizationName as string,
    };

    // Cache for 1 hour (3600 seconds)
    await cacheToken(userId, platform, tokenData, 3600);

    return tokenData;
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    trackException(error as Error, { operation: 'getToken', userId, platform });
    throw error;
  }
}

export async function getUserTokens(userId: string) {
  const tokens = [];
  const entities = tokensTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    tokens.push({
      platform: entity.rowKey as string,
      accessToken: entity.accessToken as string,
      refreshToken: entity.refreshToken as string,
      expiresAt: entity.expiresAt as number,
      pageId: entity.pageId as string,
      pageName: entity.pageName as string,
      organizationId: entity.organizationId as string,
      organizationName: entity.organizationName as string,
      instagramAccountId: entity.instagramAccountId as string,
      brand: entity.brand as string,
    });
  }

  return tokens;
}

export async function deleteToken(userId: string, platform: string) {
  try {
    await tokensTable.deleteEntity(userId, platform);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}

// Blog operations
export async function saveBlog(blog: {
  userId: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  tags?: string[];
  source?: string; // 'user', 'rss', 'hubspot'
  blogName?: string; // 'SageSure AI', 'MapleSage Blog'
  blogBrand?: string; // 'sagesure', 'maplesage'
  link?: string; // Original RSS/HubSpot URL
  author?: string;
  pubDate?: string; // Original publication date
  rssId?: string; // Original RSS item ID for deduplication
  featuredImageUrl?: string; // Featured image stored in Vercel Blob
}) {
  const blogId = Date.now().toString();
  const entity = {
    partitionKey: blog.userId,
    rowKey: blogId,
    title: blog.title,
    content: blog.content,
    excerpt: blog.excerpt || "",
    status: blog.status,
    tags: JSON.stringify(blog.tags || []),
    source: blog.source || "user",
    blogName: blog.blogName || "",
    blogBrand: blog.blogBrand || "",
    link: blog.link || "",
    author: blog.author || "",
    pubDate: blog.pubDate || new Date().toISOString(),
    rssId: blog.rssId || "",
    featuredImageUrl: blog.featuredImageUrl || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await blogsTable.createEntity(entity);
  return { ...blog, id: blogId };
}

export async function getUserBlogs(userId: string) {
  const blogs = [];
  const entities = blogsTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    blogs.push({
      id: entity.rowKey,
      userId: entity.partitionKey,
      title: entity.title,
      content: entity.content,
      excerpt: entity.excerpt,
      status: entity.status,
      tags: JSON.parse(entity.tags as string),
      source: entity.source || "user",
      blogName: entity.blogName || "",
      blogBrand: entity.blogBrand || "",
      link: entity.link || "",
      author: entity.author || "",
      pubDate: entity.pubDate,
      rssId: entity.rssId || "",
      featuredImageUrl: entity.featuredImageUrl || "",
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  return blogs.sort(
    (a, b) =>
      new Date(b.createdAt as string).getTime() -
      new Date(a.createdAt as string).getTime()
  );
}

export async function getBlog(userId: string, blogId: string) {
  try {
    const entity = await blogsTable.getEntity(userId, blogId);
    return {
      id: entity.rowKey,
      userId: entity.partitionKey,
      title: entity.title,
      content: entity.content,
      excerpt: entity.excerpt,
      status: entity.status,
      tags: JSON.parse(entity.tags as string),
      source: entity.source || "user",
      blogName: entity.blogName || "",
      blogBrand: entity.blogBrand || "",
      link: entity.link || "",
      author: entity.author || "",
      pubDate: entity.pubDate,
      rssId: entity.rssId || "",
      featuredImageUrl: entity.featuredImageUrl || "",
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

// Check if RSS blog post already exists by rssId
export async function getBlogByRssId(userId: string, rssId: string) {
  try {
    const blogs = [];
    const entities = blogsTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${userId}' and rssId eq '${rssId}'` },
    });

    for await (const entity of entities) {
      blogs.push({
        id: entity.rowKey,
        userId: entity.partitionKey,
        title: entity.title,
        rssId: entity.rssId,
      });
    }

    return blogs.length > 0 ? blogs[0] : null;
  } catch (error: any) {
    console.error("[getBlogByRssId] Error:", error);
    return null;
  }
}

export async function updateBlog(userId: string, blogId: string, updates: any) {
  const entity = await blogsTable.getEntity(userId, blogId);
  const updated = {
    ...entity,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await blogsTable.updateEntity(updated, "Replace");
  return updated;
}

export async function deleteBlog(userId: string, blogId: string) {
  try {
    await blogsTable.deleteEntity(userId, blogId);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}

// Settings operations
export async function saveSettings(
  userId: string,
  settings: {
    companyName?: string;
    brandIdentity?: string;
    customerProfile?: string;
  }
) {
  const entity = {
    partitionKey: userId,
    rowKey: "settings",
    companyName: settings.companyName || "",
    brandIdentity: settings.brandIdentity || "",
    customerProfile: settings.customerProfile || "",
    updatedAt: new Date().toISOString(),
  };
  await settingsTable.upsertEntity(entity);
  return settings;
}

export async function getSettings(userId: string) {
  try {
    const entity = await settingsTable.getEntity(userId, "settings");
    return {
      companyName: entity.companyName as string,
      brandIdentity: entity.brandIdentity as string,
      customerProfile: entity.customerProfile as string,
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

// Calendar Events operations
export async function saveEvent(event: {
  userId: string;
  title: string;
  date: string;
  description?: string;
  category?: string;
}) {
  const eventId = Date.now().toString();
  const entity = {
    partitionKey: event.userId,
    rowKey: eventId,
    title: event.title,
    date: event.date,
    description: event.description || "",
    category: event.category || "",
    createdAt: new Date().toISOString(),
  };
  await eventsTable.createEntity(entity);
  return { ...event, id: eventId };
}

export async function getUserEvents(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const events = [];
  const entities = eventsTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    const event = {
      id: entity.rowKey,
      userId: entity.partitionKey,
      title: entity.title,
      date: entity.date,
      description: entity.description,
      category: entity.category,
      createdAt: entity.createdAt,
    };

    // Filter by date range if provided
    if (startDate && endDate) {
      const eventDate = new Date(entity.date as string);
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (eventDate >= start && eventDate <= end) {
        events.push(event);
      }
    } else {
      events.push(event);
    }
  }

  return events.sort(
    (a, b) =>
      new Date(a.date as string).getTime() -
      new Date(b.date as string).getTime()
  );
}

export async function deleteEvent(userId: string, eventId: string) {
  try {
    await eventsTable.deleteEntity(userId, eventId);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}

// Media operations
export async function saveMedia(media: {
  userId: string;
  url: string;
  thumbnail?: string;
  filename: string;
  type: "image" | "video";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  tags?: string[];
  description?: string;
  source: "upload" | "url" | "google-drive" | "dropbox" | "onedrive" | "ai";
}) {
  // Ensure media table exists - try to create it first
  console.log("[saveMedia] Ensuring media table exists...");
  try {
    await mediaTable.createTable();
    console.log("[saveMedia] Media table created successfully");
  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log("[saveMedia] Media table already exists");
    } else {
      console.error("[saveMedia] Error creating media table:", error);
      throw error;
    }
  }

  const mediaId = Date.now().toString();
  const entity = {
    partitionKey: media.userId,
    rowKey: mediaId,
    url: media.url,
    thumbnail: media.thumbnail || media.url,
    filename: media.filename,
    type: media.type,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width || 0,
    height: media.height || 0,
    folder: media.folder || "",
    tags: JSON.stringify(media.tags || []),
    description: media.description || "",
    source: media.source,
    usedInPosts: JSON.stringify([]),
    clicks: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("[saveMedia] Creating entity in media table...");
  try {
    await mediaTable.createEntity(entity);
    console.log("[saveMedia] Entity created successfully");
  } catch (error: any) {
    console.error("[saveMedia] Error creating entity:", error);
    throw error;
  }

  return { ...media, id: mediaId };
}

export async function getUserMedia(
  userId: string,
  type?: "image" | "video",
  folder?: string,
  limit?: number
) {
  const media = [];
  let filter = `PartitionKey eq '${userId}'`;

  if (type) {
    filter += ` and type eq '${type}'`;
  }
  if (folder) {
    filter += ` and folder eq '${folder}'`;
  }

  const entities = mediaTable.listEntities({
    queryOptions: { filter },
  });

  let count = 0;
  for await (const entity of entities) {
    if (limit && count >= limit) break;

    media.push({
      id: entity.rowKey,
      userId: entity.partitionKey,
      url: entity.url,
      thumbnail: entity.thumbnail,
      filename: entity.filename,
      type: entity.type,
      mimeType: entity.mimeType,
      size: entity.size,
      width: entity.width,
      height: entity.height,
      folder: entity.folder,
      tags: JSON.parse(entity.tags as string),
      description: entity.description,
      source: entity.source,
      usedInPosts: JSON.parse(entity.usedInPosts as string),
      clicks: entity.clicks,
      views: entity.views,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    count++;
  }

  return media.sort(
    (a, b) =>
      new Date(b.createdAt as string).getTime() -
      new Date(a.createdAt as string).getTime()
  );
}

export async function getMedia(userId: string, mediaId: string) {
  try {
    const entity = await mediaTable.getEntity(userId, mediaId);
    return {
      id: entity.rowKey,
      userId: entity.partitionKey,
      url: entity.url,
      thumbnail: entity.thumbnail,
      filename: entity.filename,
      type: entity.type,
      mimeType: entity.mimeType,
      size: entity.size,
      width: entity.width,
      height: entity.height,
      folder: entity.folder,
      tags: JSON.parse(entity.tags as string),
      description: entity.description,
      source: entity.source,
      usedInPosts: JSON.parse(entity.usedInPosts as string),
      clicks: entity.clicks,
      views: entity.views,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function updateMedia(
  userId: string,
  mediaId: string,
  updates: any
) {
  const entity = await mediaTable.getEntity(userId, mediaId);
  const updated = {
    ...entity,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await mediaTable.updateEntity(updated, "Replace");
  return updated;
}

export async function deleteMedia(userId: string, mediaId: string) {
  try {
    await mediaTable.deleteEntity(userId, mediaId);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}

export async function searchMedia(userId: string, query: string) {
  const media = [];
  const entities = mediaTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  const lowerQuery = query.toLowerCase();

  for await (const entity of entities) {
    const filename = (entity.filename as string).toLowerCase();
    const description = ((entity.description as string) || "").toLowerCase();
    const tags = JSON.parse(entity.tags as string);
    const tagsStr = tags.join(" ").toLowerCase();

    if (
      filename.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      tagsStr.includes(lowerQuery)
    ) {
      media.push({
        id: entity.rowKey,
        userId: entity.partitionKey,
        url: entity.url,
        thumbnail: entity.thumbnail,
        filename: entity.filename,
        type: entity.type,
        mimeType: entity.mimeType,
        size: entity.size,
        width: entity.width,
        height: entity.height,
        folder: entity.folder,
        tags,
        description: entity.description,
        source: entity.source,
        createdAt: entity.createdAt,
      });
    }
  }

  return media;
}

export async function getUserFolders(userId: string) {
  const folders = new Map<string, number>();
  const entities = mediaTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    const folder = (entity.folder as string) || "Uncategorized";
    folders.set(folder, (folders.get(folder) || 0) + 1);
  }

  return Array.from(folders.entries()).map(([name, count]) => ({
    name,
    count,
  }));
}

// OAuth credentials operations
export async function saveOAuthCredentials(
  userId: string,
  platformBrandKey: string, // e.g., "linkedin-sagesure", "facebook-maplesage"
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
  }
) {
  // Ensure settings table exists
  try {
    await settingsTable.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) {
      console.error("[saveOAuthCredentials] Error creating table:", error);
    }
  }

  const entity = {
    partitionKey: userId,
    rowKey: platformBrandKey,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri: credentials.redirectUri || "",
    updatedAt: new Date().toISOString(),
  };
  await settingsTable.upsertEntity(entity);
  return credentials;
}

export async function getOAuthCredentials(userId: string, platformBrandKey: string) {
  try {
    const entity = await settingsTable.getEntity(userId, platformBrandKey);
    return {
      clientId: entity.clientId as string,
      clientSecret: entity.clientSecret as string,
      redirectUri: (entity.redirectUri as string) || "",
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getUserOAuthCredentials(userId: string) {
  const credentials = [];
  const entities = settingsTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  });

  for await (const entity of entities) {
    // Skip the "settings" rowKey which contains user settings
    if (entity.rowKey === "settings") continue;

    credentials.push({
      platformBrandKey: entity.rowKey as string,
      clientId: entity.clientId as string,
      clientSecret: entity.clientSecret as string,
      redirectUri: (entity.redirectUri as string) || "",
    });
  }

  return credentials;
}

export async function deleteOAuthCredentials(userId: string, platformBrandKey: string) {
  try {
    await settingsTable.deleteEntity(userId, platformBrandKey);
  } catch (error: any) {
    if (error.statusCode !== 404) throw error;
  }
}
