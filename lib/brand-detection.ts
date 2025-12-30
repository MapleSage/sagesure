/**
 * Brand Detection Utility
 *
 * Detects which brand a post belongs to based on content analysis
 */

export type Brand = "sagesure" | "maplesage";

export interface BrandConfig {
  id: Brand;
  name: string;
  domain: string;
  linkedInOrgId?: string;
  facebookPageId?: string;
  instagramAccountId?: string;
}

export const BRANDS: Record<Brand, BrandConfig> = {
  sagesure: {
    id: "sagesure",
    name: "SageSure AI",
    domain: "sagesure.io",
    linkedInOrgId: "109911035",
    // Add other social IDs as you connect them
  },
  maplesage: {
    id: "maplesage",
    name: "MapleSage Blog",
    domain: "blog.maplesage.com",
    linkedInOrgId: "13284184",
    // Add other social IDs as you connect them
  },
};

/**
 * Detect brand from post content
 *
 * Checks content for domain references to determine which brand the post belongs to
 */
export function detectBrand(content: string): Brand {
  if (!content) return "sagesure"; // Default

  const lowerContent = content.toLowerCase();

  // Check for MapleSage indicators
  if (
    lowerContent.includes("blog.maplesage.com") ||
    lowerContent.includes("maplesage") ||
    lowerContent.includes("fashion") ||
    lowerContent.includes("retail")
  ) {
    return "maplesage";
  }

  // Check for SageSure indicators
  if (
    lowerContent.includes("sagesure.io") ||
    lowerContent.includes("sagesure") ||
    lowerContent.includes("insurance") ||
    lowerContent.includes("claims")
  ) {
    return "sagesure";
  }

  // Default to SageSure
  return "sagesure";
}

/**
 * Detect brand from blog URL
 */
export function detectBrandFromUrl(url: string): Brand {
  if (!url) return "sagesure";

  if (url.includes("blog.maplesage.com")) {
    return "maplesage";
  }

  return "sagesure";
}

/**
 * Get platform key with brand suffix
 *
 * Examples:
 * - getPlatformKey("linkedin", "sagesure") → "linkedin-sagesure"
 * - getPlatformKey("facebook", "maplesage") → "facebook-maplesage"
 */
export function getPlatformKey(platform: string, brand: Brand): string {
  return `${platform}-${brand}`;
}

/**
 * Parse platform key to extract platform and brand
 *
 * Examples:
 * - parsePlatformKey("linkedin-sagesure") → { platform: "linkedin", brand: "sagesure" }
 * - parsePlatformKey("linkedin") → { platform: "linkedin", brand: null }
 */
export function parsePlatformKey(platformKey: string): { platform: string; brand: Brand | null } {
  const parts = platformKey.split("-");

  if (parts.length === 2 && (parts[1] === "sagesure" || parts[1] === "maplesage")) {
    return {
      platform: parts[0],
      brand: parts[1] as Brand,
    };
  }

  return {
    platform: platformKey,
    brand: null,
  };
}

/**
 * Get brand configuration
 */
export function getBrandConfig(brand: Brand): BrandConfig {
  return BRANDS[brand];
}

/**
 * Get all brand IDs
 */
export function getAllBrands(): Brand[] {
  return Object.keys(BRANDS) as Brand[];
}
