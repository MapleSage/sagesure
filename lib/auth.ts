// No authentication - use default demo user ID for all operations
export const DEFAULT_USER_ID = "demo-user";

/**
 * Gets the user ID for API operations
 * Since auth is disabled, always returns the default demo user ID
 */
export function getUserId(): string {
  return DEFAULT_USER_ID;
}
