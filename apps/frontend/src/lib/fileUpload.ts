"use client";

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface FileUploadResult {
  file: File;
  preview?: string;
  compressed?: File;
}

export class MobileFileUploadService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly DEFAULT_MAX_DIMENSION = 1920;

  /**
   * Compress image for mobile upload optimization
   */
  static async compressImage(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<File> {
    const {
      quality = this.DEFAULT_QUALITY,
      maxWidth = this.DEFAULT_MAX_DIMENSION,
      maxHeight = this.DEFAULT_MAX_DIMENSION,
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, options: FileUploadOptions = {}): string | null {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return `ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB) ขนาดสูงสุดที่อนุญาต ${(maxSize / 1024 / 1024).toFixed(0)} MB`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `ประเภทไฟล์ไม่ได้รับอนุญาต (${file.type})`;
    }

    return null;
  }

  /**
   * Create preview URL for supported file types
   */
  static createPreview(file: File): string | null {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  /**
   * Process file for mobile upload
   */
  static async processFile(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    // Validate file
    const validationError = this.validateFile(file, options);
    if (validationError) {
      throw new Error(validationError);
    }

    const result: FileUploadResult = { file };

    // Create preview for images
    if (file.type.startsWith("image/")) {
      result.preview = this.createPreview(file);
      
      // Compress image if it's too large
      if (file.size > 1024 * 1024) { // 1MB threshold
        try {
          result.compressed = await this.compressImage(file, options);
        } catch (error) {
          console.warn("Image compression failed:", error);
          // Continue with original file if compression fails
        }
      }
    }

    return result;
  }

  /**
   * Upload file with progress tracking
   */
  static async uploadFile(
    file: File,
    endpoint: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url || response.path || "");
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout"));
      });

      // Set timeout for mobile networks
      xhr.timeout = 60000; // 60 seconds

      xhr.open("POST", endpoint);
      xhr.send(formData);
    });
  }

  /**
   * Handle mobile camera capture
   */
  static async captureFromCamera(): Promise<File | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera
        audio: false,
      });

      return new Promise((resolve) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        video.srcObject = stream;
        video.play();

        video.addEventListener("loadedmetadata", () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Capture frame
          ctx?.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            
            if (blob) {
              const file = new File([blob], `camera-${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              resolve(file);
            } else {
              resolve(null);
            }
          }, "image/jpeg", 0.8);
        });
      });
    } catch (error) {
      console.error("Camera capture failed:", error);
      return null;
    }
  }

  /**
   * Get file type icon
   */
  static getFileTypeIcon(file: File): string {
    const type = file.type.toLowerCase();
    
    if (type.startsWith("image/")) {
      return "🖼️";
    } else if (type.includes("pdf")) {
      return "📄";
    } else if (type.includes("excel") || type.includes("spreadsheet")) {
      return "📊";
    } else if (type.includes("word") || type.includes("document")) {
      return "📝";
    } else {
      return "📎";
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Check if device supports camera
   */
  static isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if device is mobile
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}