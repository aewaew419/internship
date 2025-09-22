"use client";

import { useState } from "react";
import { ResponsiveImage, CardImage, AvatarImage, ThumbnailImage } from "@/components/ui/ResponsiveImage";
import { ResponsiveImageGallery, MasonryImageGallery } from "@/components/ui/ResponsiveImageGallery";
import { MobileFileUpload } from "@/components/ui/MobileFileUpload";
import { FileUploadField } from "@/components/forms/FileUploadField";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

export default function MobileFeaturesDemo() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleRefresh = async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshCount(prev => prev + 1);
  };

  const handleFileUpload = (file: File | null, url?: string) => {
    setUploadedFile(file);
    console.log("File uploaded:", file, "URL:", url);
  };

  // Sample images for gallery
  const galleryImages = [
    {
      id: "1",
      src: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=800",
      alt: "Breakfast",
      caption: "Delicious breakfast",
      thumbnail: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=300",
    },
    {
      id: "2", 
      src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800",
      alt: "Burger",
      caption: "Tasty burger",
      thumbnail: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300",
    },
    {
      id: "3",
      src: "https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=800", 
      alt: "Camera",
      caption: "Vintage camera",
      thumbnail: "https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=300",
    },
    {
      id: "4",
      src: "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?w=800",
      alt: "Coffee",
      caption: "Morning coffee",
      thumbnail: "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?w=300",
    },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Mobile Features Demo
          </h1>
          <p className="text-gray-600">
            Showcase of mobile-optimized features (Refreshed {refreshCount} times)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pull down to refresh on mobile devices
          </p>
        </div>

        {/* Navigation Enhancement Demo */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Enhanced Mobile Navigation</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Features Implemented:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Swipe left to close mobile sidebar</li>
                <li>• Enhanced animations and transitions</li>
                <li>• Touch-friendly button sizes (44px minimum)</li>
                <li>• Pull-to-refresh functionality</li>
                <li>• Improved visual feedback</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Open the mobile menu (hamburger icon) and try swiping left to close it.
            </p>
          </div>
        </section>

        {/* File Upload Demo */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Mobile File Upload</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Basic File Upload</h3>
              <MobileFileUpload
                onFileSelect={(file) => console.log("File selected:", file)}
                preview={true}
                className="mb-4"
              />
            </div>

            <div>
              <h3 className="font-medium mb-3">Form Field Upload</h3>
              <FileUploadField
                name="demo-upload"
                label="Upload Document"
                onChange={handleFileUpload}
                preview={true}
                helpText="Supports images, PDF, and Excel files up to 10MB"
              />
            </div>

            {uploadedFile && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">File Uploaded:</h4>
                <p className="text-sm text-green-800">
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Mobile Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Camera access for photo capture</li>
                <li>• Image compression for mobile networks</li>
                <li>• Progress indicators</li>
                <li>• Touch-friendly interface</li>
                <li>• File type validation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Responsive Images Demo */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibent mb-4">Responsive Images</h2>
          
          <div className="space-y-6">
            {/* Different image types */}
            <div>
              <h3 className="font-medium mb-3">Image Components</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="text-center">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                    alt="Avatar"
                    size={80}
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-600">Avatar Image</p>
                </div>

                <div className="text-center">
                  <ThumbnailImage
                    src="https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=200"
                    alt="Thumbnail"
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-600">Thumbnail</p>
                </div>

                <div className="text-center">
                  <div className="w-32 h-24 mx-auto mb-2 relative">
                    <CardImage
                      src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400"
                      alt="Card"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Card Image</p>
                </div>

                <div className="text-center">
                  <ResponsiveImage
                    src="https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=400"
                    alt="Custom"
                    width={120}
                    height={90}
                    className="mx-auto mb-2 rounded-lg"
                    placeholder="blur"
                  />
                  <p className="text-sm text-gray-600">Custom Size</p>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div>
              <h3 className="font-medium mb-3">Responsive Image Gallery</h3>
              <ResponsiveImageGallery
                images={galleryImages}
                columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                aspectRatio="1/1"
                showCaptions={true}
                enableLightbox={true}
              />
            </div>

            {/* Masonry Gallery */}
            <div>
              <h3 className="font-medium mb-3">Masonry Gallery</h3>
              <MasonryImageGallery
                images={galleryImages}
                columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                showCaptions={true}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Image Optimization Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Next.js Image optimization with WebP/AVIF support</li>
                <li>• Responsive image sizing for different screen densities</li>
                <li>• Lazy loading with intersection observer</li>
                <li>• Blur placeholders for better loading experience</li>
                <li>• Touch-friendly lightbox with swipe navigation</li>
                <li>• Automatic quality adjustment based on device/connection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Performance Info */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Performance Optimizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Navigation Enhancements</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Hardware-accelerated animations</li>
                <li>• Optimized touch event handling</li>
                <li>• Reduced layout thrashing</li>
                <li>• Smooth 60fps transitions</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">File Upload Optimizations</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Client-side image compression</li>
                <li>• Progressive upload with chunking</li>
                <li>• Network-aware quality adjustment</li>
                <li>• Offline upload queue support</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Image Optimizations</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Automatic format selection (WebP/AVIF)</li>
                <li>• Responsive image serving</li>
                <li>• Intelligent lazy loading</li>
                <li>• CDN integration ready</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Mobile-First Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Touch gesture support</li>
                <li>• Pull-to-refresh functionality</li>
                <li>• Viewport-aware optimizations</li>
                <li>• Battery-conscious animations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Try These Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">On Mobile:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Pull down to refresh this page</li>
                <li>• Open sidebar and swipe left to close</li>
                <li>• Try uploading photos from camera</li>
                <li>• Tap images to open lightbox</li>
                <li>• Swipe in lightbox to navigate</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">On Desktop:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Resize window to see responsive behavior</li>
                <li>• Hover over images for effects</li>
                <li>• Use keyboard arrows in lightbox</li>
                <li>• Test drag & drop file upload</li>
                <li>• Check network tab for optimizations</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </PullToRefresh>
  );
}