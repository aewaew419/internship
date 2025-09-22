"use client";

import Image from "next/image";
import { useState } from "react";
import { PlaceholderGenerator } from "@/lib/placeholderGenerator";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  responsive?: boolean;
  aspectRatio?: string;
}

export const ResponsiveImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  objectFit = "cover",
  objectPosition = "center",
  loading = "lazy",
  onLoad,
  onError,
  fallbackSrc = "/images/placeholder.png",
  responsive = true,
  aspectRatio,
}: ResponsiveImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  };

  // Generate responsive sizes for mobile-first approach
  const responsiveSizes = responsive
    ? sizes
    : width && height
    ? `${width}px`
    : "100vw";

  // Generate placeholder if not provided
  const placeholderDataURL = blurDataURL || 
    (width && height ? 
      PlaceholderGenerator.generateSVGPlaceholder({ width, height }) : 
      PlaceholderGenerator.getCommonPlaceholder('card'));

  // Container styles for aspect ratio
  const containerStyle = aspectRatio
    ? { aspectRatio }
    : width && height && !fill
    ? { aspectRatio: `${width}/${height}` }
    : {};

  const imageClasses = `
    ${className}
    ${isLoading ? "opacity-0" : "opacity-100"}
    transition-opacity duration-300
    ${hasError ? "filter grayscale" : ""}
  `.trim();

  if (fill) {
    return (
      <div 
        className={`relative overflow-hidden ${className}`}
        style={containerStyle}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={imageClasses}
          style={{ objectFit, objectPosition }}
          priority={priority}
          quality={quality}
          placeholder={placeholder === "blur" ? "blur" : "empty"}
          blurDataURL={placeholder === "blur" ? placeholderDataURL : undefined}
          sizes={responsiveSizes}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${responsive ? "w-full" : ""}`}
      style={containerStyle}
    >
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width: width || "100%", height: height || "auto" }}
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={imageClasses}
        style={{ objectFit, objectPosition }}
        priority={priority}
        quality={quality}
        placeholder={placeholder === "blur" ? "blur" : "empty"}
        blurDataURL={placeholder === "blur" ? placeholderDataURL : undefined}
        sizes={responsiveSizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

// Preset responsive image components for common use cases
export const AvatarImage = ({ src, alt, size = 40, ...props }: 
  Omit<ResponsiveImageProps, "width" | "height"> & { size?: number }) => (
  <ResponsiveImage
    src={src}
    alt={alt}
    width={size}
    height={size}
    className={`rounded-full ${props.className || ""}`}
    objectFit="cover"
    sizes="(max-width: 768px) 40px, 48px"
    {...props}
  />
);

export const CardImage = ({ src, alt, ...props }: ResponsiveImageProps) => (
  <ResponsiveImage
    src={src}
    alt={alt}
    fill
    className={`rounded-lg ${props.className || ""}`}
    objectFit="cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    {...props}
  />
);

export const HeroImage = ({ src, alt, ...props }: ResponsiveImageProps) => (
  <ResponsiveImage
    src={src}
    alt={alt}
    fill
    priority
    quality={90}
    className={props.className}
    objectFit="cover"
    sizes="100vw"
    {...props}
  />
);

export const ThumbnailImage = ({ src, alt, ...props }: ResponsiveImageProps) => (
  <ResponsiveImage
    src={src}
    alt={alt}
    width={120}
    height={120}
    className={`rounded ${props.className || ""}`}
    objectFit="cover"
    sizes="120px"
    {...props}
  />
);