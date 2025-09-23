"use client";

interface PlaceholderOptions {
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export class PlaceholderGenerator {
  /**
   * Generate a base64 encoded placeholder image
   */
  static generateBase64Placeholder(options: PlaceholderOptions): string {
    const {
      width,
      height,
      text = `${width}x${height}`,
      backgroundColor = '#f3f4f6',
      textColor = '#9ca3af',
      fontSize = Math.min(width, height) / 8,
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.generateSVGPlaceholder(options);
    }

    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    return canvas.toDataURL('image/jpeg', 0.1);
  }

  /**
   * Generate an SVG placeholder (fallback for SSR)
   */
  static generateSVGPlaceholder(options: PlaceholderOptions): string {
    const {
      width,
      height,
      text = `${width}x${height}`,
      backgroundColor = '#f3f4f6',
      textColor = '#9ca3af',
      fontSize = Math.min(width, height) / 8,
    } = options;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" 
              fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Generate a blur placeholder from an image
   */
  static async generateBlurPlaceholder(
    imageSrc: string,
    quality: number = 0.1
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Use small dimensions for blur effect
        const scale = 0.1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw scaled down image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply blur filter
        ctx.filter = 'blur(2px)';
        ctx.drawImage(canvas, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => {
        // Fallback to generated placeholder
        resolve(this.generateSVGPlaceholder({
          width: 400,
          height: 300,
          text: 'Image',
        }));
      };

      img.src = imageSrc;
    });
  }

  /**
   * Generate gradient placeholder
   */
  static generateGradientPlaceholder(
    width: number,
    height: number,
    colors: string[] = ['#f3f4f6', '#e5e7eb']
  ): string {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            ${colors.map((color, index) => 
              `<stop offset="${(index / (colors.length - 1)) * 100}%" style="stop-color:${color};stop-opacity:1" />`
            ).join('')}
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Generate shimmer loading placeholder
   */
  static generateShimmerPlaceholder(
    width: number,
    height: number,
    baseColor: string = '#f3f4f6',
    shimmerColor: string = '#e5e7eb'
  ): string {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${shimmerColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${baseColor};stop-opacity:1" />
            <animateTransform attributeName="gradientTransform" type="translate" 
                              values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#shimmer)"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get placeholder for common image sizes
   */
  static getCommonPlaceholder(type: 'avatar' | 'card' | 'hero' | 'thumbnail'): string {
    const placeholders = {
      avatar: this.generateSVGPlaceholder({
        width: 40,
        height: 40,
        text: '👤',
        backgroundColor: '#f3f4f6',
      }),
      card: this.generateGradientPlaceholder(400, 300),
      hero: this.generateGradientPlaceholder(1200, 600),
      thumbnail: this.generateSVGPlaceholder({
        width: 120,
        height: 120,
        text: '🖼️',
        backgroundColor: '#f3f4f6',
      }),
    };

    return placeholders[type];
  }

  /**
   * Generate responsive placeholder set
   */
  static generateResponsivePlaceholders(
    baseWidth: number,
    baseHeight: number,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Record<number, string> {
    const placeholders: Record<number, string> = {};
    const aspectRatio = baseWidth / baseHeight;

    sizes.forEach(size => {
      const width = size;
      const height = Math.round(size / aspectRatio);
      
      placeholders[size] = this.generateSVGPlaceholder({
        width,
        height,
        text: `${width}×${height}`,
      });
    });

    return placeholders;
  }
}