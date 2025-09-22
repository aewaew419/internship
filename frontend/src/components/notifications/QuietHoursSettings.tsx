'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { NotificationSettings } from '../../types/notifications';

interface QuietHoursSettingsProps {
  quietHours: NotificationSettings['quietHours'];
  onChange: (quietHours: NotificationSettings['quietHours']) => void;
  disabled?: boolean;
  className?: string;
}

export function QuietHoursSettings({
  quietHours,
  onChange,
  disabled = false,
  className = '',
}: QuietHoursSettingsProps) {
  const [localQuietHours, setLocalQuietHours] = useState(quietHours);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Sync with parent when quietHours prop changes
  useEffect(() => {
    setLocalQuietHours(quietHours);
  }, [quietHours]);

  const updateQuietHours = useCallback(<K extends keyof NotificationSettings['quietHours']>(
    key: K,
    value: NotificationSettings['quietHours'][K]
  ) => {
    const updated = {
      ...localQuietHours,
      [key]: value,
    };

    setLocalQuietHours(updated);
    onChange(updated);

    // Validate time range when times are updated
    if (key === 'startTime' || key === 'endTime') {
      validateTimeRange(updated);
    }
  }, [localQuietHours, onChange]);

  const validateTimeRange = useCallback((hours: NotificationSettings['quietHours']) => {
    if (!hours.enabled || !hours.startTime || !hours.endTime) {
      setTimeError(null);
      return;
    }

    const start = parseTime(hours.startTime);
    const end = parseTime(hours.endTime);

    if (start === end) {
      setTimeError('Start and end times cannot be the same');
      return;
    }

    // For overnight quiet hours (e.g., 22:00 to 08:00), this is valid
    // We don't need to validate that start < end since quiet hours can span midnight
    setTimeError(null);
  }, []);

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeRange = useCallback(() => {
    if (!localQuietHours.enabled || !localQuietHours.startTime || !localQuietHours.endTime) {
      return '';
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const start = formatTime(localQuietHours.startTime);
    const end = formatTime(localQuietHours.endTime);

    return `${start} - ${end}`;
  }, [localQuietHours]);

  const getQuietHoursDuration = useCallback(() => {
    if (!localQuietHours.enabled || !localQuietHours.startTime || !localQuietHours.endTime) {
      return '';
    }

    const start = parseTime(localQuietHours.startTime);
    const end = parseTime(localQuietHours.endTime);

    let duration: number;
    if (end > start) {
      // Same day (e.g., 09:00 to 17:00)
      duration = end - start;
    } else {
      // Overnight (e.g., 22:00 to 08:00)
      duration = (24 * 60) - start + end;
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minutes`;
    }
  }, [localQuietHours]);

  const presetQuietHours = [
    { label: 'Night (10 PM - 8 AM)', startTime: '22:00', endTime: '08:00' },
    { label: 'Sleep (11 PM - 7 AM)', startTime: '23:00', endTime: '07:00' },
    { label: 'Work Hours (9 AM - 5 PM)', startTime: '09:00', endTime: '17:00' },
    { label: 'Lunch Break (12 PM - 1 PM)', startTime: '12:00', endTime: '13:00' },
  ];

  const applyPreset = useCallback((preset: { startTime: string; endTime: string }) => {
    updateQuietHours('startTime', preset.startTime);
    updateQuietHours('endTime', preset.endTime);
  }, [updateQuietHours]);

  return (
    <div className={`quiet-hours-settings ${className}`}>
      {/* Enable/Disable Toggle */}
      <div className="quiet-hours-toggle">
        <div className="toggle-header">
          <div className="toggle-info">
            <div className="toggle-icon">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div className="toggle-text">
              <span className="toggle-label">Enable Quiet Hours</span>
              <span className="toggle-description">
                Disable notifications during specified hours
                {localQuietHours.enabled && formatTimeRange() && (
                  <span className="quiet-hours-preview"> • {formatTimeRange()}</span>
                )}
              </span>
            </div>
          </div>
          <div className="toggle-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localQuietHours.enabled}
                onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                disabled={disabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Time Settings */}
      {localQuietHours.enabled && (
        <div className="quiet-hours-config">
          {/* Time Inputs */}
          <div className="time-settings">
            <div className="time-inputs">
              <div className="time-input-group">
                <label className="time-label">Start Time</label>
                <input
                  type="time"
                  value={localQuietHours.startTime}
                  onChange={(e) => updateQuietHours('startTime', e.target.value)}
                  disabled={disabled}
                  className="time-input"
                />
              </div>
              <div className="time-separator">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="time-input-group">
                <label className="time-label">End Time</label>
                <input
                  type="time"
                  value={localQuietHours.endTime}
                  onChange={(e) => updateQuietHours('endTime', e.target.value)}
                  disabled={disabled}
                  className="time-input"
                />
              </div>
            </div>

            {/* Duration Display */}
            {getQuietHoursDuration() && (
              <div className="duration-display">
                <span className="duration-label">Duration:</span>
                <span className="duration-value">{getQuietHoursDuration()}</span>
              </div>
            )}

            {/* Time Error */}
            {timeError && (
              <div className="time-error">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{timeError}</span>
              </div>
            )}
          </div>

          {/* Preset Options */}
          <div className="preset-options">
            <h4 className="preset-title">Quick Presets</h4>
            <div className="preset-buttons">
              {presetQuietHours.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  disabled={disabled}
                  className="preset-button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Help Text */}
          <div className="quiet-hours-help">
            <div className="help-item">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Notifications will be silenced during quiet hours</span>
            </div>
            <div className="help-item">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Quiet hours can span midnight (e.g., 10 PM to 8 AM)</span>
            </div>
            <div className="help-item">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Emergency notifications may still be delivered</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS classes (to be added to your CSS file)
const styles = `
.quiet-hours-settings {
  @apply space-y-4;
}

.quiet-hours-toggle {
  @apply pb-4;
}

.toggle-header {
  @apply flex items-center justify-between;
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

.quiet-hours-preview {
  @apply font-medium text-purple-600;
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
  @apply bg-purple-600;
}

.toggle-switch input:checked + .toggle-slider:after {
  @apply translate-x-5;
}

.toggle-switch input:focus + .toggle-slider {
  @apply ring-2 ring-purple-500 ring-offset-2;
}

.toggle-switch input:disabled + .toggle-slider {
  @apply opacity-50 cursor-not-allowed;
}

.quiet-hours-config {
  @apply space-y-6 p-4 bg-purple-50 rounded-lg border border-purple-200;
}

.time-settings {
  @apply space-y-4;
}

.time-inputs {
  @apply flex items-end gap-4;
}

.time-input-group {
  @apply flex-1 space-y-2;
}

.time-label {
  @apply block text-sm font-medium text-gray-700;
}

.time-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed;
}

.time-separator {
  @apply flex items-center justify-center pb-2;
}

.duration-display {
  @apply flex items-center gap-2 text-sm;
}

.duration-label {
  @apply font-medium text-gray-600;
}

.duration-value {
  @apply text-purple-600 font-medium;
}

.time-error {
  @apply flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200;
}

.preset-options {
  @apply space-y-3;
}

.preset-title {
  @apply text-sm font-medium text-gray-700;
}

.preset-buttons {
  @apply flex flex-wrap gap-2;
}

.preset-button {
  @apply px-3 py-1 text-sm bg-white border border-purple-200 text-purple-700 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.quiet-hours-help {
  @apply space-y-2;
}

.help-item {
  @apply flex items-start gap-2 text-sm text-gray-600;
}

.help-item svg {
  @apply flex-shrink-0 mt-0.5;
}

@media (max-width: 640px) {
  .toggle-header {
    @apply flex-col items-start gap-3;
  }
  
  .toggle-control {
    @apply self-end;
  }
  
  .time-inputs {
    @apply flex-col gap-4;
  }
  
  .time-separator {
    @apply hidden;
  }
  
  .preset-buttons {
    @apply flex-col;
  }
  
  .preset-button {
    @apply w-full;
  }
}
`;

export { styles as quietHoursSettingsStyles };