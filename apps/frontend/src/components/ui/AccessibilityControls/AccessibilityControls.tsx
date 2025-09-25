"use client";

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AccessibilitySettings {
  highContrast: boolean;
  textScale: number;
  reducedMotion: boolean;
  focusIndicators: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  textScale: 1,
  reducedMotion: false,
  focusIndicators: true,
};

export const AccessibilityControls = () => {
  const [settings, setSettings] = useLocalStorage<AccessibilitySettings>(
    'accessibility-settings',
    DEFAULT_SETTINGS
  );
  const [isOpen, setIsOpen] = useState(false);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--border-primary', '#ffffff');
    } else {
      root.classList.remove('high-contrast');
      root.style.removeProperty('--bg-primary');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--border-primary');
    }

    // Text scaling
    root.style.setProperty('--text-scale', settings.textScale.toString());
    root.style.fontSize = `${settings.textScale}rem`;

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Enhanced focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <>
      {/* Accessibility Controls Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-200 ${
          settings.highContrast
            ? 'bg-white text-black border-2 border-black hover:bg-gray-100'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-label="เปิด/ปิดการตั้งค่าการเข้าถึง"
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
      </button>

      {/* Accessibility Controls Panel */}
      {isOpen && (
        <div
          id="accessibility-panel"
          className={`fixed top-16 right-4 z-40 w-80 p-6 rounded-lg shadow-xl border-2 ${
            settings.highContrast
              ? 'bg-black text-white border-white'
              : 'bg-white text-gray-900 border-gray-200'
          }`}
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-modal="false"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="accessibility-title"
              className={`text-lg font-semibold ${
                settings.highContrast ? 'text-white' : 'text-gray-900'
              }`}
            >
              การตั้งค่าการเข้าถึง
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                settings.highContrast
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="ปิดแผงการตั้งค่า"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="high-contrast"
                  className={`text-sm font-medium ${
                    settings.highContrast ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  โหมดคอนทราสต์สูง
                </label>
                <p
                  className={`text-xs ${
                    settings.highContrast ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  เพิ่มความคมชัดของสีเพื่อการมองเห็นที่ดีขึ้น
                </p>
              </div>
              <button
                id="high-contrast"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.highContrast
                    ? 'bg-blue-600'
                    : settings.highContrast
                    ? 'bg-gray-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Text Scale Slider */}
            <div>
              <label
                htmlFor="text-scale"
                className={`block text-sm font-medium mb-2 ${
                  settings.highContrast ? 'text-white' : 'text-gray-700'
                }`}
              >
                ขนาดตัวอักษร: {Math.round(settings.textScale * 100)}%
              </label>
              <input
                id="text-scale"
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={settings.textScale}
                onChange={(e) => updateSetting('textScale', parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.highContrast
                    ? 'bg-gray-700 slider-thumb-white'
                    : 'bg-gray-200 slider-thumb-blue'
                }`}
                aria-describedby="text-scale-description"
              />
              <div id="text-scale-description" className="sr-only">
                ปรับขนาดตัวอักษรจาก 80% ถึง 150%
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="reduced-motion"
                  className={`text-sm font-medium ${
                    settings.highContrast ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  ลดการเคลื่อนไหว
                </label>
                <p
                  className={`text-xs ${
                    settings.highContrast ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  ลดแอนิเมชันและการเคลื่อนไหวต่างๆ
                </p>
              </div>
              <button
                id="reduced-motion"
                role="switch"
                aria-checked={settings.reducedMotion}
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.reducedMotion
                    ? 'bg-blue-600'
                    : settings.highContrast
                    ? 'bg-gray-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Enhanced Focus Indicators Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="focus-indicators"
                  className={`text-sm font-medium ${
                    settings.highContrast ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  ตัวบ่งชี้โฟกัสที่ชัดเจน
                </label>
                <p
                  className={`text-xs ${
                    settings.highContrast ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  เพิ่มความชัดเจนของเส้นขอบเมื่อโฟกัส
                </p>
              </div>
              <button
                id="focus-indicators"
                role="switch"
                aria-checked={settings.focusIndicators}
                onClick={() => updateSetting('focusIndicators', !settings.focusIndicators)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.focusIndicators
                    ? 'bg-blue-600'
                    : settings.highContrast
                    ? 'bg-gray-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={resetSettings}
                className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.highContrast
                    ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                รีเซ็ตการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close panel when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};