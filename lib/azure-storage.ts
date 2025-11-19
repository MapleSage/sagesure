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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  } catch (error: any) {
    if (error.statusCode === 404) return null;
    throw error;
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
