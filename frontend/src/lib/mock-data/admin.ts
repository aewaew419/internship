/**
 * 🎭 Mock Data for Admin Flow
 * ==========================
 * Realistic mock data for admin functionality
 * Will be replaced with real API calls when backend is ready
 */

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'committee' | 'visitor';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  studentId?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  faculty: string;
  head: string;
  studentCount: number;
  instructorCount: number;
  status: 'active' | 'inactive';
}

export interface Company {
  id: number;
  name: string;
  type: 'government' | 'private' | 'startup' | 'ngo';
  industry: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  internshipSlots: number;
  currentInterns: number;
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
  createdAt: string;
}

export interface AcademicYear {
  id: number;
  year: string;
  semester: number;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'active' | 'upcoming' | 'completed';
  studentCount: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeUsers: number;
  errorRate: number;
  lastBackup: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failed';
}

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin001',
    email: 'admin@university.ac.th',
    firstName: 'ผู้ดูแล',
    lastName: 'ระบบ',
    role: 'admin',
    status: 'active',
    phone: '02-123-4567',
    createdAt: '2024-01-15T08:00:00Z',
    lastLogin: '2024-09-22T10:30:00Z',
    avatar: '/avatars/admin.jpg'
  },
  {
    id: 2,
    username: 'student001',
    email: 'somchai.s@student.university.ac.th',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    role: 'student',
    status: 'active',
    department: 'วิทยาการคอมพิวเตอร์',
    studentId: '65010001',
    phone: '08-1234-5678',
    createdAt: '2024-01-20T09:15:00Z',
    lastLogin: '2024-09-22T14:20:00Z'
  },
  {
    id: 3,
    username: 'instructor001',
    email: 'dr.somying@university.ac.th',
    firstName: 'ดร.สมหญิง',
    lastName: 'รักการสอน',
    role: 'instructor',
    status: 'active',
    department: 'วิทยาการคอมพิวเตอร์',
    phone: '02-234-5678',
    createdAt: '2024-01-10T07:30:00Z',
    lastLogin: '2024-09-22T11:45:00Z'
  },
  {
    id: 4,
    username: 'student002',
    email: 'malee.k@student.university.ac.th',
    firstName: 'มาลี',
    lastName: 'ขยัน',
    role: 'student',
    status: 'active',
    department: 'วิศวกรรมซอฟต์แวร์',
    studentId: '65010002',
    phone: '08-2345-6789',
    createdAt: '2024-01-22T10:00:00Z',
    lastLogin: '2024-09-21T16:30:00Z'
  },
  {
    id: 5,
    username: 'visitor001',
    email: 'prof.somsak@university.ac.th',
    firstName: 'ศ.ดร.สมศักดิ์',
    lastName: 'นิเทศดี',
    role: 'visitor',
    status: 'active',
    department: 'วิทยาการคอมพิวเตอร์',
    phone: '02-345-6789',
    createdAt: '2024-01-12T08:45:00Z',
    lastLogin: '2024-09-22T09:15:00Z'
  },
  {
    id: 6,
    username: 'student003',
    email: 'preecha.m@student.university.ac.th',
    firstName: 'ปรีชา',
    lastName: 'มานะ',
    role: 'student',
    status: 'suspended',
    department: 'วิทยาการคอมพิวเตอร์',
    studentId: '65010003',
    phone: '08-3456-7890',
    createdAt: '2024-01-25T11:30:00Z',
    lastLogin: '2024-09-15T13:20:00Z'
  }
];

// Mock Departments Data
export const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'วิทยาการคอมพิวเตอร์',
    code: 'CS',
    faculty: 'คณะวิทยาศาสตร์',
    head: 'ศ.ดร.วิทยา คอมพิวเตอร์',
    studentCount: 150,
    instructorCount: 12,
    status: 'active'
  },
  {
    id: 2,
    name: 'วิศวกรรมซอฟต์แวร์',
    code: 'SE',
    faculty: 'คณะวิศวกรรมศาสตร์',
    head: 'ผศ.ดร.สมชาย ซอฟต์แวร์',
    studentCount: 120,
    instructorCount: 10,
    status: 'active'
  },
  {
    id: 3,
    name: 'เทคโนโลยีสารสนเทศ',
    code: 'IT',
    faculty: 'คณะเทคโนโลยีสารสนเทศ',
    head: 'รศ.ดร.มาลี เทคโนโลยี',
    studentCount: 100,
    instructorCount: 8,
    status: 'active'
  }
];

// Mock Companies Data
export const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'บริษัท เทคโนโลยี จำกัด',
    type: 'private',
    industry: 'Software Development',
    address: '123 ถนนเทคโนโลยี กรุงเทพฯ 10110',
    contactPerson: 'คุณสมชาย ผู้จัดการ',
    email: 'hr@technology.co.th',
    phone: '02-123-4567',
    website: 'https://technology.co.th',
    internshipSlots: 10,
    currentInterns: 8,
    rating: 4.5,
    status: 'active',
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    name: 'กรมพัฒนาดิจิทัล',
    type: 'government',
    industry: 'Government',
    address: '456 ถนนราชดำเนิน กรุงเทพฯ 10200',
    contactPerson: 'นายสมศักดิ์ ผู้อำนวยการ',
    email: 'contact@digital.go.th',
    phone: '02-234-5678',
    internshipSlots: 15,
    currentInterns: 12,
    rating: 4.2,
    status: 'active',
    createdAt: '2024-01-15T09:30:00Z'
  },
  {
    id: 3,
    name: 'StartUp Innovation',
    type: 'startup',
    industry: 'FinTech',
    address: '789 ถนนสีลม กรุงเทพฯ 10500',
    contactPerson: 'คุณมาลี CEO',
    email: 'jobs@startup-innovation.com',
    phone: '02-345-6789',
    website: 'https://startup-innovation.com',
    internshipSlots: 5,
    currentInterns: 3,
    rating: 4.8,
    status: 'active',
    createdAt: '2024-02-01T10:15:00Z'
  }
];

// Mock Academic Years Data
export const mockAcademicYears: AcademicYear[] = [
  {
    id: 1,
    year: '2567',
    semester: 1,
    startDate: '2024-08-15',
    endDate: '2024-12-15',
    registrationStart: '2024-07-01',
    registrationEnd: '2024-07-31',
    status: 'active',
    studentCount: 245
  },
  {
    id: 2,
    year: '2567',
    semester: 2,
    startDate: '2025-01-15',
    endDate: '2025-05-15',
    registrationStart: '2024-12-01',
    registrationEnd: '2024-12-31',
    status: 'upcoming',
    studentCount: 0
  },
  {
    id: 3,
    year: '2566',
    semester: 2,
    startDate: '2024-01-15',
    endDate: '2024-05-15',
    registrationStart: '2023-12-01',
    registrationEnd: '2023-12-31',
    status: 'completed',
    studentCount: 198
  }
];

// Mock System Health Data
export const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptime: '15 วัน 8 ชั่วโมง 32 นาที',
  responseTime: 145,
  memoryUsage: 68,
  cpuUsage: 23,
  diskUsage: 45,
  activeUsers: 127,
  errorRate: 0.02,
  lastBackup: '2024-09-22T02:00:00Z'
};

// Mock Audit Logs Data
export const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userName: 'admin001',
    action: 'CREATE_USER',
    resource: 'users',
    details: 'สร้างผู้ใช้ใหม่: student004',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2024-09-22T10:30:00Z',
    status: 'success'
  },
  {
    id: 2,
    userId: 3,
    userName: 'instructor001',
    action: 'UPDATE_PROFILE',
    resource: 'profile',
    details: 'อัปเดตข้อมูลส่วนตัว',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2024-09-22T09:15:00Z',
    status: 'success'
  },
  {
    id: 3,
    userId: 2,
    userName: 'student001',
    action: 'LOGIN_FAILED',
    resource: 'auth',
    details: 'เข้าสู่ระบบไม่สำเร็จ - รหัสผ่านไม่ถูกต้อง',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    timestamp: '2024-09-22T08:45:00Z',
    status: 'failed'
  }
];

// Mock API Functions (will be replaced with real API calls)
export const adminMockAPI = {
  // Users
  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockUsers;
  },

  getUserById: async (id: number): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers.find(user => user.id === id) || null;
  },

  createUser: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newUser: User = {
      ...userData,
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      createdAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
    return mockUsers[userIndex];
  },

  deleteUser: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    mockUsers.splice(userIndex, 1);
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockDepartments;
  },

  // Companies
  getCompanies: async (): Promise<Company[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockCompanies;
  },

  // Academic Years
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAcademicYears;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockSystemHealth;
  },

  // Audit Logs
  getAuditLogs: async (limit = 50): Promise<AuditLog[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockAuditLogs.slice(0, limit);
  }
};