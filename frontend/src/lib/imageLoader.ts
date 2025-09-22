"use client";

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader for Next.js Image component
 * This can be used to integrate with external CDNs or custom image optimization services
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // If it's already an optimized URL, return as is
  if (src.startsWith('/_next/image') || src.startsWith('data:')) {
    return src;
  }

  // Handle external URLs
  if (src.startsWith('http')) {
    // For external images, you might want to proxy through your own service
    // or use a CDN like Cloudinary, ImageKit, etc.
    return src;
  }

  // Handle local images with custom optimization
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
  });

  return `/_next/image?${params.toString()}`;
}

/**
 * Cloudinary image loader example
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    return imageLoader({ src, width, quality });
  }

  const params = [
    'f_auto',
    'c_limit',
    `w_${width}`,
    `q_${quality || 'auto'}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${params.join(',')}/${encodeURIComponent(src)}`;
}

/**
 * ImageKit loader example
 */
export function imageKitLoader({ src, width, quality }: ImageLoaderProps): string {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  
  if (!urlEndpoint) {
    return imageLoader({ src, width, quality });
  }

  const params = new URLSearchParams({
    'tr': `w-${width},q-${quality || 80},f-auto`,
  });

  return `${urlEndpoint}/${src}?${params.toString()}`;
}

/**
 * Get the appropriate loader based on configuration
 */
export function getImageLoader(): (props: ImageLoaderProps) => string {
  const loaderType = process.env.NEXT_PUBLIC_IMAGE_LOADER;

  switch (loaderType) {
    case 'cloudinary':
      return cloudinaryLoader;
    case 'imagekit':
      return imageKitLoader;
    default:
      return imageLoader;
  }
}