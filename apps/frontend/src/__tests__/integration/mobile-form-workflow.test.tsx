import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// Mock Next.js navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/intern-request',
}));

// Mock file upload API
const mockUploadFile = jest.fn();
const mockSubmitForm = jest.fn();

jest.mock('@/lib/api/forms', () => ({
  uploadFile: mockUploadFile,
  submitInternRequest: mockSubmitForm,
}));

// Mock window.matchMedia for mobile viewport
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'), // Simulate mobile viewport
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL.createObjectURL for file preview
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mobile-optimized Intern Request Form
const InternRequestForm = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    resume: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.studentId) newErrors.studentId = 'กรุณากรอกรหัสนักศึกษา';
      if (!formData.firstName) newErrors.firstName = 'กรุณากรอกชื่อ';
      if (!formData.lastName) newErrors.lastName = 'กรุณากรอกนามสกุล';
      if (!formData.email) newErrors.email = 'กรุณากรอกอีเมล';
      if (!formData.phone) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (step === 2) {
      if (!formData.company) newErrors.company = 'กรุณากรอกชื่อบริษัท';
      if (!formData.position) newErrors.position = 'กรุณากรอกตำแหน่งงาน';
      if (!formData.startDate) newErrors.startDate = 'กรุณาเลือกวันที่เริ่มงาน';
      if (!formData.endDate) newErrors.endDate = 'กรุณาเลือกวันที่สิ้นสุด';
      if (!formData.resume) newErrors.resume = 'กรุณาอัปโหลดเรซูเม่';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload resume first
      if (formData.resume) {
        await mockUploadFile(formData.resume);
      }
      
      // Submit form data
      await mockSubmitForm(formData);
      
      // Navigate to success page
      mockPush('/intern-request/success');
    } catch (error) {
      setErrors({ submit: 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, resume: 'ไฟล์มีขนาดใหญ่เกิน 5MB' });
        return;
      }
      
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('doc')) {
        setErrors({ ...errors, resume: 'กรุณาอัปโหลดไฟล์ PDF หรือ DOC เท่านั้น' });
        return;
      }
      
      setFormData({ ...formData, resume: file });
      setErrors({ ...errors, resume: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Progress indicator */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <h1 className="text-lg font-semibold">คำขอฝึกงาน</h1>
            <span className="text-sm">ขั้นตอน {currentStep}/2</span>
          </div>
          <div className="mt-2 bg-blue-500 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
              
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสนักศึกษา
                </label>
                <input
                  type="text"
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation"
                  placeholder="เช่น 6410001234"
                />
                {errors.studentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                             touch-manipulation"
                    placeholder="ชื่อจริง"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                             touch-manipulation"
                    placeholder="นามสกุล"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation"
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation"
                  placeholder="08X-XXX-XXXX"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                         font-medium min-h-[44px] touch-manipulation transition-colors"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Step 2: Internship Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลการฝึกงาน</h2>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อบริษัท
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation"
                  placeholder="ชื่อบริษัทที่ต้องการฝึกงาน"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                )}
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  ตำแหน่งงาน
                </label>
                <input
                  type="text"
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation"
                  placeholder="เช่น Software Developer"
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มงาน
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                             touch-manipulation"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                             touch-manipulation"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
                  เรซูเม่ (PDF หรือ DOC)
                </label>
                <input
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] 
                           touch-manipulation file:mr-4 file:py-2 file:px-4 file:rounded-md 
                           file:border-0 file:text-sm file:font-medium file:bg-blue-50 
                           file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.resume && (
                  <p className="mt-1 text-sm text-green-600">
                    ไฟล์ที่เลือก: {formData.resume.name}
                  </p>
                )}
                {errors.resume && (
                  <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
                           font-medium min-h-[44px] touch-manipulation transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                           font-medium min-h-[44px] touch-manipulation transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

describe('Mobile Form Workflow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-step Form Navigation', () => {
    it('renders first step of form on mobile', () => {
      render(<InternRequestForm />);
      
      expect(screen.getByText('คำขอฝึกงาน')).toBeInTheDocument();
      expect(screen.getByText('ขั้นตอน 1/2')).toBeInTheDocument();
      expect(screen.getByText('ข้อมูลส่วนตัว')).toBeInTheDocument();
      
      // Check mobile-optimized inputs
      expect(screen.getByLabelText('รหัสนักศึกษา')).toHaveClass('min-h-[44px]', 'touch-manipulation');
    });

    it('navigates to second step when first step is valid', async () => {
      render(<InternRequestForm />);
      
      // Fill first step
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      
      // Click next
      await user.click(screen.getByText('ถัดไป'));
      
      // Should navigate to step 2
      expect(screen.getByText('ขั้นตอน 2/2')).toBeInTheDocument();
      expect(screen.getByText('ข้อมูลการฝึกงาน')).toBeInTheDocument();
    });

    it('shows validation errors when trying to proceed with invalid data', async () => {
      render(<InternRequestForm />);
      
      // Try to proceed without filling required fields
      await user.click(screen.getByText('ถัดไป'));
      
      // Should show validation errors
      expect(screen.getByText('กรุณากรอกรหัสนักศึกษา')).toBeInTheDocument();
      expect(screen.getByText('กรุณากรอกชื่อ')).toBeInTheDocument();
      expect(screen.getByText('กรุณากรอกนามสกุล')).toBeInTheDocument();
      
      // Should stay on step 1
      expect(screen.getByText('ขั้นตอน 1/2')).toBeInTheDocument();
    });

    it('allows navigation back to previous step', async () => {
      render(<InternRequestForm />);
      
      // Fill and proceed to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      // Go back to step 1
      await user.click(screen.getByText('ย้อนกลับ'));
      
      // Should be back on step 1 with data preserved
      expect(screen.getByText('ขั้นตอน 1/2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('6410001234')).toBeInTheDocument();
    });
  });

  describe('Mobile File Upload', () => {
    it('handles file selection on mobile', async () => {
      render(<InternRequestForm />);
      
      // Navigate to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      // Upload file
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText('เรซูเม่ (PDF หรือ DOC)');
      
      await user.upload(fileInput, file);
      
      expect(screen.getByText('ไฟล์ที่เลือก: resume.pdf')).toBeInTheDocument();
    });

    it('validates file size on mobile', async () => {
      render(<InternRequestForm />);
      
      // Navigate to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      // Upload large file (6MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText('เรซูเม่ (PDF หรือ DOC)');
      
      await user.upload(fileInput, largeFile);
      
      expect(screen.getByText('ไฟล์มีขนาดใหญ่เกิน 5MB')).toBeInTheDocument();
    });

    it('validates file type on mobile', async () => {
      render(<InternRequestForm />);
      
      // Navigate to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      // Upload invalid file type
      const invalidFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('เรซูเม่ (PDF หรือ DOC)');
      
      await user.upload(fileInput, invalidFile);
      
      expect(screen.getByText('กรุณาอัปโหลดไฟล์ PDF หรือ DOC เท่านั้น')).toBeInTheDocument();
    });
  });

  describe('Form Submission on Mobile', () => {
    it('submits complete form successfully', async () => {
      mockUploadFile.mockResolvedValue({ url: 'https://example.com/resume.pdf' });
      mockSubmitForm.mockResolvedValue({ id: '123', status: 'submitted' });

      render(<InternRequestForm />);
      
      // Fill step 1
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      // Fill step 2
      await user.type(screen.getByLabelText('ชื่อบริษัท'), 'Tech Company');
      await user.type(screen.getByLabelText('ตำแหน่งงาน'), 'Developer');
      await user.type(screen.getByLabelText('วันที่เริ่มงาน'), '2024-06-01');
      await user.type(screen.getByLabelText('วันที่สิ้นสุด'), '2024-08-31');
      
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(screen.getByLabelText('เรซูเม่ (PDF หรือ DOC)'), file);
      
      // Submit form
      await user.click(screen.getByText('ส่งคำขอ'));
      
      // Should show loading state
      expect(screen.getByText('กำลังส่ง...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(file);
        expect(mockSubmitForm).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/intern-request/success');
      });
    });

    it('handles submission errors gracefully', async () => {
      mockUploadFile.mockRejectedValue(new Error('Upload failed'));

      render(<InternRequestForm />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      await user.type(screen.getByLabelText('ชื่อบริษัท'), 'Tech Company');
      await user.type(screen.getByLabelText('ตำแหน่งงาน'), 'Developer');
      await user.type(screen.getByLabelText('วันที่เริ่มงาน'), '2024-06-01');
      await user.type(screen.getByLabelText('วันที่สิ้นสุด'), '2024-08-31');
      
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(screen.getByLabelText('เรซูเม่ (PDF หรือ DOC)'), file);
      
      await user.click(screen.getByText('ส่งคำขอ'));
      
      await waitFor(() => {
        expect(screen.getByText('เกิดข้อผิดพลาดในการส่งข้อมูล')).toBeInTheDocument();
      });
      
      // Form should be usable again
      expect(screen.getByText('ส่งคำขอ')).toBeInTheDocument();
    });
  });

  describe('Mobile Input Types and Keyboards', () => {
    it('uses appropriate input types for mobile keyboards', () => {
      render(<InternRequestForm />);
      
      expect(screen.getByLabelText('อีเมล')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('เบอร์โทรศัพท์')).toHaveAttribute('type', 'tel');
    });

    it('uses date inputs for date fields', async () => {
      render(<InternRequestForm />);
      
      // Navigate to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      expect(screen.getByLabelText('วันที่เริ่มงาน')).toHaveAttribute('type', 'date');
      expect(screen.getByLabelText('วันที่สิ้นสุด')).toHaveAttribute('type', 'date');
    });

    it('has proper text size to prevent iOS zoom', () => {
      render(<InternRequestForm />);
      
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input).toHaveClass('text-base'); // 16px prevents iOS zoom
      });
    });
  });

  describe('Mobile Layout and Responsiveness', () => {
    it('adapts layout for mobile viewport', () => {
      render(<InternRequestForm />);
      
      const container = document.querySelector('.max-w-md');
      expect(container).toHaveClass('mx-auto'); // Centered on mobile
      
      const form = document.querySelector('.p-6');
      expect(form).toBeInTheDocument(); // Adequate padding
    });

    it('uses appropriate spacing for mobile', () => {
      render(<InternRequestForm />);
      
      const formContent = document.querySelector('.space-y-4');
      expect(formContent).toBeInTheDocument(); // Proper spacing between fields
    });

    it('has touch-friendly button sizing', () => {
      render(<InternRequestForm />);
      
      const nextButton = screen.getByText('ถัดไป');
      expect(nextButton).toHaveClass('min-h-[44px]', 'touch-manipulation');
    });
  });

  describe('Progress Indicator', () => {
    it('shows progress indicator on mobile', () => {
      render(<InternRequestForm />);
      
      expect(screen.getByText('ขั้นตอน 1/2')).toBeInTheDocument();
      
      const progressBar = document.querySelector('.bg-white.rounded-full.h-2');
      expect(progressBar).toBeInTheDocument();
    });

    it('updates progress when navigating steps', async () => {
      render(<InternRequestForm />);
      
      // Fill and proceed to step 2
      await user.type(screen.getByLabelText('รหัสนักศึกษา'), '6410001234');
      await user.type(screen.getByLabelText('ชื่อ'), 'John');
      await user.type(screen.getByLabelText('นามสกุล'), 'Doe');
      await user.type(screen.getByLabelText('อีเมล'), 'john@example.com');
      await user.type(screen.getByLabelText('เบอร์โทรศัพท์'), '0812345678');
      await user.click(screen.getByText('ถัดไป'));
      
      expect(screen.getByText('ขั้นตอน 2/2')).toBeInTheDocument();
    });
  });
});