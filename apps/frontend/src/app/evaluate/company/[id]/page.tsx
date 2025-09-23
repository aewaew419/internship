'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Mock data types
interface Company {
  id: number;
  companyNameTh: string;
  companyNameEn?: string;
  address?: string;
}

interface EvaluationQuestion {
  id: number;
  questionTh: string;
  questionEn?: string;
  type: 'rating' | 'text';
  required: boolean;
}

interface FormValues {
  [key: string]: string | number;
}

const evaluationQuestions: EvaluationQuestion[] = [
  {
    id: 1,
    questionTh: 'ความพึงพอใจต่อสภาพแวดล้อมในการทำงาน',
    questionEn: 'Satisfaction with work environment',
    type: 'rating',
    required: true
  },
  {
    id: 2,
    questionTh: 'ความเหมาะสมของงานที่ได้รับมอบหมาย',
    questionEn: 'Appropriateness of assigned tasks',
    type: 'rating',
    required: true
  },
  {
    id: 3,
    questionTh: 'การให้คำแนะนำและการดูแลจากพี่เลี้ยง',
    questionEn: 'Guidance and supervision from mentor',
    type: 'rating',
    required: true
  },
  {
    id: 4,
    questionTh: 'ความพึงพอใจต่อสวัสดิการและสิ่งอำนวยความสะดวก',
    questionEn: 'Satisfaction with welfare and facilities',
    type: 'rating',
    required: true
  },
  {
    id: 5,
    questionTh: 'ความพึงพอใจโดยรวมต่อสถานประกอบการ',
    questionEn: 'Overall satisfaction with the company',
    type: 'rating',
    required: true
  },
  {
    id: 6,
    questionTh: 'ข้อเสนอแนะเพิ่มเติม',
    questionEn: 'Additional suggestions',
    type: 'text',
    required: false
  }
];

const validationSchema = Yup.object().shape(
  evaluationQuestions.reduce((acc, question) => {
    if (question.required) {
      if (question.type === 'rating') {
        acc[`question_${question.id}`] = Yup.number()
          .min(1, 'กรุณาให้คะแนน')
          .max(5, 'คะแนนสูงสุดคือ 5')
          .required('กรุณาให้คะแนน');
      } else {
        acc[`question_${question.id}`] = Yup.string().required('กรุณากรอกข้อมูล');
      }
    }
    return acc;
  }, {} as any)
);

export default function CompanyEvaluationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null);

  const initialValues: FormValues = evaluationQuestions.reduce((acc, question) => {
    acc[`question_${question.id}`] = question.type === 'rating' ? 0 : '';
    return acc;
  }, {} as FormValues);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock company data
        const mockCompany: Company = {
          id: Number(id),
          companyNameTh: 'บริษัท เทคโนโลยี จำกัด',
          companyNameEn: 'Technology Company Ltd.',
          address: '123 ถนนเทคโนโลยี แขวงนวัตกรรม เขตดิจิทัล กรุงเทพฯ 10110'
        };
        
        // Mock existing evaluation (if any)
        const mockEvaluation = {
          question_1: 4,
          question_2: 5,
          question_3: 4,
          question_4: 3,
          question_5: 4,
          question_6: 'บริษัทดีมาก แนะนำให้เพื่อนมาฝึกงาน'
        };
        
        setCompany(mockCompany);
        setExistingEvaluation(mockEvaluation);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log('Submitting evaluation:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/evaluate/company');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">ไม่พบข้อมูลบริษัท</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        
        {/* Company Header */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            แบบประเมินสถานประกอบการ
          </h1>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {company.companyNameTh}
            </h2>
            {company.companyNameEn && (
              <p className="text-gray-600 text-sm">
                {company.companyNameEn}
              </p>
            )}
            {company.address && (
              <p className="text-gray-600 text-sm">
                {company.address}
              </p>
            )}
          </div>
        </div>

        <Formik
          initialValues={existingEvaluation || initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-8">
              
              {evaluationQuestions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {question.questionTh}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {question.questionEn && (
                      <p className="text-sm text-gray-600 mb-4">
                        {question.questionEn}
                      </p>
                    )}
                  </div>

                  {question.type === 'rating' ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Field
                              type="radio"
                              name={`question_${question.id}`}
                              value={rating}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rating}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 px-2">
                        <span>ไม่พอใจมาก</span>
                        <span>พอใจมาก</span>
                      </div>
                      
                      <ErrorMessage 
                        name={`question_${question.id}`} 
                        component="div" 
                        className="text-red-500 text-sm" 
                      />
                    </div>
                  ) : (
                    <div>
                      <Field
                        name={`question_${question.id}`}
                        as="textarea"
                        rows={4}
                        placeholder="กรุณากรอกข้อเสนอแนะ..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none"
                      />
                      <ErrorMessage 
                        name={`question_${question.id}`} 
                        component="div" 
                        className="text-red-500 text-sm mt-1" 
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : existingEvaluation ? 'อัปเดตการประเมิน' : 'บันทึกการประเมิน'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">คำแนะนำการประเมิน</p>
            <ul className="space-y-1 text-blue-700">
              <li>• ให้คะแนนตามความเป็นจริงและประสบการณ์ของคุณ</li>
              <li>• คะแนน 1 = ไม่พอใจมาก, คะแนน 5 = พอใจมาก</li>
              <li>• ข้อเสนอแนะจะช่วยให้บริษัทปรับปรุงการดูแลนักศึกษาฝึกงาน</li>
              <li>• คุณสามารถแก้ไขการประเมินได้ภายหลัง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}