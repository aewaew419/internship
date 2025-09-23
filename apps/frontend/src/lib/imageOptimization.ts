"use client";

export interface ImageOptimizationOptions {
  quality?: number;
  format?: "webp" | "jpeg" | "png";
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: string;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
}

export interface ResponsiveImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
  wide?: number;
}

export class ImageOptimizationService {
  private static readonly CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || "";
  private static readonly DEFAULT_QUALITY = 75;
  private static readonly MOBILE_QUALITY = 60;

  /**
   * Generate optimized image URL for different screen sizes
   */
  static generateResponsiveUrl(
    src: string,
    sizes: ResponsiveImageSizes,
    options: ImageOptimizationOptions = {}
  ): string {
    const { quality = this.DEFAULT_QUALITY, format = "webp" } = options;
    
    // If it's already an optimized URL or external URL, return as is
    if (src.startsWith("http") || src.includes("/_next/image")) {
      return src;
    }

    // Generate Next.js optimized image URL
    const params = new URLSearchParams({
      url: src,
      w: sizes.mobile.toString(),
      q: quality.toString(),
    });

    return `/_next/image?${params.toString()}`;
  }

  /**
   * Generate srcSet for responsive images
   */
  static generateSrcSet(
    src: string,
    sizes: ResponsiveImageSizes,
    options: ImageOptimizationOptions = {}
  ): string {
    const { quality = this.DEFAULT_QUALITY } = options;
    
    const srcSetEntries: string[] = [];

    // Mobile
    srcSetEntries.push(
      `${this.generateOptimizedUrl(src, { 
        ...options, 
        width: sizes.mobile, 
        quality: this.MOBILE_QUALITY 
      })} ${sizes.mobile}w`
    );

    // Tablet
    srcSetEntries.push(
      `${this.generateOptimizedUrl(src, { 
        ...options, 
        width: sizes.tablet, 
        quality 
      })} ${sizes.tablet}w`
    );

    // Desktop
    srcSetEntries.push(
      `${this.generateOptimizedUrl(src, { 
        ...options, 
        width: sizes.desktop, 
        quality 
      })} ${sizes.desktop}w`
    );

    // Wide screen (optional)
    if (sizes.wide) {
      srcSetEntries.push(
        `${this.generateOptimizedUrl(src, { 
          ...options, 
          width: sizes.wide, 
          quality 
        })} ${sizes.wide}w`
      );
    }

    return srcSetEntries.join(", ");
  }

  /**
   * Generate optimized image URL with parameters
   */
  static generateOptimizedUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const {
      quality = this.DEFAULT_QUALITY,
      width,
      height,
      format,
      fit = "cover",
    } = options;

    // If it's already an optimized URL or external URL, return as is
    if (src.startsWith("http") || src.includes("/_next/image")) {
      return src;
    }

    const params = new URLSearchParams({
      url: src,
      q: quality.toString(),
    });

    if (width) params.set("w", width.toString());
    if (height) params.set("h", height.toString());

    return `/_next/image?${params.toString()}`;
  }

  /**
   * Generate sizes attribute for responsive images
   */
  static generateSizesAttribute(
    sizes: ResponsiveImageSizes,
    customBreakpoints?: { mobile?: number; tablet?: number; desktop?: number }
  ): string {
    const breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1280,
      ...customBreakpoints,
    };

    const sizesArray: string[] = [];

    // Mobile first approach
    sizesArray.push(`(max-width: ${breakpoints.mobile}px) ${sizes.mobile}px`);
    sizesArray.push(`(max-width: ${breakpoints.tablet}px) ${sizes.tablet}px`);
    sizesArray.push(`(max-width: ${breakpoints.desktop}px) ${sizes.desktop}px`);
    
    if (sizes.wide) {
      sizesArray.push(`${sizes.wide}px`);
    } else {
      sizesArray.push(`${sizes.desktop}px`);
    }

    return sizesArray.join(", ");
  }

  /**
   * Get optimal image quality based on device and connection
   */
  static getOptimalQuality(): number {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check connection quality (if available)
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && 
      (connection.effectiveType === "slow-2g" || 
       connection.effectiveType === "2g" ||
       connection.saveData);

    if (isSlowConnection) {
      return 40; // Very low quality for slow connections
    } else if (isMobile) {
      return this.MOBILE_QUALITY; // Medium quality for mobile
    } else {
      return this.DEFAULT_QUALITY; // High quality for desktop
    }
  }

  /**
   * Preload critical images
   */
  static preloadImage(src: string, options: ImageOptimizationOptions = {}): void {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = this.generateOptimizedUrl(src, options);
    
    // Add responsive preloading
    const sizes = {
      mobile: options.width || 400,
      tablet: options.width || 600,
      desktop: options.width || 800,
    };
    
    link.imageSrcset = this.generateSrcSet(src, sizes, options);
    link.imageSizes = this.generateSizesAttribute(sizes);
    
    document.head.appendChild(link);
  }

  /**
   * Lazy load images with intersection observer
   */
  static setupLazyLoading(): void {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;
            
            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
            }
            
            if (srcset) {
              img.srcset = srcset;
              img.removeAttribute("data-srcset");
            }
            
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Convert image to WebP format (client-side)
   */
  static async convertToWebP(
    file: File,
    quality: number = 0.8
  ): Promise<File | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(webpFile);
            } else {
              resolve(null);
            }
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate blur placeholder for images
   */
  static generateBlurPlaceholder(
    src: string,
    width: number = 10,
    height: number = 10
  ): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    canvas.width = width;
    canvas.height = height;
    
    // Create a simple gradient as placeholder
    const gradient = ctx?.createLinearGradient(0, 0, width, height);
    gradient?.addColorStop(0, "#f3f4f6");
    gradient?.addColorStop(1, "#e5e7eb");
    
    if (ctx && gradient) {
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL("image/jpeg", 0.1);
  }

  /**
   * Check if WebP is supported
   */
  static isWebPSupported(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
    });
  }

  /**
   * Get device pixel ratio for high-DPI displays
   */
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  /**
   * Calculate optimal image dimensions for device
   */
  static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }
}