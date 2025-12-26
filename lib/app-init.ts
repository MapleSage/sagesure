/**
 * Application Initialization
 *
 * This module handles initialization of Azure services and other
 * startup tasks when the application loads.
 */

import { initializeAppInsights } from './azure-insights';

// Initialize Application Insights on server startup
if (typeof window === 'undefined') {
  // Server-side only
  initializeAppInsights();
  console.log('[App Init] Azure services initialized');
}

export function initializeApp() {
  // This function can be called from layout.tsx to ensure initialization
  // The actual initialization happens at module load time above
  return true;
}
