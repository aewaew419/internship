'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Mock data types
interface Faculty {
  id: number;
  facultyNameTh: string;
  program?: Program[];
}

interface Program {
  id: number;
  programNameTh: string;
  curriculum?: Curriculum[];
}

interface Curriculum {
  id: number;
  curriculumNameTh: string;
  majors?: Major[];
}

interface Major {
  id: number;
  majorNameTh: string;
}

interface FormValues {
  name: string;
  middleName: string;
  surname: string;
  studentId: string;
  facultyId: string;
  programId: string;
  curriculumId: string;
  majorId: string;
  gpax: string;
  phoneNumber: string;
  email: string;
  picture: File | null;
}

const validationSchema = Yup.object({
  name: Yup.string().required('กรุณากรอกชื่อจริง'),
  surname: Yup.string().required('กรุณากรอกนามสกุล'),
  studentId: Yup.string().required('กรุณากรอกรหัสนักศึกษา'),
  facultyId: Yup.string().required('กรุณาเลือกคณะ'),
  programId: Yup.string().required('กรุณาเลือกสาขา'),
  curriculumId: Yup.string().required('กรุณาเลือกหลักสูตร'),
  majorId: Yup.string().required('กรุณาเลือกวิชาเอก'),
  gpax: Yup.number()
    .min(0, 'เกรดเฉลี่ยต้องมากกว่าหรือเท่ากับ 0')
    .max(4, 'เกรดเฉลี่ยต้องน้อยกว่าหรือเท่ากับ 4')
    .required('กรุณากรอกเกรดเฉลี่ย'),
  phoneNumber: Yup.string().required('กรุณากรอกเบอร์โทรศัพท์'),
  email: Yup.string().email('รูปแบบอีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมล'),
});

export default function RegisterPersonalInfoPage() {
  const router = useRouter();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);

  const initialValues: FormValues = {
    name: '',
    middleName: '',
    surname: '',
    studentId: '',
    facultyId: '',
    programId: '',
    curriculumId: '',
    majorId: '',
    gpax: '',
    phoneNumber: '',
    email: '',
    picture: null,
  };

  useEffect(() => {
    // Mock data fetch
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockFaculties: Faculty[] = [
          {
            id: 1,
            facultyNameTh: 'คณะวิศวกรรมศาสตร์',
            program: [
              {
                id: 1,
                programNameTh: 'วิศวกรรมคอมพิวเตอร์',
                curriculum: [
                  {
                    id: 1,
                    curriculumNameTh: 'หลักสูตรวิศวกรรมคอมพิวเตอร์ 2566',
                    majors: [
                      { id: 1, majorNameTh: 'วิศวกรรมซอฟต์แวร์' },
                      { id: 2, majorNameTh: 'วิศวกรรมเครือข่าย' }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 2,
            facultyNameTh: 'คณะบริหารธุรกิจ',
            program: [
              {
                id: 2,
                programNameTh: 'การจัดการธุรกิจ',
                curriculum: [
                  {
                    id: 2,
                    curriculumNameTh: 'หลักสูตรการจัดการธุรกิจ 2566',
                    majors: [
                      { id: 3, majorNameTh: 'การตลาด' },
                      { id: 4, majorNameTh: 'การเงิน' }
                    ]
                  }
                ]
              }
            ]
          }
        ];
        
        setFaculties(mockFaculties);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log('Submitting:', values);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/intern-request');
    } catch (error) {
      console.error('Error submitting form:', error);
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => {
            // Update programs when faculty changes
            useEffect(() => {
              const selectedFaculty = faculties.find(f => f.id === Number(values.facultyId));
              setPrograms(selectedFaculty?.program || []);
              setFieldValue('programId', '');
              setFieldValue('curriculumId', '');
              setFieldValue('majorId', '');
            }, [values.facultyId]);

            // Update curriculums when program changes
            useEffect(() => {
              const selectedProgram = programs.find(p => p.id === Number(values.programId));
              setCurriculums(selectedProgram?.curriculum || []);
              setFieldValue('curriculumId', '');
              setFieldValue('majorId', '');
            }, [values.programId]);

            return (
              <Form className="space-y-8">
                {/* Personal Information */}
                <section>
                  <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                    ข้อมูลส่วนตัว
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อจริง <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="name"
                        type="text"
                        placeholder="ชื่อจริง (Name)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อกลาง
                      </label>
                      <Field
                        name="middleName"
                        type="text"
                        placeholder="ชื่อกลาง (Middle name)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        นามสกุล <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="surname"
                        type="text"
                        placeholder="นามสกุล (Surname)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="surname" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสนักศึกษา <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="studentId"
                        type="text"
                        placeholder="รหัสนักศึกษา (Student ID)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="studentId" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คณะ <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="facultyId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">เลือกคณะ</option>
                        {faculties.map(faculty => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.facultyNameTh}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="facultyId" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        สาขา <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="programId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">เลือกสาขา</option>
                        {programs.map(program => (
                          <option key={program.id} value={program.id}>
                            {program.programNameTh}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="programId" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หลักสูตร <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="curriculumId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">เลือกหลักสูตร</option>
                        {curriculums.map(curriculum => (
                          <option key={curriculum.id} value={curriculum.id}>
                            {curriculum.curriculumNameTh}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="curriculumId" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วิชาเอก <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="majorId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">เลือกวิชาเอก</option>
                        {curriculums
                          .find(c => c.id === Number(values.curriculumId))
                          ?.majors?.map(major => (
                            <option key={major.id} value={major.id}>
                              {major.majorNameTh}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage name="majorId" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เกรดเฉลี่ย <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="gpax"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        placeholder="เกรดเฉลี่ย (GPAX)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="gpax" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                    ข้อมูลการติดต่อ
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="phoneNumber"
                        type="tel"
                        placeholder="เบอร์โทรศัพท์ (Phone number)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="email"
                        type="email"
                        placeholder="อีเมล (E-mail)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>
                </section>

                {/* Photo Upload */}
                <section>
                  <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                    อัปโหลดภาพนักศึกษา
                  </h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setFieldValue('picture', file);
                      }}
                      className="hidden"
                      id="picture-upload"
                    />
                    <label
                      htmlFor="picture-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                      </div>
                      <div className="text-xs text-gray-500">
                        PNG, JPG, GIF ขนาดไม่เกิน 10MB
                      </div>
                    </label>
                    {values.picture && (
                      <div className="mt-4 text-sm text-gray-600">
                        ไฟล์ที่เลือก: {values.picture.name}
                      </div>
                    )}
                  </div>
                </section>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}