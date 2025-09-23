"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";

interface MobileFileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  preview?: boolean;
  className?: string;
  disabled?: boolean;
  existingFile?: string | null;
}

interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export const MobileFileUpload = ({
  onFileSelect,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-excel": [".xls"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  preview = false,
  className = "",
  disabled = false,
  existingFile = null,
}: MobileFileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        setUploadProgress(prev => ({ ...prev, error: error.message }));
        onUploadError?.(error.message);
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
        
        // Create preview for images
        if (preview && file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }

        // Reset error state
        setUploadProgress(prev => ({ ...prev, error: null }));
      }
    },
    [onFileSelect, onUploadError, preview]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
    noClick: true, // We'll handle clicks manually for mobile optimization
  });

  // Handle file input change (for camera/gallery access)
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDrop([file], []);
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Open camera (mobile)
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  // Simulate upload progress (replace with actual upload logic)
  const simulateUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress({ progress: 0, isUploading: true, error: null });

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, progress: i }));
        onUploadProgress?.(i);
      }
      
      // Simulate successful upload
      const mockUrl = URL.createObjectURL(selectedFile);
      onUploadComplete?.(mockUrl);
      setUploadProgress(prev => ({ ...prev, isUploading: false }));
    } catch (error) {
      const errorMessage = "Upload failed. Please try again.";
      setUploadProgress({ progress: 0, isUploading: false, error: errorMessage });
      onUploadError?.(errorMessage);
    }
  };

  // Remove file
  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress({ progress: 0, isUploading: false, error: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasFile = selectedFile || existingFile;
  const isImage = selectedFile?.type.startsWith("image/") || 
                  (existingFile && /\.(jpg|jpeg|png|gif)$/i.test(existingFile));

  return (
    <div className={`mobile-file-upload ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={Object.keys(accept).join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={multiple}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200
          ${isDragActive && !isDragReject ? "border-primary-500 bg-primary-50" : ""}
          ${isDragReject ? "border-red-500 bg-red-50" : ""}
          ${!isDragActive && !isDragReject ? "border-gray-300" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${hasFile ? "p-4" : "p-6 sm:p-8"}
        `}
      >
        <input {...getInputProps()} />

        {hasFile ? (
          /* File selected state */
          <div className="space-y-4">
            {/* Preview */}
            {preview && isImage && (
              <div className="relative">
                <img
                  src={previewUrl || (existingFile ? `/api/files/${existingFile}` : "")}
                  alt="Preview"
                  className="w-full max-w-xs mx-auto h-48 object-cover rounded-lg shadow-md"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors btn-touch"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* File info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">
                  {selectedFile?.name || existingFile}
                </span>
              </div>
              {selectedFile && (
                <div className="text-xs text-gray-500 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploadProgress.isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>กำลังอัปโหลด...</span>
                  <span>{uploadProgress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {uploadProgress.error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg">
                {uploadProgress.error}
              </div>
            )}

            {/* Action buttons */}
            {!disabled && (
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={removeFile}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors btn-touch"
                >
                  ลบไฟล์
                </button>
                {selectedFile && !uploadProgress.isUploading && (
                  <button
                    type="button"
                    onClick={simulateUpload}
                    className="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors btn-touch"
                  >
                    อัปโหลด
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center space-y-4">
            {/* Upload icon */}
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {/* Instructions */}
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? "วางไฟล์ที่นี่" : "เลือกไฟล์หรือลากมาวาง"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                รองรับไฟล์ภาพ, PDF, Excel ขนาดไม่เกิน {(maxSize / 1024 / 1024).toFixed(0)} MB
              </p>
            </div>

            {/* Mobile-optimized buttons */}
            <div className="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-center">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled}
                className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium btn-touch disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                เลือกไฟล์
              </button>
              
              {/* Camera button for mobile */}
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled}
                className="w-full sm:w-auto px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors font-medium btn-touch disabled:opacity-50 disabled:cursor-not-allowed sm:hidden"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ถ่ายรูป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};