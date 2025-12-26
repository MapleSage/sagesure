/**
 * Azure CDN Integration for Fast Image Delivery
 *
 * This module provides CDN-accelerated URLs for blob storage assets.
 * Azure CDN caches content at edge locations globally for faster delivery.
 *
 * Setup Required (via Azure Portal or CLI):
 * 1. Create Azure CDN Profile (Standard Microsoft or Premium Verizon)
 * 2. Create CDN Endpoint pointing to your blob storage account
 * 3. Add custom domain (optional)
 * 4. Configure caching rules
 *
 * Environment Variables:
 * - AZURE_CDN_ENDPOINT: Your CDN endpoint URL (e.g., https://yourcdn.azureedge.net)
 * - AZURE_CDN_ENABLED: Set to 'true' to enable CDN
 */

const CDN_ENABLED = process.env.AZURE_CDN_ENABLED === 'true';
const CDN_ENDPOINT = process.env.AZURE_CDN_ENDPOINT;
const STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT_NAME;

/**
 * Convert a blob storage URL to a CDN URL
 */
export function getCDNUrl(blobUrl: string): string {
  if (!CDN_ENABLED || !CDN_ENDPOINT) {
    return blobUrl;
  }

  try {
    // Parse the blob URL
    const url = new URL(blobUrl);

    // Check if it's a blob storage URL
    if (url.hostname.includes('.blob.core.windows.net')) {
      // Extract the container and blob path
      const pathParts = url.pathname.split('/');
      const container = pathParts[1];
      const blobPath = pathParts.slice(2).join('/');

      // Construct CDN URL
      const cdnUrl = `${CDN_ENDPOINT}/${container}/${blobPath}`;

      console.log('[CDN] Converted blob URL to CDN:', {
        original: blobUrl,
        cdn: cdnUrl,
      });

      return cdnUrl;
    }

    // Not a blob storage URL, return as-is
    return blobUrl;
  } catch (error) {
    console.error('[CDN] Error converting URL:', error);
    return blobUrl;
  }
}

/**
 * Get CDN URL with cache-busting query parameter
 */
export function getCDNUrlWithCacheBust(blobUrl: string): string {
  const cdnUrl = getCDNUrl(blobUrl);
  const timestamp = Date.now();
  const separator = cdnUrl.includes('?') ? '&' : '?';
  return `${cdnUrl}${separator}v=${timestamp}`;
}

/**
 * Purge content from CDN cache
 * Note: This requires Azure SDK and proper authentication
 */
export async function purgeCDNCache(paths: string[]): Promise<void> {
  if (!CDN_ENABLED) {
    console.log('[CDN] CDN not enabled, skipping cache purge');
    return;
  }

  console.log('[CDN] Cache purge requested for paths:', paths);

  // TODO: Implement actual CDN purge using Azure SDK
  // This would require @azure/arm-cdn package and proper credentials
  // For now, we'll use cache-busting query parameters instead

  console.warn('[CDN] CDN purge not implemented, use cache-busting URLs instead');
}

/**
 * Get optimized image URL with resize parameters
 * Azure CDN can be configured with image optimization rules
 */
export function getOptimizedImageUrl(
  blobUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  const cdnUrl = getCDNUrl(blobUrl);

  if (!options || Object.keys(options).length === 0) {
    return cdnUrl;
  }

  // Build query parameters for image optimization
  // Note: This requires CDN image optimization features to be enabled
  const params = new URLSearchParams();

  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.format) params.set('format', options.format);

  const separator = cdnUrl.includes('?') ? '&' : '?';
  return `${cdnUrl}${separator}${params.toString()}`;
}

/**
 * Check if CDN is enabled and configured
 */
export function isCDNEnabled(): boolean {
  return CDN_ENABLED && !!CDN_ENDPOINT;
}

/**
 * Get CDN status and configuration
 */
export function getCDNStatus() {
  return {
    enabled: CDN_ENABLED,
    endpoint: CDN_ENDPOINT || 'Not configured',
    storageAccount: STORAGE_ACCOUNT || 'Not configured',
  };
}
