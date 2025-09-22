package handlers

import (
	"backend-go/internal/config"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// UploadHandler handles file upload endpoints
type UploadHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

// NewUploadHandler creates a new upload handler
func NewUploadHandler(db *gorm.DB, cfg *config.Config) *UploadHandler {
	return &UploadHandler{
		db:  db,
		cfg: cfg,
	}
}

// UploadResponse represents the upload response
type UploadResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// FileInfo represents uploaded file information
type FileInfo struct {
	ID           string `json:"id"`
	OriginalName string `json:"originalName"`
	FileName     string `json:"fileName"`
	Size         int64  `json:"size"`
	MimeType     string `json:"mimeType"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`
	UploadedAt   string `json:"uploadedAt"`
}

// UploadConfig holds upload configuration
type UploadConfig struct {
	MaxFileSize   int64    // Maximum file size in bytes
	AllowedTypes  []string // Allowed MIME types
	UploadDir     string   // Upload directory
	ThumbnailSize int      // Thumbnail size for images
}

// DefaultUploadConfig returns default upload configuration
func DefaultUploadConfig() UploadConfig {
	return UploadConfig{
		MaxFileSize: 10 * 1024 * 1024, // 10MB
		AllowedTypes: []string{
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"text/plain",
		},
		UploadDir:     "./uploads",
		ThumbnailSize: 300,
	}
}

// UploadSingle handles single file upload
// POST /api/v1/upload/single
func (h *UploadHandler) UploadSingle(c *fiber.Ctx) error {
	config := DefaultUploadConfig()
	
	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "No file provided",
			Error:   err.Error(),
		})
	}

	// Validate file
	if err := h.validateFile(file, config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "File validation failed",
			Error:   err.Error(),
		})
	}

	// Save file
	fileInfo, err := h.saveFile(file, config)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
			Success: false,
			Message: "Failed to save file",
			Error:   err.Error(),
		})
	}

	// Generate thumbnail for images
	if h.isImage(file.Header.Get("Content-Type")) {
		thumbnailURL, err := h.generateThumbnail(fileInfo.FileName, config)
		if err == nil {
			fileInfo.ThumbnailURL = thumbnailURL
		}
	}

	// TODO: Save file info to database
	// fileRecord := FileUpload{
	// 	UserID:       c.Locals("userID").(uint),
	// 	OriginalName: fileInfo.OriginalName,
	// 	FileName:     fileInfo.FileName,
	// 	Size:         fileInfo.Size,
	// 	MimeType:     fileInfo.MimeType,
	// 	URL:          fileInfo.URL,
	// 	ThumbnailURL: fileInfo.ThumbnailURL,
	// }
	// h.db.Create(&fileRecord)

	return c.JSON(UploadResponse{
		Success: true,
		Message: "File uploaded successfully",
		Data:    fileInfo,
	})
}

// UploadMultiple handles multiple file upload
// POST /api/v1/upload/multiple
func (h *UploadHandler) UploadMultiple(c *fiber.Ctx) error {
	config := DefaultUploadConfig()
	
	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "Failed to parse multipart form",
			Error:   err.Error(),
		})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "No files provided",
		})
	}

	// Limit number of files
	maxFiles := 10
	if len(files) > maxFiles {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: fmt.Sprintf("Too many files. Maximum %d files allowed", maxFiles),
		})
	}

	var uploadedFiles []FileInfo
	var errors []string

	for _, file := range files {
		// Validate file
		if err := h.validateFile(file, config); err != nil {
			errors = append(errors, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
			continue
		}

		// Save file
		fileInfo, err := h.saveFile(file, config)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
			continue
		}

		// Generate thumbnail for images
		if h.isImage(file.Header.Get("Content-Type")) {
			thumbnailURL, err := h.generateThumbnail(fileInfo.FileName, config)
			if err == nil {
				fileInfo.ThumbnailURL = thumbnailURL
			}
		}

		uploadedFiles = append(uploadedFiles, *fileInfo)
	}

	response := UploadResponse{
		Success: len(uploadedFiles) > 0,
		Message: fmt.Sprintf("Uploaded %d files successfully", len(uploadedFiles)),
		Data: map[string]interface{}{
			"files":  uploadedFiles,
			"errors": errors,
			"stats": map[string]int{
				"total":     len(files),
				"uploaded":  len(uploadedFiles),
				"failed":    len(errors),
			},
		},
	}

	statusCode := fiber.StatusOK
	if len(uploadedFiles) == 0 {
		statusCode = fiber.StatusBadRequest
		response.Message = "No files were uploaded successfully"
	}

	return c.Status(statusCode).JSON(response)
}

// UploadChunk handles chunked file upload for large files
// POST /api/v1/upload/chunk
func (h *UploadHandler) UploadChunk(c *fiber.Ctx) error {
	// Get chunk parameters
	chunkNumber, _ := strconv.Atoi(c.FormValue("chunkNumber"))
	totalChunks, _ := strconv.Atoi(c.FormValue("totalChunks"))
	fileName := c.FormValue("fileName")
	fileID := c.FormValue("fileId")

	if fileName == "" || fileID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "fileName and fileId are required",
		})
	}

	// Get chunk file
	file, err := c.FormFile("chunk")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UploadResponse{
			Success: false,
			Message: "No chunk file provided",
			Error:   err.Error(),
		})
	}

	// Create chunks directory
	chunksDir := filepath.Join("./uploads/chunks", fileID)
	if err := os.MkdirAll(chunksDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
			Success: false,
			Message: "Failed to create chunks directory",
			Error:   err.Error(),
		})
	}

	// Save chunk
	chunkPath := filepath.Join(chunksDir, fmt.Sprintf("chunk_%d", chunkNumber))
	if err := c.SaveFile(file, chunkPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
			Success: false,
			Message: "Failed to save chunk",
			Error:   err.Error(),
		})
	}

	// Check if all chunks are uploaded
	if chunkNumber == totalChunks-1 {
		// Merge chunks
		finalPath := filepath.Join("./uploads", fileName)
		if err := h.mergeChunks(chunksDir, finalPath, totalChunks); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
				Success: false,
				Message: "Failed to merge chunks",
				Error:   err.Error(),
			})
		}

		// Clean up chunks
		os.RemoveAll(chunksDir)

		// Get file info
		fileInfo, err := os.Stat(finalPath)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
				Success: false,
				Message: "Failed to get file info",
				Error:   err.Error(),
			})
		}

		response := FileInfo{
			ID:           fileID,
			OriginalName: fileName,
			FileName:     fileName,
			Size:         fileInfo.Size(),
			URL:          "/uploads/" + fileName,
			UploadedAt:   time.Now().UTC().Format(time.RFC3339),
		}

		return c.JSON(UploadResponse{
			Success: true,
			Message: "File uploaded successfully",
			Data:    response,
		})
	}

	return c.JSON(UploadResponse{
		Success: true,
		Message: fmt.Sprintf("Chunk %d/%d uploaded successfully", chunkNumber+1, totalChunks),
		Data: map[string]interface{}{
			"chunkNumber": chunkNumber,
			"totalChunks": totalChunks,
			"fileId":      fileID,
		},
	})
}

// DeleteFile handles file deletion
// DELETE /api/v1/upload/:fileId
func (h *UploadHandler) DeleteFile(c *fiber.Ctx) error {
	fileID := c.Params("fileId")
	
	// TODO: Get file info from database and delete
	// var fileRecord FileUpload
	// if err := h.db.Where("id = ?", fileID).First(&fileRecord).Error; err != nil {
	// 	return c.Status(fiber.StatusNotFound).JSON(UploadResponse{
	// 		Success: false,
	// 		Message: "File not found",
	// 	})
	// }

	// Delete physical file
	// filePath := filepath.Join("./uploads", fileRecord.FileName)
	// if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(UploadResponse{
	// 		Success: false,
	// 		Message: "Failed to delete file",
	// 		Error:   err.Error(),
	// 	})
	// }

	// Delete thumbnail if exists
	// if fileRecord.ThumbnailURL != "" {
	// 	thumbnailPath := filepath.Join("./uploads/thumbnails", fileRecord.FileName)
	// 	os.Remove(thumbnailPath) // Ignore error
	// }

	// Delete from database
	// h.db.Delete(&fileRecord)

	return c.JSON(UploadResponse{
		Success: true,
		Message: "File deleted successfully",
	})
}

// validateFile validates uploaded file
func (h *UploadHandler) validateFile(file *multipart.FileHeader, config UploadConfig) error {
	// Check file size
	if file.Size > config.MaxFileSize {
		return fmt.Errorf("file size exceeds maximum allowed size of %d bytes", config.MaxFileSize)
	}

	// Check file type
	contentType := file.Header.Get("Content-Type")
	if !h.isAllowedType(contentType, config.AllowedTypes) {
		return fmt.Errorf("file type %s is not allowed", contentType)
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !h.isAllowedExtension(ext) {
		return fmt.Errorf("file extension %s is not allowed", ext)
	}

	return nil
}

// saveFile saves uploaded file to disk
func (h *UploadHandler) saveFile(file *multipart.FileHeader, config UploadConfig) (*FileInfo, error) {
	// Create upload directory if not exists
	if err := os.MkdirAll(config.UploadDir, 0755); err != nil {
		return nil, err
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), h.sanitizeFilename(file.Filename), ext)
	filePath := filepath.Join(config.UploadDir, fileName)

	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	// Get file info
	fileInfo := &FileInfo{
		ID:           fmt.Sprintf("%d", time.Now().UnixNano()),
		OriginalName: file.Filename,
		FileName:     fileName,
		Size:         file.Size,
		MimeType:     file.Header.Get("Content-Type"),
		URL:          "/uploads/" + fileName,
		UploadedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	return fileInfo, nil
}

// generateThumbnail generates thumbnail for images
func (h *UploadHandler) generateThumbnail(fileName string, config UploadConfig) (string, error) {
	// TODO: Implement image thumbnail generation
	// This would require an image processing library like imaging
	
	// For now, return empty string
	return "", fmt.Errorf("thumbnail generation not implemented")
}

// mergeChunks merges uploaded chunks into a single file
func (h *UploadHandler) mergeChunks(chunksDir, finalPath string, totalChunks int) error {
	// Create final file
	finalFile, err := os.Create(finalPath)
	if err != nil {
		return err
	}
	defer finalFile.Close()

	// Merge chunks in order
	for i := 0; i < totalChunks; i++ {
		chunkPath := filepath.Join(chunksDir, fmt.Sprintf("chunk_%d", i))
		
		chunkFile, err := os.Open(chunkPath)
		if err != nil {
			return err
		}
		
		if _, err := io.Copy(finalFile, chunkFile); err != nil {
			chunkFile.Close()
			return err
		}
		
		chunkFile.Close()
	}

	return nil
}

// isAllowedType checks if content type is allowed
func (h *UploadHandler) isAllowedType(contentType string, allowedTypes []string) bool {
	for _, allowed := range allowedTypes {
		if contentType == allowed {
			return true
		}
	}
	return false
}

// isAllowedExtension checks if file extension is allowed
func (h *UploadHandler) isAllowedExtension(ext string) bool {
	allowedExts := []string{
		".jpg", ".jpeg", ".png", ".gif", ".webp",
		".pdf", ".doc", ".docx", ".txt",
	}
	
	for _, allowed := range allowedExts {
		if ext == allowed {
			return true
		}
	}
	return false
}

// isImage checks if content type is an image
func (h *UploadHandler) isImage(contentType string) bool {
	return strings.HasPrefix(contentType, "image/")
}

// sanitizeFilename removes unsafe characters from filename
func (h *UploadHandler) sanitizeFilename(filename string) string {
	// Remove extension
	name := strings.TrimSuffix(filename, filepath.Ext(filename))
	
	// Replace unsafe characters
	unsafe := []string{" ", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"}
	for _, char := range unsafe {
		name = strings.ReplaceAll(name, char, "_")
	}
	
	// Limit length
	if len(name) > 50 {
		name = name[:50]
	}
	
	return name
}