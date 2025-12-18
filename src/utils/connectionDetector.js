/**
 * Connection speed detection utility
 * Detects network connection quality and provides adaptive loading strategies
 */

// Connection quality levels
export const CONNECTION_QUALITY = {
  SLOW: 'slow',      // < 1 Mbps
  MEDIUM: 'medium',  // 1-5 Mbps
  FAST: 'fast'       // > 5 Mbps
};

/**
 * Detect connection quality using Network Information API and fallback methods
 */
export function detectConnectionQuality() {
  // Use Network Information API if available
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink; // Mbps
      
      // Map effectiveType to quality
      if (effectiveType === 'slow-2g' || effectiveType === '2g' || (downlink && downlink < 1)) {
        return CONNECTION_QUALITY.SLOW;
      } else if (effectiveType === '3g' || (downlink && downlink >= 1 && downlink < 5)) {
        return CONNECTION_QUALITY.MEDIUM;
      } else {
        return CONNECTION_QUALITY.FAST;
      }
    }
  }
  
  // Fallback: Try to detect via video loading test
  return CONNECTION_QUALITY.MEDIUM; // Default to medium
}

/**
 * Get connection info for display
 */
export function getConnectionInfo() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink ? `${connection.downlink.toFixed(1)} Mbps` : 'unknown',
        rtt: connection.rtt ? `${connection.rtt}ms` : 'unknown',
        saveData: connection.saveData || false
      };
    }
  }
  
  return {
    effectiveType: 'unknown',
    downlink: 'unknown',
    rtt: 'unknown',
    saveData: false
  };
}

/**
 * Get optimal preload strategy based on connection quality
 */
export function getPreloadStrategy(quality) {
  switch (quality) {
    case CONNECTION_QUALITY.SLOW:
      return {
        initialVideos: 1,           // Only load first video
        preloadType: 'metadata',     // Only metadata, not full video
        backgroundLoad: false,        // Don't load in background
        staggerDelay: 2000,          // Longer delay between loads
        loadNextOnPlay: true         // Load next video only when current is playing
      };
    case CONNECTION_QUALITY.MEDIUM:
      return {
        initialVideos: 2,            // Load first 2 videos
        preloadType: 'auto',         // Full preload but optimized
        backgroundLoad: true,        // Load in background
        staggerDelay: 1000,          // Moderate delay
        loadNextOnPlay: true         // Also load next when playing
      };
    case CONNECTION_QUALITY.FAST:
      return {
        initialVideos: 2,            // Load first 2 videos
        preloadType: 'auto',         // Full preload
        backgroundLoad: true,        // Aggressive background loading
        staggerDelay: 500,           // Short delay
        loadNextOnPlay: false        // Don't need to wait
      };
    default:
      return {
        initialVideos: 1,
        preloadType: 'metadata',
        backgroundLoad: false,
        staggerDelay: 1000,
        loadNextOnPlay: true
      };
  }
}

/**
 * Monitor connection changes
 */
export function onConnectionChange(callback) {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        const quality = detectConnectionQuality();
        callback(quality, getConnectionInfo());
      });
    }
  }
}

