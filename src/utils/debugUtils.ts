
/**
 * Debug utilities for tracking and diagnosing issues in the calendar system
 * Version: 1.0.0
 */

// Store component versions for tracking
interface ComponentVersion {
  name: string;
  version: string;
  lastUpdated: Date;
}

const componentVersions: ComponentVersion[] = [];

/**
 * Register a component version for tracking
 */
export const registerComponentVersion = (name: string, version: string) => {
  const existing = componentVersions.findIndex(c => c.name === name);
  if (existing >= 0) {
    componentVersions[existing] = {
      name,
      version,
      lastUpdated: new Date()
    };
  } else {
    componentVersions.push({
      name,
      version,
      lastUpdated: new Date()
    });
  }
  
  console.log(`LOV_DEBUG_UTILS: Component ${name} registered with version ${version}`);
  return `${name}_${version}_${new Date().toISOString()}`;
};

/**
 * Get all registered component versions
 */
export const getComponentVersions = () => {
  return [...componentVersions];
};

/**
 * Log component versions to console
 */
export const logComponentVersions = () => {
  console.log('LOV_DEBUG_UTILS: Currently registered component versions:');
  componentVersions.forEach(c => {
    console.log(`- ${c.name}: v${c.version} (updated: ${c.lastUpdated.toISOString()})`);
  });
};

/**
 * Force a browser cache refresh by adding a timestamp parameter to the URL
 */
export const forcePageRefresh = () => {
  const timestamp = Date.now();
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('_t', timestamp.toString());
  window.location.href = currentUrl.toString();
};

/**
 * Log important details about the browser environment
 */
export const logEnvironmentInfo = () => {
  console.log('LOV_DEBUG_UTILS: Environment information:');
  console.log(`- User Agent: ${navigator.userAgent}`);
  console.log(`- Window Size: ${window.innerWidth}x${window.innerHeight}`);
  console.log(`- Location: ${window.location.href}`);
  console.log(`- LocalStorage available: ${!!window.localStorage}`);
  console.log(`- Current timestamp: ${new Date().toISOString()}`);
};

// Initialize when this module is loaded
logEnvironmentInfo();

// Export a debug identifier
export const DEBUG_MODULE_VERSION = "1.0.0";
console.log(`LOV_DEBUG_UTILS: Debug utilities loaded, version ${DEBUG_MODULE_VERSION}`);
