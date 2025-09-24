export interface StudentLoginDTO {
  studentId: string;
  password: string;
}

export interface AdminLoginDTO {
  email: string;
  password: string;
}

export interface RegistrationDTO {
  student_id: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer';
  expires_in: number;
  expires_at: string;
}

export interface StudentUser {
  id: number;
  student_id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student';
  permissions: string[];
  profile?: {
    id: number;
    userId: number;
    studentId: string;
    name: string;
    middleName: string | null;
    surname: string;
    gpax: number | null;
    phoneNumber: string | null;
    picture: string | null;
    email: string | null;
    campusId: number;
    facultyId: number | null;
    programId: number | null;
    curriculumId: number | null;
    majorId: number | null;
  };
  lastLogin?: string;
  isActive: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  department?: string;
  lastLogin?: string;
  isActive: boolean;
}

export type AuthUser = StudentUser | AdminUser;

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  userType: 'student' | 'admin' | null;
}

export interface AuthContextValue {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userType: 'student' | 'admin' | null;
  
  // Actions
  login: (credentials: StudentLoginDTO | AdminLoginDTO, userType: 'student' | 'admin') => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  register: (data: RegistrationDTO) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  
  // Legacy support
  setCredential: (user: any) => void;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}