/**
 * 🎭 Mock Data Types
 * ==================
 * Comprehensive TypeScript interfaces that match database schema
 * for seamless migration from mock to real API
 */

// Base types
export type UserRole = 'student' | 'instructor' | 'admin' | 'committee' | 'visitor';
export type CoopStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'active' | 'completed';
export type CompanyType = 'government' | 'private' | 'startup' | 'ngo' | 'multinational';
export type StatusType = 'document' | 'approval' | 'evaluation' | 'visit' | 'grade';
export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type DocumentType = 'application' | 'agreement' | 'evaluation' | 'report' | 'certificate';

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profile?: StudentProfile | InstructorProfile | VisitorProfile | AdminProfile;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  emergencyContact: EmergencyContact;
  academicInfo: AcademicInfo;
  gpax?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorProfile {
  id: string;
  userId: string;
  staffId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  specialization: string[];
  facultyId: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorProfile {
  id: string;
  userId: string;
  staffId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  expertise: string[];
  assignedRegions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface AcademicInfo {
  campusId: string;
  facultyId: string;
  programId: string;
  curriculumId: string;
  majorId: string;
  year: number;
  semester: number;
  expectedGraduation: string;
}

// Company Management Types
export interface Company {
  id: string;
  name: string;
  nameEn?: string;
  type: CompanyType;
  industry: string;
  address: CompanyAddress;
  contact: CompanyContact;
  website?: string;
  description: string;
  establishedYear?: number;
  employeeCount?: number;
  isActive: boolean;
  rating?: number;
  images: string[];
  internshipSlots: number;
  currentInterns: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyAddress {
  street: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CompanyContact {
  phone: string;
  email: string;
  fax?: string;
  contactPerson: string;
  position: string;
}

export interface CompanySupervisor {
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
}

// Co-op/Internship Management Types
export interface CoopInfo {
  id: string;
  studentId: string;
  companyId: string;
  position: string;
  department: string;
  supervisor: CompanySupervisor;
  startDate: string;
  endDate: string;
  workingHours: number;
  salary?: number;
  benefits: string[];
  jobDescription: string;
  learningObjectives: string[];
  status: CoopStatus;
  documentLanguage: 'th' | 'en';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Evaluation System Types
export interface StudentEvaluateCompany {
  id: string;
  studentId: string;
  companyId: string;
  coopId: string;
  ratings: {
    workEnvironment: number;
    supervision: number;
    learningOpportunity: number;
    workload: number;
    compensation: number;
    overallSatisfaction: number;
  };
  feedback: {
    positiveAspects: string;
    improvementAreas: string;
    recommendations: string;
  };
  wouldRecommend: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyEvaluateStudent {
  id: string;
  studentId: string;
  companyId: string;
  coopId: string;
  supervisorId: string;
  ratings: {
    workPerformance: number;
    professionalism: number;
    communication: number;
    problemSolving: number;
    adaptation: number;
    reliability: number;
    initiative: number;
    overallRating: number;
  };
  feedback: {
    strengths: string;
    areasForImprovement: string;
    recommendations: string;
  };
  wouldHireAgain: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorEvaluation {
  id: string;
  visitorId: string;
  studentId: string;
  companyId: string;
  coopId: string;
  visitDate: string;
  studentEvaluation: {
    workPerformance: number;
    professionalism: number;
    communication: number;
    problemSolving: number;
    adaptation: number;
    overallRating: number;
  };
  companyEvaluation: {
    workEnvironment: number;
    supervision: number;
    facilities: number;
    safetyMeasures: number;
    cooperationLevel: number;
    overallRating: number;
  };
  observations: string;
  recommendations: string;
  images: string[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Status Tracking Types
export interface StatusItem {
  id: string;
  type: StatusType;
  title: string;
  description: string;
  status: ItemStatus;
  priority: Priority;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string;
  assignedBy?: string;
  relatedEntityId: string; // studentId, coopId, etc.
  relatedEntityType: string;
  relatedDocuments: string[];
  history: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  statusItemId: string;
  previousStatus: ItemStatus;
  newStatus: ItemStatus;
  changedBy: string;
  changedAt: string;
  comment?: string;
  attachments?: string[];
}

// Document Management Types
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  relatedEntityId: string;
  relatedEntityType: string;
  status: ItemStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  version: number;
  isLatest: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Visitor Schedule Types
export interface VisitorSchedule {
  id: string;
  visitorId: string;
  studentId: string;
  companyId: string;
  coopId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  purpose: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  location: {
    type: 'company' | 'university' | 'online';
    address?: string;
    meetingLink?: string;
    room?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Organizational Structure Types
export interface Campus {
  id: string;
  name: string;
  nameEn?: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  campusId: string;
  name: string;
  nameEn?: string;
  code: string;
  dean: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  facultyId: string;
  name: string;
  nameEn?: string;
  code: string;
  degree: 'bachelor' | 'master' | 'doctoral';
  duration: number; // in years
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Curriculum {
  id: string;
  programId: string;
  name: string;
  nameEn?: string;
  version: string;
  year: number;
  totalCredits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Major {
  id: string;
  curriculumId: string;
  name: string;
  nameEn?: string;
  code: string;
  requiredCredits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface MockAPIResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface MockAPIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  tokenType: 'Bearer';
  expiresAt: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  roles?: UserRole[];
  status?: ItemStatus[];
  dateFrom?: string;
  dateTo?: string;
  companyType?: CompanyType[];
  industry?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

// Statistics and Analytics Types
export interface DashboardStats {
  totalStudents: number;
  activeInternships: number;
  pendingApprovals: number;
  completedEvaluations: number;
  averageRating: number;
  monthlyTrends: {
    month: string;
    applications: number;
    approvals: number;
    completions: number;
  }[];
}

export interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  averageRating: number;
  topIndustries: {
    industry: string;
    count: number;
    percentage: number;
  }[];
  internshipSlots: {
    total: number;
    occupied: number;
    available: number;
  };
}