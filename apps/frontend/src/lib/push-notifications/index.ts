// Cross-browser compatibility modules
export { browserCompatibility, type BrowserInfo, type BrowserFeatures } from './browser-compatibility';
export { featureDetection, type FeatureDetectionResult, type DetectedFeatures } from './feature-detection';
export { polyfillManager, type PolyfillConfig } from './polyfills';
export { compatibilityManager } from './compatibility-layers';
export { serviceWorkerCompatibility } from './service-worker-compatibility';
export { 
  browserNotificationManager,
  type BrowserNotificationHandler 
} from './browser-handlers';

// Main push notification manager (re-export from parent)
export { PushNotificationManager } from '../push-notifications';

// Utility function to initialize all compatibility systems
export async function initializeCrossBrowserCompatibility(): Promise<{
  browserInfo: BrowserInfo;
  detectionResult: FeatureDetectionResult;
  isSupported: boolean;
  enhancementLevel: 'baseline' | 'enhanced' | 'premium';
}> {
  // Initialize polyfills first
  polyfillManager.initialize();
  
  // Initialize compatibility layers
  await compatibilityManager.initialize();
  
  // Initialize service worker compatibility (if in SW context)
  if (typeof self !== 'undefined' && 'ServiceWorkerGlobalScope' in self) {
    serviceWorkerCompatibility.initialize();
  }
  
  // Initialize browser notification manager
  browserNotificationManager.initialize();
  
  // Perform feature detection
  const detectionResult = await featureDetection.detectFeatures();
  const browserInfo = browserCompatibility.getBrowserInfo();
  
  // Determine enhancement level
  const strategy = featureDetection.getProgressiveEnhancementStrategy();
  let enhancementLevel: 'baseline' | 'enhanced' | 'premium' = 'baseline';
  
  if (strategy.premium.length > 0 && detectionResult.isSupported) {
    enhancementLevel = 'premium';
  } else if (strategy.enhanced.length > 0) {
    enhancementLevel = 'enhanced';
  }
  
  console.log('Cross-browser compatibility initialized:', {
    browser: `${browserInfo.name} ${browserInfo.version}`,
    supported: detectionResult.isSupported,
    level: enhancementLevel,
    limitations: detectionResult.limitations.length
  });
  
  return {
    browserInfo,
    detectionResult,
    isSupported: detectionResult.isSupported,
    enhancementLevel
  };
}