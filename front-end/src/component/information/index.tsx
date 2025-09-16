import useViewModel from "./viewModel";
import dayjs from "dayjs";
export const Persona = ({ id }: { id: number }) => {
  const { studentEnrollments } = useViewModel(id);

  return (
    <div>
      <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
        ข้อมูลส่วนตัว
      </h1>
      <div className="grid grid-cols-2 font-medium">
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อจริง-นามสกุล (Full-name)</p>
          <p>
            : {studentEnrollments?.student.name}{" "}
            {studentEnrollments?.student.surname}
          </p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">รหัสนักศึกษา (Student ID)</p>
          <p>: {studentEnrollments?.student.studentId}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">คณะ (Faculty)</p>
          <p>: {studentEnrollments?.student.facultyId}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">สาชาวิชา (Major)</p>
          <p>: {studentEnrollments?.student.programId}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">เบอร์โทร (Tel.) </p>
          <p>: {studentEnrollments?.student.phoneNumber}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">อีเมล (Email) </p>
          <p>: {studentEnrollments?.student.email}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">เกรดเฉลี่ย (GPAX) </p>
          <p>: {studentEnrollments?.student.gpax}</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ประเภทที่เลือก (Type)</p>
          <p>: {studentEnrollments?.course_section.course.courseNameTh}</p>
        </div>
      </div>
    </div>
  );
};
export const CoopInformation = ({ id }: { id: number }) => {
  const { studentEnrollments } = useViewModel(id);
  return (
    <div>
      <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
        ข้อมูลสถานประกอบการ
      </h1>
      <div className="grid grid-cols-2 font-medium">
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อบริษัท (Company name) </p>
          <p>: {studentEnrollments?.student_training.company.companyNameTh}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">
            เลขทะเบียนพาณิชย์ (Registration no.)
          </p>
          <p>
            :
            {studentEnrollments?.student_training.company.companyRegisterNumber}
          </p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">แผนก (Department)</p>
          <p>: {studentEnrollments?.student_training.department}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ตำแหน่ง (Position) </p>
          <p>: {studentEnrollments?.student_training.position}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ระยะเวลา (Duration) </p>
          <p>
            :{" "}
            {studentEnrollments?.student_training.startDate
              ? dayjs(studentEnrollments.student_training.startDate).format(
                  "DD/MM/"
                ) +
                (Number(
                  dayjs(studentEnrollments.student_training.endDate).format(
                    "YYYY"
                  )
                ) +
                  543)
              : "-"}{" "}
            –{" "}
            {studentEnrollments?.student_training.endDate
              ? dayjs(studentEnrollments.student_training.endDate).format(
                  "DD/MM/"
                ) +
                (Number(
                  dayjs(studentEnrollments.student_training.endDate).format(
                    "YYYY"
                  )
                ) +
                  543)
              : "-"}
          </p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">อาจารย์นิเทศ (Academic advisor) </p>
          <p>: {studentEnrollments?.visitor_training?.[0]?.visitor.name}</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อผู้ติดต่อ (Coordinator) </p>
          <p>: {studentEnrollments?.student_training.coordinator}</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">
            เบอร์ผู้ติดต่อ (Coordinator tel.)
          </p>
          <p>: {studentEnrollments?.student_training.coordinatorPhoneNumber}</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ชื่อหัวหน้า (Supervisor)</p>
          <p>: {studentEnrollments?.student_training.supervisor}</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">เบอรหัวหน้า (Supervisor tel.)</p>
          <p>: {studentEnrollments?.student_training.supervisorPhoneNumber}</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ที่อยู่บริษัท (Address)</p>
          <p>: {studentEnrollments?.student_training.company.companyAddress}</p>
        </div>
      </div>
    </div>
  );
};
export const Approval = ({ id }: { id: number }) => {
  const { count } = useViewModel(id);
  return (
    <div>
      <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
        การรับรอง
      </h1>
      <div className="flex justify-between my-2">
        <p className="text-lg font-bold text-secondary-600">อาจารย์ประจำวิชา</p>
        <div>
          <p className="text-xl font-bold">
            {count?.instructors.approved ? "อนุมัติ" : "ไม่อนุมัติ"}
          </p>
        </div>
      </div>
      <div className="flex justify-between my-2">
        <p className="text-lg font-bold text-secondary-600">คณะกรรมการ</p>
        <div className="text-right">
          <div>
            <p className="text-xl font-bold">
              {count?.committee.approved}/{count?.committee.total} อนุมัติ
            </p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {count?.committee?.rejected}/{count?.committee?.total} ไม่อนุมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the new EvaluationStatus component
export { EvaluationStatus } from './EvaluationStatus';

// Export the new DataStalenessIndicator components
export { DataStalenessIndicator, CompactDataStalenessIndicator } from './DataStalenessIndicator';
