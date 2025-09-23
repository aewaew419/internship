'use client';

import React, { useState } from 'react';
import { useProgressiveEnhancement } from './ProgressiveNotificationProvider';
import { browserCompatibility } from '../../../lib/push-notifications/browser-compatibility';

interface BrowserEducationProps {
  trigger?: 'button' | 'auto' | 'banner';
  showOnUnsupported?: boolean;
  className?: string;
}

export function BrowserEducation({
  trigger = 'button',
  showOnUnsupported = true,
  className = ''
}: BrowserEducationProps) {
  const {
    detectionResult,
    enhancementLevel,
    getSetupInstructions,
    refreshDetection
  } = useProgressiveEnhancement();

  const [isOpen, setIsOpen] = useState(trigger === 'auto');
  const [currentStep, setCurrentStep] = useState(0);

  if (!detectionResult) {
    return null;
  }

  const browserInfo = browserCompatibility.getBrowserInfo();
  const setupInstructions = getSetupInstructions();
  const shouldShow = showOnUnsupported || detectionResult.isSupported;

  if (!shouldShow) {
    return null;
  }

  const getBrowserSpecificContent = () => {
    switch (browserInfo.name) {
      case 'Chrome':
      case 'Edge':
        return {
          title: `Enable Notifications in ${browserInfo.name}`,
          description: `${browserInfo.name} has excellent push notification support. Follow these steps to enable notifications:`,
          troubleshooting: [
            'Make sure you\'re using HTTPS (required for push notifications)',
            'Check if notifications are blocked in site settings',
            'Clear browser cache and cookies if having issues',
            'Disable ad blockers that might interfere with notifications'
          ],
          features: [
            'Full push notification support',
            'Action buttons in notifications',
            'Rich notification content',
            'Background sync',
            'Notification badges'
          ]
        };

      case 'Firefox':
        return {
          title: 'Enable Notifications in Firefox',
          description: 'Firefox supports push notifications with some limitations. Here\'s how to set them up:',
          troubleshooting: [
            'Ensure you\'re using Firefox 44 or later',
            'Check the shield icon in the address bar for blocked content',
            'Verify that notifications aren\'t disabled in Firefox preferences',
            'Try refreshing the page if notifications don\'t work initially'
          ],
          features: [
            'Push notification support',
            'Limited action buttons (max 2)',
            'No notification badges',
            'No background sync'
          ]
        };

      case 'Safari':
        return {
          title: 'Enable Notifications in Safari',
          description: 'Safari has limited push notification support. Here\'s what you need to know:',
          troubleshooting: [
            'Requires Safari 16 or later for web push notifications',
            'Check Safari > Preferences > Websites > Notifications',
            'Make sure the website is allowed to send notifications',
            'Some features may not work as expected'
          ],
          features: [
            'Basic push notification support (Safari 16+)',
            'No action buttons',
            'No notification badges',
            'Limited rich content support'
          ]
        };

      default:
        return {
          title: 'Browser Notification Support',
          description: 'Your browser has limited or no push notification support.',
          troubleshooting: [
            'Consider switching to Chrome, Firefox, or Edge for better support',
            'Update your browser to the latest version',
            'Check browser settings for notification permissions',
            'Some features may not be available'
          ],
          features: [
            'Limited or no push notification support',
            'Fallback methods available',
            'Manual refresh may be required'
          ]
        };
    }
  };

  const content = getBrowserSpecificContent();

  const EducationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {content.title}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Browser Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {browserInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {browserInfo.name} {browserInfo.version}
                  </p>
                  <p className="text-sm text-blue-700">
                    Enhancement Level: <span className="capitalize">{enhancementLevel}</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-800">
                {content.description}
              </p>
            </div>

            {/* Setup Instructions */}
            {setupInstructions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Setup Instructions</h3>
                <div className="space-y-3">
                  {setupInstructions.map((instruction, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                        currentStep === index ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep > index 
                          ? 'bg-green-500 text-white' 
                          : currentStep === index
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > index ? '✓' : index + 1}
                      </div>
                      <p className="text-sm text-gray-700 flex-1">
                        {instruction}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-500">
                    Step {currentStep + 1} of {setupInstructions.length}
                  </span>
                  
                  <button
                    onClick={() => setCurrentStep(Math.min(setupInstructions.length - 1, currentStep + 1))}
                    disabled={currentStep === setupInstructions.length - 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Available Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {content.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Troubleshooting */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Troubleshooting</h3>
              <div className="space-y-2">
                {content.troubleshooting.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Limitations */}
            {detectionResult.limitations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current Limitations</h3>
                <div className="space-y-2">
                  {detectionResult.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={refreshDetection}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Refresh Detection
              </button>
              
              <div className="space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Trigger permission request if supported
                    if (detectionResult.isSupported && 'Notification' in window) {
                      Notification.requestPermission();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enable Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (trigger === 'banner') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-blue-600 text-xl">💡</span>
            <div>
              <p className="font-medium text-blue-900">
                Need help with notifications?
              </p>
              <p className="text-sm text-blue-700">
                Learn how to enable notifications in {browserInfo.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Learn More
          </button>
        </div>
        {isOpen && <EducationModal />}
      </div>
    );
  }

  return (
    <>
      {trigger === 'button' && (
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors ${className}`}
        >
          <span>📚</span>
          <span>Notification Help</span>
        </button>
      )}
      
      {isOpen && <EducationModal />}
    </>
  );
}