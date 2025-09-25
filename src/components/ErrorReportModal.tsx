import React, { useState } from 'react';
import { useErrorReporting } from '../hooks/useErrorReporting';
import { ErrorReport } from '../services/errorReporting';

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorId: string;
  errorMessage: string;
  onReportSubmitted?: () => void;
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  isOpen,
  onClose,
  errorId,
  errorMessage,
  onReportSubmitted
}) => {
  const [userFeedback, setUserFeedback] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [severity, setSeverity] = useState<ErrorReport['severity']>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { reportError } = useErrorReporting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await reportError(errorId, userFeedback, reproductionSteps, severity);
      setSubmitted(true);
      onReportSubmitted?.();
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setUserFeedback('');
        setReproductionSteps('');
        setSeverity('medium');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit error report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubmitted(false);
      setUserFeedback('');
      setReproductionSteps('');
      setSeverity('medium');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              รายงานปัญหา
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ส่งรายงานเรียบร้อยแล้ว
              </h3>
              <p className="text-gray-600">
                ขอบคุณสำหรับการรายงานปัญหา เราจะดำเนินการแก้ไขโดยเร็วที่สุด
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อผิดพลาดที่เกิดขึ้น
                </label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระดับความรุนแรง
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as ErrorReport['severity'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">ต่ำ - ไม่กระทบการใช้งาน</option>
                  <option value="medium">ปานกลาง - กระทบการใช้งานบางส่วน</option>
                  <option value="high">สูง - กระทบการใช้งานอย่างมาก</option>
                  <option value="critical">วิกฤต - ไม่สามารถใช้งานได้</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียดเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="อธิบายสิ่งที่เกิดขึ้นหรือปัญหาที่พบ..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ขั้นตอนการทำซ้ำ (ไม่บังคับ)
                </label>
                <textarea
                  value={reproductionSteps}
                  onChange={(e) => setReproductionSteps(e.target.value)}
                  placeholder="1. กรอกข้อมูล...&#10;2. กดปุ่ม...&#10;3. เกิดข้อผิดพลาด..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังส่ง...
                    </>
                  ) : (
                    'ส่งรายงาน'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};