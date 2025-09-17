// Status Display Configuration
// Based on requirements 5.1, 5.2 - exact Thai text and UI styling

import { InternshipApprovalStatus, StatusDisplayConfig } from './type';

/**
 * Status display configuration with exact Thai text and UI styling
 * Based on requirements 1.1, 1.2, 1.3, 1.4, 5.1, 5.2
 */
export const STATUS_DISPLAY_CONFIG: Record<InternshipApprovalStatus, StatusDisplayConfig> = {
  'registered': {
    text: 'อยู่ระหว่างการพิจารณา โดยอาจารย์ที่ปรึกษา',
    color: '#FFA500', // Orange for pending advisor approval
    icon: 'pending'
  },
  't.approved': {
    text: 'อยู่ระหว่างการพิจารณา โดยคณะกรรมการ',
    color: '#2196F3', // Blue for committee review
    icon: 'committee'
  },
  'c.approved': {
    text: 'อนุมัติเอกสารขอฝึกงาน / สหกิจ',
    color: '#4CAF50', // Green for approved
    icon: 'approved'
  },
  'doc.approved': {
    text: 'ไม่อนุมัติเอกสารขอฝึกงาน/สหกิจ',
    color: '#F44336', // Red for rejected
    icon: 'rejected'
  },
  'doc.cancel': {
    text: 'ยกเลิกการฝึกงาน/สหกิจ',
    color: '#9E9E9E', // Gray for cancelled
    icon: 'cancelled'
  }
};

/**
 * Get status display configuration for a given status
 * @param status - The internship approval status
 * @returns StatusDisplayConfig object with text, color, and icon
 */
export const getStatusDisplayConfig = (status: InternshipApprovalStatus): StatusDisplayConfig => {
  return STATUS_DISPLAY_CONFIG[status];
};

/**
 * Get formatted status text for display
 * @param status - The internship approval status
 * @returns Formatted Thai text for the status
 */
export const getStatusText = (status: InternshipApprovalStatus): string => {
  return STATUS_DISPLAY_CONFIG[status].text;
};

/**
 * Get status color for UI styling
 * @param status - The internship approval status
 * @returns Hex color code for the status
 */
export const getStatusColor = (status: InternshipApprovalStatus): string => {
  return STATUS_DISPLAY_CONFIG[status].color;
};

/**
 * Get status icon identifier
 * @param status - The internship approval status
 * @returns Icon identifier for UI display
 */
export const getStatusIcon = (status: InternshipApprovalStatus): string => {
  return STATUS_DISPLAY_CONFIG[status].icon;
};