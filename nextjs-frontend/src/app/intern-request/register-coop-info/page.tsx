'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Mock data types
interface CourseSection {
  id: number;
  course: {
    courseNameTh: string;
    courseNameEn: string;
  };
  year: number;
  semester: number;
}

interface FormValues {
  document_language: 'th' | 'en';
  year: string;
  semester: string;
  course_section_id: string;
  company_register_number: string;
  company_name_th: string;
  company_name_en: string;
  company_address: string;
  company_map: string;
  company_email: string;
  company_phone_number: string;
  company_type: string;
  start_date: string;
  end_date: string;
  coordinator: string;
  coordinator_phone_number: string;
  coordinator_email: string;
  supervisor: string;
  supervisor_phone_number: string;
  supervisor_email: string;
  department: string;
  position: string;
  job_description: string;
  picture_1: File | null;
  picture_2: File | null;
}

const businessTypes = [
  "กิจการเจ้าของคนเดียว",
  "ห้างหุ้นส่วนสามัญ",
  "ห้างหุ้นส่วนจำกัด",
  "บริษัทจำกัด",
  "บริษัทมหาชนจำกัด",
  "องค์กรธุรกิจจัดตั้งหรือจดทะเบียนภายใต้กฎหมายเฉพาะ",
  "สำนักงานสาขา",
  "สำนักงานผู้แทน และสำนักงานภูมิภาค",
];

const validationSchema = Yup.object({
  document_language: Yup.string().required('กรุณาเลือกภาษาเอกสาร'),
  year: Yup.string().required('กรุณาเลือกปีการศึกษา'),
  semester: Yup.string().required('กรุณาเลือกภาคการศึกษา'),
  course_section_id: Yup.string().required('กรุณาเลือกประเภท'),
  company_register_number: Yup.string().required('กรุณากรอกเลขทะเบียนบริษัท'),
  company_name_th: Yup.string().required('กรุณากรอกชื่อบริษัท'),
  company_phone_number: Yup.string().required('กรุณากรอกเบอร์โทรบริษัท'),
  company_type: Yup.string().required('กรุณาเลือกประเภทกิจการ'),
  company_email: Yup.string().email('รูปแบบอีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมลบริษัท'),
  company_address: Yup.string().required('กรุณากรอกที่อยู่บริษัท'),
  company_map: Yup.string().url('รูปแบบ URL ไม่ถูกต้อง').required('กรุณากรอก Google Map URL'),
  start_date: Yup.string().required('กรุณาเลือกวันที่เริ่มงาน'),
  end_date: Yup.string().required('กรุณาเลือกวันที่สิ้นสุดงาน'),
  coordinator: Yup.string().required('กรุณากรอกชื่อผู้รับการติดต่อ'),
  coordinator_phone_number: Yup.string().required('กรุณากรอกเบอร์ติดต่อ'),
  coordinator_email: Yup.string().email('รูปแบบอีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมล'),
  department: Yup.string().required('กรุณากรอกแผนกงาน'),
  position: Yup.string().required('กรุณากรอกตำแหน่งงาน'),
  job_description: Yup.string().required('กรุณากรอกรายละเอียดงาน'),
  supervisor: Yup.string().required('กรุณากรอกชื่อหัวหน้างาน'),
  supervisor_phone_number: Yup.string().required('กรุณากรอกเบอร์ติดต่อหัวหน้างาน'),
  supervisor_email: Yup.string().email('รูปแบบอีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมลหัวหน้างาน'),
});

export default function RegisterCoopInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = id && id !== '0';

  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);

  const initialValues: FormValues = {
    document_language: 'th',
    year: '2567',
    semester: '1',
    course_section_id: '',
    company_register_number: '',
    company_name_th: '',
    company_name_en: '',
    company_address: '',
    company_map: '',
    company_email: '',
    company_phone_number: '',
    company_type: '',
    start_date: '',
    end_date: '',
    coordinator: '',
    coordinator_phone_number: '',
    coordinator_email: '',
    supervisor: '',
    supervisor_phone_number: '',
    supervisor_email: '',
    department: '',
    position: '',
    job_description: '',
    picture_1: null,
    picture_2: null,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockCourseSections: CourseSection[] = [
          {
            id: 1,
            course: {
              courseNameTh: 'สหกิจศึกษา',
              courseNameEn: 'Cooperative Education'
            },
            year: 2567,
            semester: 1
          },
          {
            id: 2,
            course: {
              courseNameTh: 'ฝึกงาน',
              courseNameEn: 'Internship'
            },
            year: 2567,
            semester: 1
          }
        ];
        
        setCourseSections(mockCourseSections);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/intern-request');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleFileUpload = (file: File | null, fieldName: string, setFieldValue: any) => {
    setFieldValue(fieldName, file);
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
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-8">
              
              {/* Document Language */}
              <section>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                  เลือกออกเอกสาร (Document output)
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Field
                      type="radio"
                      name="document_language"
                      value="th"
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base">ภาษาไทย (Thai)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Field
                      type="radio"
                      name="document_language"
                      value="en"
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base">ภาษาอังกฤษ (English)</span>
                  </label>
                </div>
                <ErrorMessage name="document_language" component="div" className="text-red-500 text-xs mt-1" />
              </section>

              {/* Academic Year and Semester */}
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ปีการศึกษา <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="year"
                      disabled={isEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base disabled:bg-gray-100"
                    >
                      <option value="2567">2567 (2024)</option>
                      <option value="2568">2568 (2025)</option>
                    </Field>
                    <ErrorMessage name="year" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ภาคการศึกษา <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="semester"
                      disabled={isEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base disabled:bg-gray-100"
                    >
                      <option value="">เลือกภาคการศึกษา</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </Field>
                    <ErrorMessage name="semester" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>
              </section>

              {/* Course Type */}
              <section>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                  เลือกประเภท
                </h2>
                <div className="space-y-3">
                  {courseSections.length > 0 ? (
                    courseSections.map((section) => (
                      <label key={section.id} className="flex items-center gap-3 cursor-pointer">
                        <Field
                          type="radio"
                          name="course_section_id"
                          value={section.id.toString()}
                          disabled={isEdit}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm sm:text-base">
                          {section.course.courseNameTh} ({section.course.courseNameEn})
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500">กรุณาเลือกปีการศึกษาและภาคการศึกษา</p>
                  )}
                </div>
                <ErrorMessage name="course_section_id" component="div" className="text-red-500 text-xs mt-1" />
              </section>

              {/* Company Information */}
              <section>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                  ข้อมูลบริษัท
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขทะเบียนบริษัท <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_register_number"
                      type="text"
                      placeholder="เลขทะเบียน (Company no.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="company_register_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อบริษัท <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_name_th"
                      type="text"
                      placeholder="ชื่อบริษัท (Company name)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="company_name_th" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรบริษัท <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_phone_number"
                      type="tel"
                      placeholder="เบอร์โทรศัพท์ (Phone number)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="company_phone_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทกิจการ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="company_type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">เลือกประเภทกิจการ</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="company_type" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมลบริษัท <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_email"
                      type="email"
                      placeholder="อีเมลบริษัท (Company email)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="company_email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ที่อยู่บริษัท <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_address"
                      as="textarea"
                      rows={3}
                      placeholder="ที่อยู่บริษัท (Address)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none"
                    />
                    <ErrorMessage name="company_address" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      แผนที่ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_map"
                      type="url"
                      placeholder="Google Map URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="company_map" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่เริ่มงาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="start_date"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="start_date" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่สิ้นสุดงาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="end_date"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="end_date" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                {/* Company Pictures */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    ภาพบริษัท (Company pictures)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2].map((num) => (
                      <div key={num} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            handleFileUpload(file, `picture_${num}`, setFieldValue);
                          }}
                          className="hidden"
                          id={`picture-${num}-upload`}
                        />
                        <label
                          htmlFor={`picture-${num}-upload`}
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600">คลิกเพื่ออัปโหลด</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ภาพที่ {num}
                          </div>
                        </label>
                        {values[`picture_${num}` as keyof FormValues] && (
                          <div className="mt-4 text-sm text-gray-600">
                            ไฟล์ที่เลือก: {(values[`picture_${num}` as keyof FormValues] as File)?.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Job Details */}
              <section>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-700 mb-6">
                  รายละเอียดงาน
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อผู้รับการติดต่อ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="coordinator"
                      type="text"
                      placeholder="ชื่อผู้รับการติดต่อ (Coordinator)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="coordinator" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์ติดต่อ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="coordinator_phone_number"
                      type="tel"
                      placeholder="เบอร์ติดต่อ (Coordinator tel.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="coordinator_phone_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="coordinator_email"
                      type="email"
                      placeholder="อีเมล (Coordinator email)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="coordinator_email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      แผนกงาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="department"
                      type="text"
                      placeholder="แผนกงาน (Department)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="department" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ตำแหน่งงาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="position"
                      type="text"
                      placeholder="ตำแหน่งงาน (Position)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="position" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รายละเอียดงาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="job_description"
                      as="textarea"
                      rows={4}
                      placeholder="รายละเอียดงาน (Job Description)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none"
                    />
                    <ErrorMessage name="job_description" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หัวหน้างาน <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="supervisor"
                      type="text"
                      placeholder="หัวหน้างาน (Supervisor name)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="supervisor" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์ติดต่อ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="supervisor_phone_number"
                      type="tel"
                      placeholder="เบอร์ติดต่อ (Supervisor tel.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="supervisor_phone_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="supervisor_email"
                      type="email"
                      placeholder="อีเมล (Supervisor email)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <ErrorMessage name="supervisor_email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
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
          )}
        </Formik>
      </div>
    </div>
  );
}