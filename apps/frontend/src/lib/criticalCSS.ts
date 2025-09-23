// Critical CSS optimization utilities
export class CriticalCSSManager {
  private static instance: CriticalCSSManager;
  private criticalStyles: Set<string> = new Set();

  private constructor() {}

  static getInstance(): CriticalCSSManager {
    if (!CriticalCSSManager.instance) {
      CriticalCSSManager.instance = new CriticalCSSManager();
    }
    return CriticalCSSManager.instance;
  }

  // Add critical CSS for above-the-fold content
  addCriticalCSS(css: string): void {
    this.criticalStyles.add(css);
  }

  // Get all critical CSS
  getCriticalCSS(): string {
    return Array.from(this.criticalStyles).join('\n');
  }

  // Preload non-critical CSS
  preloadCSS(href: string): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  // Load CSS asynchronously
  loadCSSAsync(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      document.head.appendChild(link);
    });
  }

  // Remove unused CSS (basic implementation)
  removeUnusedCSS(): void {
    if (typeof document === 'undefined') return;

    const stylesheets = Array.from(document.styleSheets);
    const usedSelectors = new Set<string>();

    // Collect all used selectors
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const classes = element.className;
      if (typeof classes === 'string') {
        classes.split(' ').forEach(cls => {
          if (cls.trim()) {
            usedSelectors.add(`.${cls.trim()}`);
          }
        });
      }
    });

    // This is a simplified implementation
    // In production, you'd want to use a more sophisticated tool like PurgeCSS
    console.log('Used selectors:', usedSelectors.size);
  }
}

// Critical CSS for mobile-first layout
export const CRITICAL_CSS = `
  /* Critical CSS for above-the-fold content */
  
  /* Reset and base styles */
  * {
    box-sizing: border-box;
  }
  
  html {
    font-family: var(--font-bai-jamjuree), system-ui, -apple-system, sans-serif;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background-color: #ffffff;
    color: #1f2937;
  }
  
  /* Mobile-first navigation */
  .mobile-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background-color: #f28362;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
  }
  
  .mobile-nav-toggle {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: white;
    cursor: pointer;
  }
  
  /* Main content area */
  .main-content {
    padding-top: 64px;
    min-height: 100vh;
  }
  
  /* Loading states */
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #f28362;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Form elements */
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #f28362;
    box-shadow: 0 0 0 3px rgba(242, 131, 98, 0.1);
  }
  
  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px; /* Touch target */
  }
  
  .btn-primary {
    background-color: #f28362;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #e5744a;
  }
  
  /* Responsive utilities */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Mobile-first responsive grid */
  .grid {
    display: grid;
    gap: 1rem;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 768px) {
    .md\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    .lg\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`;

// Hook for managing critical CSS
export function useCriticalCSS() {
  const manager = CriticalCSSManager.getInstance();

  return {
    addCriticalCSS: (css: string) => manager.addCriticalCSS(css),
    getCriticalCSS: () => manager.getCriticalCSS(),
    preloadCSS: (href: string) => manager.preloadCSS(href),
    loadCSSAsync: (href: string) => manager.loadCSSAsync(href),
    removeUnusedCSS: () => manager.removeUnusedCSS()
  };
}