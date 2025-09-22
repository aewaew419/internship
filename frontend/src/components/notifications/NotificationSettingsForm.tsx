'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useNotificationSettings } from '../../hooks/useNotifications';
import { usePushSubscriptionStatus } from '../../hooks/usePushNotifications';
import { PushSubscriptionManager } from './PushSubscriptionManager';
import type {
  NotificationSettings,
  NotificationType,
} from '../../types/notifications';

interface NotificationSettingsFormProps {
  className?: string;
  onSettingsChange?: (settings: NotificationSettings) => void;
  showPushSettings?: boolean;
  showAdvancedSettings?: boolean;
}

export function NotificationSettingsForm({
  className = '',
  onSettingsChange,
  showPushSettings = true,
  showAdvancedSettings = true,
}: NotificationSettingsFormProps) {
  const {
    settings,
    updateSettings,
    refreshSettings,
    isLoading,
    error,
  } = useNotificationSettings();

  const { isSubscribed } = usePushSubscriptionStatus();

  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local settings when settings are loaded
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  // Check for changes
  useEffect(() => {
    if (settings && localSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);
      setHasChanges(hasChanges);
    }
  }, [settings, localSettings]);

  const updateLocalSetting = useCallback(<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!localSettings) return;

    const updatedSettings = {
      ...localSettings,
      [key]: value,
    };

    setLocalSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  }, [localSettings, onSettingsChange]);

  const updateNotificationType = useCallback((type: NotificationType, enabled: boolean) => {
    if (!localSettings) return;

    const updatedTypes = {
      ...localSettings.types,
      [type]: enabled,
    };

    updateLocalSetting('types', updatedTypes);
  }, [localSettings, updateLocalSetting]);

  const updateQuietHours = useCallback(<K extends keyof NotificationSettings['quietHours']>(
    key: K,
    value: NotificationSettings['quietHours'][K]
  ) => {
    if (!localSettings) return;

    const updatedQuietHours = {
      ...localSettings.quietHours,
      [key]: value,
    };

    updateLocalSetting('quietHours', updatedQuietHours);
  }, [localSettings, updateLocalSetting]);

  const saveSettings = useCallback(async () => {
    if (!localSettings || !hasChanges) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, hasChanges, updateSettings]);

  const resetSettings = useCallback(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const sendTestNotification = useCallback(async () => {
    // This would trigger a test notification through the backend
    try {
      // Implementation would depend on your notification service
      console.log('Sending test notification...');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, []);

  if (isLoading || !localSettings) {
    return (
      <div className={`notification-settings-form loading ${className}`}>
        <div className="animate-pulse space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`notification-settings-form error ${className}`}>
        <div className="error-message">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load notification settings: {error}</span>
          <button onClick={refreshSettings} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
    [NotificationType.ASSIGNMENT_CHANGE]: {
      label: 'Assignment Changes',
      description: 'When instructors or supervisors are assigned or changed'
    },
    [NotificationType.GRADE_UPDATE]: {
      label: 'Grade Updates',
      description: 'When grades are recorded or updated'
    },
    [NotificationType.SCHEDULE_REMINDER]: {
      label: 'Schedule Reminders',
      description: 'Reminders for important dates and appointments'
    },
    [NotificationType.DOCUMENT_UPDATE]: {
      label: 'Document Updates',
      description: 'When documents are approved or rejected'
    },
    [NotificationType.DEADLINE_REMINDER]: {
      label: 'Deadline Reminders',
      description: 'Reminders before document or task deadlines'
    },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: {
      label: 'System Announcements',
      description: 'Important system news and announcements'
    },
    [NotificationType.EVALUATION_REQUEST]: {
      label: 'Evaluation Requests',
      description: 'When evaluations are requested or due'
    },
    [NotificationType.VISIT_SCHEDULED]: {
      label: 'Visit Scheduled',
      description: 'When company visits are scheduled'
    },
  };

  return (
    <div className={`notification-settings-form ${className}`}>
      <div className="settings-sections">
        
        {/* Push Notification Settings */}
        {showPushSettings && (
          <div className="settings-section">
            <div className="section-header">
              <h3 className="section-title">Push Notifications</h3>
              <p className="section-description">
                Manage your push notification preferences and subscription
              </p>
            </div>
            <div className="section-content">
              <PushSubscriptionManager
                showTestButton={true}
                showStatus={true}
                onSubscriptionChange={(subscribed) => {
                  updateLocalSetting('pushNotifications', subscribed);
                }}
              />
            </div>
          </div>
        )}

        {/* Delivery Methods */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Delivery Methods</h3>
            <p className="section-description">
              Choose how you want to receive notifications
            </p>
          </div>
          <div className="section-content">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-icon">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2zM4 7h8V5H4v2z" />
                  </svg>
                </div>
                <div className="setting-text">
                  <span className="setting-label">Browser Notifications</span>
                  <span className="setting-description">Receive push notifications in your browser</span>
                </div>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localSettings.pushNotifications}
                    onChange={(e) => updateLocalSetting('pushNotifications', e.target.checked)}
                    disabled={!isSubscribed && e.target.checked}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-icon">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="setting-text">
                  <span className="setting-label">Email Notifications</span>
                  <span className="setting-description">Receive notifications via email</span>
                </div>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => updateLocalSetting('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Notification Types</h3>
            <p className="section-description">
              Choose which types of notifications you want to receive
            </p>
          </div>
          <div className="section-content">
            {Object.entries(notificationTypeLabels).map(([type, { label, description }]) => (
              <div key={type} className="setting-item">
                <div className="setting-info">
                  <div className="setting-text">
                    <span className="setting-label">{label}</span>
                    <span className="setting-description">{description}</span>
                  </div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={localSettings.types[type as NotificationType] || false}
                      onChange={(e) => updateNotificationType(type as NotificationType, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Notification Frequency</h3>
            <p className="section-description">
              Control how often you receive notifications
            </p>
          </div>
          <div className="section-content">
            <div className="radio-group">
              {[
                { value: 'immediate', label: 'Immediate', description: 'Receive notifications as they happen' },
                { value: 'daily', label: 'Daily Digest', description: 'Receive a daily summary of notifications' },
                { value: 'weekly', label: 'Weekly Digest', description: 'Receive a weekly summary of notifications' },
              ].map(option => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={localSettings.frequency === option.value}
                    onChange={(e) => updateLocalSetting('frequency', e.target.value as 'immediate' | 'daily' | 'weekly')}
                  />
                  <div className="radio-content">
                    <span className="radio-label">{option.label}</span>
                    <span className="radio-description">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <>
            {/* Quiet Hours */}
            <div className="settings-section">
              <div className="section-header">
                <h3 className="section-title">Quiet Hours</h3>
                <p className="section-description">
                  Set times when you don't want to receive notifications
                </p>
              </div>
              <div className="section-content">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-text">
                      <span className="setting-label">Enable Quiet Hours</span>
                      <span className="setting-description">Disable notifications during specified hours</span>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={localSettings.quietHours.enabled}
                        onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {localSettings.quietHours.enabled && (
                  <div className="quiet-hours-settings">
                    <div className="time-inputs">
                      <div className="time-input">
                        <label className="time-label">Start Time</label>
                        <input
                          type="time"
                          value={localSettings.quietHours.startTime}
                          onChange={(e) => updateQuietHours('startTime', e.target.value)}
                          className="time-field"
                        />
                      </div>
                      <div className="time-input">
                        <label className="time-label">End Time</label>
                        <input
                          type="time"
                          value={localSettings.quietHours.endTime}
                          onChange={(e) => updateQuietHours('endTime', e.target.value)}
                          className="time-field"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sound and Vibration */}
            <div className="settings-section">
              <div className="section-header">
                <h3 className="section-title">Sound & Vibration</h3>
                <p className="section-description">
                  Control notification sound and vibration settings
                </p>
              </div>
              <div className="section-content">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-text">
                      <span className="setting-label">Sound</span>
                      <span className="setting-description">Play sound for notifications</span>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={localSettings.sound}
                        onChange={(e) => updateLocalSetting('sound', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-text">
                      <span className="setting-label">Vibration</span>
                      <span className="setting-description">Vibrate device for notifications (mobile only)</span>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={localSettings.vibration}
                        onChange={(e) => updateLocalSetting('vibration', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        {hasChanges && (
          <button
            onClick={resetSettings}
            className="action-button secondary"
            disabled={isSaving}
          >
            Reset Changes
          </button>
        )}
        <button
          onClick={saveSettings}
          disabled={!hasChanges || isSaving}
          className="action-button primary"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}

// CSS classes (to be added to your CSS file)
const styles = `
.notification-settings-form {
  @apply space-y-6;
}

.notification-settings-form.loading {
  @apply animate-pulse;
}

.notification-settings-form.error .error-message {
  @apply flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700;
}

.retry-button {
  @apply ml-auto px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded transition-colors;
}

.settings-sections {
  @apply space-y-6;
}

.settings-section {
  @apply bg-white rounded-lg border border-gray-200 overflow-hidden;
}

.section-header {
  @apply px-6 py-4 border-b border-gray-200;
}

.section-title {
  @apply text-lg font-semibold text-gray-900;
}

.section-description {
  @apply text-sm text-gray-600 mt-1;
}

.section-content {
  @apply p-6 space-y-4;
}

.setting-item {
  @apply flex items-center justify-between py-3;
}

.setting-info {
  @apply flex items-center gap-3 flex-1;
}

.setting-icon {
  @apply flex-shrink-0;
}

.setting-text {
  @apply flex flex-col;
}

.setting-label {
  @apply font-medium text-gray-900;
}

.setting-description {
  @apply text-sm text-gray-600;
}

.setting-control {
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

.radio-group {
  @apply space-y-3;
}

.radio-option {
  @apply flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors;
}

.radio-option input {
  @apply mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500;
}

.radio-content {
  @apply flex flex-col;
}

.radio-label {
  @apply font-medium text-gray-900;
}

.radio-description {
  @apply text-sm text-gray-600;
}

.quiet-hours-settings {
  @apply mt-4 p-4 bg-gray-50 rounded-lg;
}

.time-inputs {
  @apply grid grid-cols-2 gap-4;
}

.time-input {
  @apply space-y-2;
}

.time-label {
  @apply block text-sm font-medium text-gray-700;
}

.time-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.settings-actions {
  @apply flex justify-end gap-3 pt-6 border-t border-gray-200;
}

.action-button {
  @apply px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500;
}

@media (max-width: 640px) {
  .setting-item {
    @apply flex-col items-start gap-3;
  }
  
  .setting-control {
    @apply self-end;
  }
  
  .time-inputs {
    @apply grid-cols-1;
  }
  
  .settings-actions {
    @apply flex-col;
  }
}
`;

export { styles as notificationSettingsFormStyles };