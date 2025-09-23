"use client";

import { useState, useRef, useEffect } from "react";
import { ResponsiveImage } from "./ResponsiveImage";
import { ImageOptimizationService } from "@/lib/imageOptimization";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  thumbnail?: string;
}

interface ResponsiveImageGalleryProps {
  images: GalleryImage[];
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  aspectRatio?: string;
  gap?: "sm" | "md" | "lg";
  showCaptions?: boolean;
  enableLightbox?: boolean;
  className?: string;
  onImageClick?: (image: GalleryImage, index: number) => void;
}

export const ResponsiveImageGallery = ({
  images,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  aspectRatio = "1/1",
  gap = "md",
  showCaptions = false,
  enableLightbox = true,
  className = "",
  onImageClick,
}: ResponsiveImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  const gridClasses = `
    grid
    grid-cols-${columns.mobile}
    md:grid-cols-${columns.tablet}
    lg:grid-cols-${columns.desktop}
    ${gapClasses[gap]}
  `;

  const handleImageClick = (image: GalleryImage, index: number) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else if (enableLightbox) {
      setSelectedImage(image);
      setSelectedIndex(index);
      setIsLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" 
      ? (selectedIndex - 1 + images.length) % images.length
      : (selectedIndex + 1) % images.length;
    
    setSelectedIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      switch (event.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          navigateImage("prev");
          break;
        case "ArrowRight":
          navigateImage("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, selectedIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  return (
    <>
      {/* Gallery Grid */}
      <div ref={galleryRef} className={`responsive-image-gallery ${className}`}>
        <div className={gridClasses}>
          {images.map((image, index) => (
            <div key={image.id} className="gallery-item group">
              <div 
                className="relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform duration-200 hover:scale-105"
                style={{ aspectRatio }}
                onClick={() => handleImageClick(image, index)}
              >
                <ResponsiveImage
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  fill
                  className="transition-opacity duration-200 group-hover:opacity-90"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={ImageOptimizationService.getOptimalQuality()}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Caption */}
              {showCaptions && image.caption && (
                <p className="mt-2 text-sm text-gray-600 text-center">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors btn-touch"
            aria-label="ปิด"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage("prev")}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors btn-touch"
                aria-label="รูปก่อนหน้า"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => navigateImage("next")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors btn-touch"
                aria-label="รูปถัดไป"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Container */}
          <div className="relative max-w-full max-h-full p-4">
            <ResponsiveImage
              src={selectedImage.src}
              alt={selectedImage.alt}
              fill
              className="object-contain"
              priority
              quality={90}
              sizes="100vw"
            />
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </p>
            {selectedImage.caption && (
              <p className="text-white text-sm mt-1 opacity-80">
                {selectedImage.caption}
              </p>
            )}
          </div>

          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}
    </>
  );
};

// Masonry layout variant for varied image sizes
export const MasonryImageGallery = ({
  images,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  ...props
}: ResponsiveImageGalleryProps) => {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4", 
    lg: "gap-6",
  };

  return (
    <div className={`masonry-gallery ${props.className || ""}`}>
      <div 
        className={`
          columns-${columns.mobile}
          md:columns-${columns.tablet}
          lg:columns-${columns.desktop}
          ${gapClasses[gap]}
        `}
      >
        {images.map((image, index) => (
          <div key={image.id} className="break-inside-avoid mb-4">
            <div className="relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform duration-200 hover:scale-105">
              <ResponsiveImage
                src={image.thumbnail || image.src}
                alt={image.alt}
                width={400}
                height={300}
                className="w-full h-auto"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={ImageOptimizationService.getOptimalQuality()}
              />
            </div>
            {props.showCaptions && image.caption && (
              <p className="mt-2 text-sm text-gray-600">
                {image.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};