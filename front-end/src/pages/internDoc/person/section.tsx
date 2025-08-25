export const Persona = () => {
  return (
    <div>
      <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
        ข้อมูลส่วนตัว
      </h1>
      <div className="grid grid-cols-2 font-medium">
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อจริง-นามสกุล (Full-name)</p>
          <p>: นายรักดี จิตดี</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">รหัสนักศึกษา (Student ID)</p>
          <p>: 6400112233</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">คณะ (Faculty)</p>
          <p>: วิศวะกรรม</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">สาชาวิชา (Major)</p>
          <p>: คอมพิวเตอร์</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">เบอร์โทร (Tel.) </p>
          <p>: 081000000</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">อีเมล (Email) </p>
          <p>: Rak@gmail.com</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">เกรดเฉลี่ย (GPAX) </p>
          <p>: 3.85</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ประเภทที่เลือก (Type)</p>
          <p>: สหกิจศึกษา</p>
        </div>
      </div>
    </div>
  );
};
export const CoopInformation = () => {
  return (
    <div>
      <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
        ข้อมูลส่วนตัว
      </h1>
      <div className="grid grid-cols-2 font-medium">
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อบริษัท (Company name) </p>
          <p>: บริษัท ABC จำกัด</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">
            เลขทะเบียนพาณิชย์ (Registration no.)
          </p>
          <p> : 0105547002456</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">แผนก (Department)</p>
          <p>: IT</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ตำแหน่ง (Position) </p>
          <p>: IT</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ระยะเวลา (Duration) </p>
          <p>: 15 มิ.ย. 2568 – 15 ต.ค. 2568</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">อาจารย์นิเทศ (Academic advisor) </p>
          <p>: อาจารย์ A</p>
        </div>
        <div className="flex gap-2 my-2">
          <p className="text-secondary-600">ชื่อผู้ติดต่อ (Coordinator) </p>
          <p>: คุณ B</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">
            เบอร์ผู้ติดต่อ (Coordinator tel.)
          </p>
          <p>: 080-000-0000</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ชื่อหัวหน้า (Supervisor)</p>
          <p>: คุณ C</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">เบอรหัวหน้า (Supervisor tel.)</p>
          <p>: 081-000-0000</p>
        </div>
        <div className="flex gap-2 my-2 col-start-1">
          <p className="text-secondary-600">ที่อยู่บริษัท (Address)</p>
          <p>: 1/11 ต.สุเทพ อ.เมือง จ.เชียงใหม่</p>
        </div>
      </div>
    </div>
  );
};
