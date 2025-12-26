/**
 * Azure Application Insights Integration for Monitoring
 *
 * This module provides comprehensive monitoring, logging, and analytics
 * for the SageSure Social application using Azure Application Insights.
 *
 * Setup Required:
 * 1. Create Application Insights resource in Azure Portal
 * 2. Get Instrumentation Key or Connection String
 * 3. Install package: npm install applicationinsights
 *
 * Environment Variables:
 * - APPLICATIONINSIGHTS_CONNECTION_STRING: App Insights connection string
 * - APP_INSIGHTS_ENABLED: Set to 'true' to enable monitoring
 */

// Only import on server-side
let appInsights: typeof import('applicationinsights') | null = null;
if (typeof window === 'undefined') {
  try {
    appInsights = require('applicationinsights');
  } catch (error) {
    console.warn('[App Insights] Module not available (optional dependency)');
  }
}

const INSIGHTS_ENABLED = process.env.APP_INSIGHTS_ENABLED === 'true';
const CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

let isInitialized = false;

/**
 * Initialize Application Insights
 */
export function initializeAppInsights(): void {
  if (!INSIGHTS_ENABLED || !CONNECTION_STRING || isInitialized || !appInsights) {
    return;
  }

  try {
    appInsights
      .setup(CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start();

    // Set cloud role name
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole;
    appInsights.defaultClient.context.tags[cloudRoleTag] = 'sagesure-social';

    isInitialized = true;
    console.log('[App Insights] Initialized successfully');
  } catch (error) {
    console.error('[App Insights] Initialization failed:', error);
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  name: string,
  properties?: { [key: string]: string },
  measurements?: { [key: string]: number }
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackEvent({
      name,
      properties,
      measurements,
    });
  } catch (error) {
    console.error('[App Insights] Track event error:', error);
  }
}

/**
 * Track social media post
 */
export function trackPost(
  platform: string,
  userId: string,
  success: boolean,
  scheduledFor?: string
): void {
  trackEvent('SocialPost', {
    platform,
    userId,
    status: success ? 'success' : 'failed',
    scheduled: scheduledFor ? 'true' : 'false',
  });
}

/**
 * Track authentication event
 */
export function trackAuth(
  platform: string,
  userId: string,
  action: 'connect' | 'disconnect' | 'refresh'
): void {
  trackEvent('Authentication', {
    platform,
    userId,
    action,
  });
}

/**
 * Track blog sync
 */
export function trackBlogSync(
  userId: string,
  blogCount: number,
  duration: number
): void {
  trackEvent(
    'BlogSync',
    {
      userId,
    },
    {
      blogCount,
      durationMs: duration,
    }
  );
}

/**
 * Track AI generation
 */
export function trackAIGeneration(
  userId: string,
  type: 'social-post' | 'blog-to-social' | 'image',
  success: boolean,
  duration: number
): void {
  trackEvent(
    'AIGeneration',
    {
      userId,
      type,
      status: success ? 'success' : 'failed',
    },
    {
      durationMs: duration,
    }
  );
}

/**
 * Track custom metric
 */
export function trackMetric(
  name: string,
  value: number,
  properties?: { [key: string]: string }
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackMetric({
      name,
      value,
      properties,
    });
  } catch (error) {
    console.error('[App Insights] Track metric error:', error);
  }
}

/**
 * Track API response time
 */
export function trackResponseTime(
  endpoint: string,
  duration: number,
  statusCode: number
): void {
  trackMetric(
    'API Response Time',
    duration,
    {
      endpoint,
      statusCode: String(statusCode),
    }
  );
}

/**
 * Track exception
 */
export function trackException(
  error: Error,
  properties?: { [key: string]: string },
  severityLevel?: number
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackException({
      exception: error,
      properties,
    });
  } catch (err) {
    console.error('[App Insights] Track exception error:', err);
  }
}

/**
 * Track dependency (external API calls)
 */
export function trackDependency(
  name: string,
  data: string,
  duration: number,
  success: boolean,
  dependencyType?: string
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackDependency({
      name,
      data,
      duration,
      success,
      dependencyTypeName: dependencyType || 'HTTP',
    });
  } catch (error) {
    console.error('[App Insights] Track dependency error:', error);
  }
}

/**
 * Track platform API call
 */
export function trackPlatformAPI(
  platform: string,
  action: string,
  duration: number,
  success: boolean
): void {
  trackDependency(
    `${platform}-api`,
    action,
    duration,
    success,
    'Social Platform'
  );
}

/**
 * Track page view
 */
export function trackPageView(
  name: string,
  url?: string,
  duration?: number,
  properties?: { [key: string]: string }
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackPageView({
      name,
      id: url || name,
      url,
      duration,
      properties,
    });
  } catch (error) {
    console.error('[App Insights] Track page view error:', error);
  }
}

/**
 * Track trace (custom log message)
 */
export function trackTrace(
  message: string,
  severityLevel?: number,
  properties?: { [key: string]: string }
): void {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.trackTrace({
      message,
      properties,
    });
  } catch (error) {
    console.error('[App Insights] Track trace error:', error);
  }
}

/**
 * Flush all pending telemetry
 */
export async function flushTelemetry(): Promise<void> {
  if (!isInitialized || !appInsights) return;

  try {
    appInsights.defaultClient.flush();
    console.log('[App Insights] Telemetry flushed');
  } catch (error) {
    console.error('[App Insights] Flush error:', error);
  }
}

/**
 * Get Application Insights status
 */
export function getAppInsightsStatus() {
  return {
    enabled: INSIGHTS_ENABLED,
    initialized: isInitialized,
    configured: !!CONNECTION_STRING,
  };
}

/**
 * Middleware wrapper to track API performance
 */
export function withAppInsights<T>(
  handler: (req: any) => Promise<T>,
  operationName: string
): (req: any) => Promise<T> {
  return async (req: any) => {
    const startTime = Date.now();

    try {
      const result = await handler(req);
      const duration = Date.now() - startTime;

      trackResponseTime(operationName, duration, 200);

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      trackResponseTime(operationName, duration, error.status || 500);
      trackException(error, {
        operation: operationName,
      });

      throw error;
    }
  };
}
