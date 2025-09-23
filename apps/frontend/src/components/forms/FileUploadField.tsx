"use client";

import { useState } from "react";
import { MobileFileUpload } from "@/components/ui/MobileFileUpload";
import { MobileFileUploadService, FileUploadOptions } from "@/lib/fileUpload";

interface FileUploadFieldProps {
  name: string;
  label?: string;
  value?: string | null;
  onChange: (file: File | null, url?: string) => void;
  onError?: (error: string) => void;
  options?: FileUploadOptions;
  preview?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
}

export const FileUploadField = ({
  name,
  label,
  value,
  onChange,
  onError,
  options = {},
  preview = false,
  required = false,
  disabled = false,
  className = "",
  helpText,
}: FileUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      
      // Process file (validation, compression, etc.)
      const result = await MobileFileUploadService.processFile(file, options);
      
      // Use compressed version if available
      const fileToUpload = result.compressed || result.file;
      
      // Simulate upload (replace with actual upload logic)
      setIsUploading(true);
      setUploadProgress(0);
      
      const uploadUrl = await MobileFileUploadService.uploadFile(
        fileToUpload,
        "/api/upload", // Replace with actual endpoint
        (progress) => setUploadProgress(progress)
      );
      
      onChange(fileToUpload, uploadUrl);
      setIsUploading(false);
      
    } catch (err: any) {
      const errorMessage = err.message || "Upload failed";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsUploading(false);
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className={`file-upload-field ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Upload component */}
      <MobileFileUpload
        onFileSelect={handleFileSelect}
        onUploadProgress={setUploadProgress}
        onUploadError={handleUploadError}
        accept={options.allowedTypes ? 
          options.allowedTypes.reduce((acc, type) => {
            acc[type] = [];
            return acc;
          }, {} as Record<string, string[]>) : 
          undefined
        }
        maxSize={options.maxSize}
        preview={preview}
        disabled={disabled || isUploading}
        existingFile={value}
      />

      {/* Help text */}
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>กำลังอัปโหลด...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};