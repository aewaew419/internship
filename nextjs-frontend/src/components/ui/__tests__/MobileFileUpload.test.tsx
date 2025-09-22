import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileFileUpload } from '../MobileFileUpload';

// Mock file reader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mockbase64data',
  onload: null as any,
  onerror: null as any,
};

global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

describe('MobileFileUpload', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders upload area with default props', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      expect(screen.getByText('เลือกไฟล์หรือถ่ายรูป')).toBeInTheDocument();
      expect(screen.getByText('แตะเพื่อเลือกไฟล์จากอุปกรณ์ หรือถ่ายรูปใหม่')).toBeInTheDocument();
    });

    it('renders with custom labels', () => {
      render(
        <MobileFileUpload 
          onFileSelect={jest.fn()} 
          label="Upload Document"
          description="Select a PDF file"
        />
      );
      
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
      expect(screen.getByText('Select a PDF file')).toBeInTheDocument();
    });

    it('shows file type restrictions', () => {
      render(
        <MobileFileUpload 
          onFileSelect={jest.fn()} 
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
        />
      );
      
      expect(screen.getByText('ประเภทไฟล์ที่รองรับ: image/*')).toBeInTheDocument();
      expect(screen.getByText('ขนาดไฟล์สูงสุด: 5.00 MB')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('handles file selection from device', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} />);
      
      const fileInput = screen.getByRole('button', { name: /เลือกไฟล์หรือถ่ายรูป/i });
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('handles multiple file selection when enabled', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} multiple />);
      
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, [file1, file2]);
      
      expect(onFileSelect).toHaveBeenCalledWith([file1, file2]);
    });

    it('respects accept attribute for file types', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} accept="image/*" />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('enables camera capture for image types', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} accept="image/*" />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('capture', 'environment');
    });
  });

  describe('File Validation', () => {
    it('validates file size', async () => {
      const onFileSelect = jest.fn();
      const onError = jest.fn();
      
      render(
        <MobileFileUpload 
          onFileSelect={onFileSelect} 
          onError={onError}
          maxSize={1024} // 1KB
        />
      );
      
      const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, largeFile);
      
      expect(onError).toHaveBeenCalledWith('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 1.00 KB)');
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('validates file type', async () => {
      const onFileSelect = jest.fn();
      const onError = jest.fn();
      
      render(
        <MobileFileUpload 
          onFileSelect={onFileSelect} 
          onError={onError}
          accept="image/*"
        />
      );
      
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, textFile);
      
      expect(onError).toHaveBeenCalledWith('ประเภทไฟล์ไม่ถูกต้อง');
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('passes validation for correct files', async () => {
      const onFileSelect = jest.fn();
      const onError = jest.fn();
      
      render(
        <MobileFileUpload 
          onFileSelect={onFileSelect} 
          onError={onError}
          accept="image/*"
          maxSize={1024 * 1024} // 1MB
        />
      );
      
      const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, validFile);
      
      expect(onError).not.toHaveBeenCalled();
      expect(onFileSelect).toHaveBeenCalledWith(validFile);
    });
  });

  describe('Preview Functionality', () => {
    it('shows image preview when enabled', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} showPreview />);
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      // Simulate FileReader onload
      act(() => {
        mockFileReader.onload();
      });
      
      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });
    });

    it('allows removing selected file', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} showPreview />);
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      act(() => {
        mockFileReader.onload();
      });
      
      await waitFor(() => {
        const removeButton = screen.getByLabelText('ลบไฟล์');
        expect(removeButton).toBeInTheDocument();
      });
      
      const removeButton = screen.getByLabelText('ลบไฟล์');
      await user.click(removeButton);
      
      expect(onFileSelect).toHaveBeenCalledWith(null);
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during file processing', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} showPreview />);
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      // Before FileReader onload is called
      expect(screen.getByText('กำลังประมวลผล...')).toBeInTheDocument();
      
      act(() => {
        mockFileReader.onload();
      });
      
      await waitFor(() => {
        expect(screen.queryByText('กำลังประมวลผล...')).not.toBeInTheDocument();
      });
    });

    it('disables upload during processing', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} showPreview />);
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      const uploadButton = screen.getByRole('button', { name: /เลือกไฟล์หรือถ่ายรูป/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Mobile-Specific Features', () => {
    it('has proper touch target size', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const uploadButton = screen.getByRole('button', { name: /เลือกไฟล์หรือถ่ายรูป/i });
      expect(uploadButton).toHaveClass('min-h-[44px]'); // iOS minimum touch target
    });

    it('applies touch-friendly styling', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const uploadArea = document.querySelector('.border-dashed');
      expect(uploadArea).toHaveClass('touch-manipulation');
    });

    it('shows camera icon for image uploads', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} accept="image/*" />);
      
      const cameraIcon = document.querySelector('svg');
      expect(cameraIcon).toBeInTheDocument();
    });

    it('shows document icon for document uploads', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} accept=".pdf" />);
      
      const documentIcon = document.querySelector('svg');
      expect(documentIcon).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error messages', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} error="Upload failed" />);
      
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} error="Upload failed" />);
      
      const uploadArea = document.querySelector('.border-dashed');
      expect(uploadArea).toHaveClass('border-red-300');
    });

    it('handles FileReader errors', async () => {
      const onFileSelect = jest.fn();
      const onError = jest.fn();
      
      render(
        <MobileFileUpload 
          onFileSelect={onFileSelect} 
          onError={onError}
          showPreview 
        />
      );
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      // Simulate FileReader error
      act(() => {
        mockFileReader.onerror();
      });
      
      expect(onError).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการอ่านไฟล์');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('aria-label', 'เลือกไฟล์');
    });

    it('has proper button roles', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const uploadButton = screen.getByRole('button', { name: /เลือกไฟล์หรือถ่ายรูป/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('provides screen reader feedback for file selection', async () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      expect(screen.getByText('เลือกไฟล์: test.jpg')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up object URLs to prevent memory leaks', async () => {
      const onFileSelect = jest.fn();
      const { unmount } = render(<MobileFileUpload onFileSelect={onFileSelect} showPreview />);
      
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, imageFile);
      
      act(() => {
        mockFileReader.onload();
      });
      
      unmount();
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('handles large file processing efficiently', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} />);
      
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const startTime = Date.now();
      await user.upload(input, largeFile);
      const endTime = Date.now();
      
      // Should process quickly (less than 1 second for this test)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(onFileSelect).toHaveBeenCalledWith(largeFile);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const uploadArea = document.querySelector('.border-dashed') as HTMLElement;
      
      fireEvent.dragOver(uploadArea);
      
      expect(uploadArea).toHaveClass('border-primary-400');
    });

    it('handles drop events', async () => {
      const onFileSelect = jest.fn();
      render(<MobileFileUpload onFileSelect={onFileSelect} />);
      
      const uploadArea = document.querySelector('.border-dashed') as HTMLElement;
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      });
      
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('resets drag state on drag leave', () => {
      render(<MobileFileUpload onFileSelect={jest.fn()} />);
      
      const uploadArea = document.querySelector('.border-dashed') as HTMLElement;
      
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-primary-400');
      
      fireEvent.dragLeave(uploadArea);
      expect(uploadArea).not.toHaveClass('border-primary-400');
    });
  });
});