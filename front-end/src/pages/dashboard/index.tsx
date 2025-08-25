import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { DouhnutChart } from "../../component/chart";
import { StudentProject } from "./section";

const Dashboard = () => {
  const step = [
    { topic: "กรอกข้อมูลสหกิจศึกษา", date: "7 มิ.ย. 68 - 19 มิ.ย. 68" },
    {
      topic: "ยื่นเอกสาร ณ ห้องธุรการชั้น 4",
      date: "7 มิ.ย. 68 - 19 มิ.ย. 68",
    },
    { topic: "ยื่นเอกสารให้กับทางบริษัท", date: "7 มิ.ย. 68 - 19 มิ.ย. 68" },
    { topic: "สหกิจศึกษา", date: "7 มิ.ย. 68 - 19 มิ.ย. 68" },
    { topic: "กรอกหัวข้อโปรเจค", date: "7 มิ.ย. 68 - 19 มิ.ย. 68" },
    { topic: "อบรม", date: "7 มิ.ย. 68 - 19 มิ.ย. 68" },
  ];
  return (
    <Layout header={[{ path: PROTECTED_PATH.DASHBOARD, name: "หน้าแรก" }]}>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <div className="bg-white p-4 rounded-2xl my-4">
            <p className="text-secondary-600 font-bold text-xl">
              กำหนดการใกล้ถึง
            </p>
            <div className="grid grid-cols-8 gap-4">
              <div className="text-right mt-auto">
                <p>11 มิ.ย. 2568</p>
              </div>
              <div className="col-span-7">
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
              </div>
            </div>
            <hr className="mt-7 mb-5 text-text-50" />
            <div className="grid grid-cols-8 gap-4">
              <div className="text-right mt-auto">
                <p>11 มิ.ย. 2568</p>
              </div>
              <div className="col-span-7">
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-12 bg-text-50 rounded-lg px-5 py-3">
                  <div className="col-span-2">
                    <p>9:00 - 16:30</p>
                  </div>
                  <div className="col-span-8">
                    <p className="font-semibold">
                      ยื่นเอกสาร ณ ห้องธุรการชั้น 4
                    </p>
                  </div>
                  <div>
                    <p>ธุรการ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl my-4">
            <p className="text-secondary-600 font-bold text-xl">
              สถานะการยื่นขอฝึกงานของฉัน
            </p>
            <div className="text-primary-900 font-medium flex px-3 py-3 my-2 bg-primary-50 rounded">
              <p>เอกสาร 6400224415</p>
              <p className="mx-auto font-semibold">อยู่ระหว่างการพิจารณา</p>
              <p>อาจารย์ประจำวิชา</p>
            </div>
          </div>
          <StudentProject />
          <div className="bg-white p-4 rounded-2xl my-4">
            <p className="text-secondary-600 font-bold text-xl">
              จำนวนนักศึกษาที่ส่งเอกสารฝึกงาน
            </p>
            <div className="bg-white shadow-lg mx-10 my-8 py-5 rounded-2xl">
              <div className="w-[400px] mx-auto mb-5">
                <DouhnutChart />
              </div>
              <div>
                <div className="grid grid-cols-6 mx-auto">
                  <div className="flex gap-2 col-span-4 col-start-2">
                    <div className="my-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle cx="8" cy="8" r="6" fill="#344BFD" />
                      </svg>
                    </div>
                    <p className="font-semibold my-auto">เอกสารผ่านแล้ว</p>
                  </div>
                  <div>
                    <p className="font-semibold text-black">60%</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 mx-auto">
                  <div className="flex gap-2 col-span-4 col-start-2">
                    <div className="my-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle cx="8" cy="8" r="6" fill="#F4A79D" />
                      </svg>
                    </div>
                    <p className="font-semibold my-auto">รอการพิจารณา</p>
                  </div>
                  <div>
                    <p className="font-semibold text-black">20%</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 mx-auto">
                  <div className="flex gap-2 col-span-4 col-start-2">
                    <div className="my-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle cx="8" cy="8" r="6" fill="#F68D2B" />
                      </svg>
                    </div>
                    <p className="font-semibold my-auto">กำลังเลือกบริษัท</p>
                  </div>
                  <div>
                    <p className="font-semibold text-black">20%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white p-4 rounded-2xl my-4">
            <p className="text-secondary-600 font-bold text-xl">
              ขั้นตอนการยื่นสหกิจศึกษา
            </p>
            <div className="mt-5 mb-3">
              {step.map((data, index) => (
                <div key={index}>
                  <div className="flex gap-3">
                    <div className="relative">
                      <p className="absolute "></p>
                      <div className="absolute bg-primary-700 w-10 h-10 rounded-full">
                        <p
                          className={`font-bold text-white ${
                            index === 0 ? "px-4" : "px-3.5"
                          } py-2`}
                        >
                          {index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="ms-10">
                      <p className="font-semibold"> {data.topic}</p>
                      <p className="text-sm"> {data.date}</p>
                    </div>
                  </div>
                  {index != step.length - 1 && (
                    <div className="bg-primary-700 w-[1px] h-14 mt-1 mb-2 ms-4.5"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Dashboard;
