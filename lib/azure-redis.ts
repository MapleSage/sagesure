/**
 * Azure Redis Cache Integration for Token Caching
 *
 * This module provides Redis caching for platform tokens and frequently accessed data.
 * Redis cache dramatically reduces Azure Table Storage queries and improves response times.
 *
 * Setup Required:
 * 1. Create Azure Cache for Redis (Basic, Standard, or Premium tier)
 * 2. Get connection string from Azure Portal
 * 3. Install redis package: npm install redis
 *
 * Environment Variables:
 * - AZURE_REDIS_CONNECTION_STRING: Redis connection string
 * - AZURE_REDIS_ENABLED: Set to 'true' to enable Redis caching
 */

import { createClient, RedisClientType } from 'redis';

const REDIS_ENABLED = process.env.AZURE_REDIS_ENABLED === 'true';
const REDIS_CONNECTION_STRING = process.env.AZURE_REDIS_CONNECTION_STRING;

let redisClient: RedisClientType | null = null;
let isConnecting = false;

/**
 * Get or create Redis client
 */
async function getRedisClient(): Promise<RedisClientType | null> {
  if (!REDIS_ENABLED || !REDIS_CONNECTION_STRING) {
    return null;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    return redisClient;
  }

  try {
    isConnecting = true;

    redisClient = createClient({
      url: REDIS_CONNECTION_STRING,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('[Redis] Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Client error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Client connected');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    await redisClient.connect();

    isConnecting = false;
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
    isConnecting = false;
    return null;
  }
}

/**
 * Get cached token data
 */
export async function getCachedToken(
  userId: string,
  platform: string
): Promise<any | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = `token:${userId}:${platform}`;
    const cached = await client.get(key);

    if (cached) {
      console.log(`[Redis] Cache hit for ${key}`);
      return JSON.parse(cached);
    }

    console.log(`[Redis] Cache miss for ${key}`);
    return null;
  } catch (error) {
    console.error('[Redis] Get token error:', error);
    return null;
  }
}

/**
 * Cache token data
 */
export async function cacheToken(
  userId: string,
  platform: string,
  tokenData: any,
  ttl: number = 3600 // 1 hour default
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const key = `token:${userId}:${platform}`;
    await client.setEx(key, ttl, JSON.stringify(tokenData));

    console.log(`[Redis] Cached token for ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Redis] Cache token error:', error);
  }
}

/**
 * Invalidate cached token
 */
export async function invalidateToken(
  userId: string,
  platform: string
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const key = `token:${userId}:${platform}`;
    await client.del(key);

    console.log(`[Redis] Invalidated token for ${key}`);
  } catch (error) {
    console.error('[Redis] Invalidate token error:', error);
  }
}

/**
 * Get cached analytics data
 */
export async function getCachedAnalytics(
  userId: string,
  days: number
): Promise<any | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = `analytics:${userId}:${days}`;
    const cached = await client.get(key);

    if (cached) {
      console.log(`[Redis] Analytics cache hit for ${key}`);
      return JSON.parse(cached);
    }

    console.log(`[Redis] Analytics cache miss for ${key}`);
    return null;
  } catch (error) {
    console.error('[Redis] Get analytics error:', error);
    return null;
  }
}

/**
 * Cache analytics data
 */
export async function cacheAnalytics(
  userId: string,
  days: number,
  analyticsData: any,
  ttl: number = 300 // 5 minutes default
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const key = `analytics:${userId}:${days}`;
    await client.setEx(key, ttl, JSON.stringify(analyticsData));

    console.log(`[Redis] Cached analytics for ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Redis] Cache analytics error:', error);
  }
}

/**
 * Generic cache get
 */
export async function getCache(key: string): Promise<any | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`[Redis] Get cache error for ${key}:`, error);
    return null;
  }
}

/**
 * Generic cache set
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = 3600
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.setEx(key, ttl, JSON.stringify(value));
    console.log(`[Redis] Set cache for ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`[Redis] Set cache error for ${key}:`, error);
  }
}

/**
 * Delete cache entry
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(key);
    console.log(`[Redis] Deleted cache for ${key}`);
  } catch (error) {
    console.error(`[Redis] Delete cache error for ${key}:`, error);
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.flushAll();
    console.log('[Redis] Cleared all cache');
  } catch (error) {
    console.error('[Redis] Clear all cache error:', error);
  }
}

/**
 * Get Redis cache status
 */
export function getRedisStatus() {
  return {
    enabled: REDIS_ENABLED,
    connected: redisClient?.isOpen || false,
    configured: !!REDIS_CONNECTION_STRING,
  };
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed');
  }
}
