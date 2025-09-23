'use client';

import React from 'react';
import type { NotificationType } from '../../types/notifications';

interface NotificationTypeToggleProps {
  type: NotificationType;
  enabled: boolean;
  onChange: (type: NotificationType, enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function NotificationTypeToggle({
  type,
  enabled,
  onChange,
  disabled = false,
  className = '',
}: NotificationTypeToggleProps) {
  const typeConfig = getNotificationTypeConfig(type);

  const handleChange = (checked: boolean) => {
    onChange(type, checked);
  };

  return (
    <div className={`notification-type-toggle ${className}`}>
      <div className="toggle-content">
        <div className="toggle-info">
          <div className="toggle-icon">
            {typeConfig.icon}
          </div>
          <div className="toggle-text">
            <span className="toggle-label">{typeConfig.label}</span>
            <span className="toggle-description">{typeConfig.description}</span>
          </div>
        </div>
        <div className="toggle-control">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

interface NotificationTypeConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'academic' | 'administrative' | 'system' | 'reminder';
  priority: 'high' | 'normal' | 'low';
}

function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  const configs: Record<NotificationType, NotificationTypeConfig> = {
    [NotificationType.ASSIGNMENT_CHANGE]: {
      label: 'Assignment Changes',
      description: 'When instructors or supervisors are assigned or changed',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      category: 'academic',
      priority: 'high',
    },
    [NotificationType.GRADE_UPDATE]: {
      label: 'Grade Updates',
      description: 'When grades are recorded or updated',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      category: 'academic',
      priority: 'high',
    },
    [NotificationType.SCHEDULE_REMINDER]: {
      label: 'Schedule Reminders',
      description: 'Reminders for important dates and appointments',
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      category: 'reminder',
      priority: 'normal',
    },
    [NotificationType.DOCUMENT_UPDATE]: {
      label: 'Document Updates',
      description: 'When documents are approved or rejected',
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      category: 'administrative',
      priority: 'high',
    },
    [NotificationType.DEADLINE_REMINDER]: {
      label: 'Deadline Reminders',
      description: 'Reminders before document or task deadlines',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      category: 'reminder',
      priority: 'high',
    },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: {
      label: 'System Announcements',
      description: 'Important system news and announcements',
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      category: 'system',
      priority: 'normal',
    },
    [NotificationType.EVALUATION_REQUEST]: {
      label: 'Evaluation Requests',
      description: 'When evaluations are requested or due',
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      category: 'academic',
      priority: 'high',
    },
    [NotificationType.VISIT_SCHEDULED]: {
      label: 'Visit Scheduled',
      description: 'When company visits are scheduled',
      icon: (
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      category: 'administrative',
      priority: 'normal',
    },
  };

  return configs[type];
}

// Group notification types by category
export function NotificationTypesByCategory({
  types,
  enabledTypes,
  onChange,
  disabled = false,
  className = '',
}: {
  types: NotificationType[];
  enabledTypes: Record<NotificationType, boolean>;
  onChange: (type: NotificationType, enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const groupedTypes = types.reduce((groups, type) => {
    const config = getNotificationTypeConfig(type);
    if (!groups[config.category]) {
      groups[config.category] = [];
    }
    groups[config.category].push(type);
    return groups;
  }, {} as Record<string, NotificationType[]>);

  const categoryLabels = {
    academic: 'Academic',
    administrative: 'Administrative',
    system: 'System',
    reminder: 'Reminders',
  };

  return (
    <div className={`notification-types-by-category ${className}`}>
      {Object.entries(groupedTypes).map(([category, categoryTypes]) => (
        <div key={category} className="category-group">
          <h4 className="category-title">{categoryLabels[category as keyof typeof categoryLabels]}</h4>
          <div className="category-types">
            {categoryTypes.map(type => (
              <NotificationTypeToggle
                key={type}
                type={type}
                enabled={enabledTypes[type] || false}
                onChange={onChange}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// CSS classes (to be added to your CSS file)
const styles = `
.notification-type-toggle {
  @apply border-b border-gray-100 last:border-b-0;
}

.toggle-content {
  @apply flex items-center justify-between py-4;
}

.toggle-info {
  @apply flex items-center gap-3 flex-1;
}

.toggle-icon {
  @apply flex-shrink-0;
}

.toggle-text {
  @apply flex flex-col;
}

.toggle-label {
  @apply font-medium text-gray-900;
}

.toggle-description {
  @apply text-sm text-gray-600;
}

.toggle-control {
  @apply flex-shrink-0;
}

.toggle-switch {
  @apply relative inline-flex items-center cursor-pointer;
}

.toggle-switch input {
  @apply sr-only;
}

.toggle-slider {
  @apply w-11 h-6 bg-gray-200 rounded-full transition-colors;
  @apply after:content-[''] after:absolute after:top-0.5 after:left-0.5;
  @apply after:bg-white after:rounded-full after:h-5 after:w-5;
  @apply after:transition-transform after:duration-200;
}

.toggle-switch input:checked + .toggle-slider {
  @apply bg-blue-600;
}

.toggle-switch input:checked + .toggle-slider:after {
  @apply translate-x-5;
}

.toggle-switch input:focus + .toggle-slider {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

.toggle-switch input:disabled + .toggle-slider {
  @apply opacity-50 cursor-not-allowed;
}

.notification-types-by-category {
  @apply space-y-6;
}

.category-group {
  @apply space-y-3;
}

.category-title {
  @apply text-sm font-semibold text-gray-700 uppercase tracking-wide;
}

.category-types {
  @apply bg-white rounded-lg border border-gray-200 divide-y divide-gray-100;
}

.category-types .notification-type-toggle {
  @apply px-4;
}

.category-types .notification-type-toggle:first-child .toggle-content {
  @apply pt-4;
}

.category-types .notification-type-toggle:last-child .toggle-content {
  @apply pb-4;
}

@media (max-width: 640px) {
  .toggle-content {
    @apply flex-col items-start gap-3;
  }
  
  .toggle-control {
    @apply self-end;
  }
}
`;

export { styles as notificationTypeToggleStyles };