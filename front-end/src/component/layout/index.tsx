import { PROTECTED_PATH } from "../../constant/path.route";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Settings,
  LoginRounded,
  PersonAddRounded,
  AssignmentInd,
  DocumentScannerRounded,
  ArticleRounded,
  DescriptionRounded,
  LocationCityRounded,
  RateReviewRounded,
} from "@mui/icons-material";
export const Navbar = () => {
  const role: "Admin" | "Student" | "Instructor" | "Committee" | "Visitor" =
    "Instructor";
  const navigate = useNavigate();
  const location = useLocation();
  const StudentNav = [
    { name: "หน้าแรก", path: PROTECTED_PATH.DASHBOARD, icon: <Home /> },
    {
      name: "ยื่นขอสหกิจศึกษา / ฝึกงาน",
      path: PROTECTED_PATH.INTERN_REQUEST,
      icon: <Home />,
    },
    {
      name: "รายละเอียดโปรเจกต์",
      path: PROTECTED_PATH.PROJECT_INFO,
      icon: <ArticleRounded />,
    },
    {
      name: "แบบประเมิน",
      path: PROTECTED_PATH.EVALUTAE_COMPANY,
      icon: <RateReviewRounded />,
    },
    {
      name: "เปลี่ยนรหัสผ่าน",
      path: PROTECTED_PATH.SETTING_PASSWORD,
      icon: <Settings />,
    },
  ];
  const AdminNav = [
    { name: "หน้าแรก", path: PROTECTED_PATH.DASHBOARD, icon: <Home /> },
    {
      name: "อัปโหลดรายชื่อ",
      path: PROTECTED_PATH.UPLOAD_LIST,
      icon: <PersonAddRounded />,
    },
    {
      name: "เอกสารขอสหกิจศึกษา / ฝึกงาน",
      path: PROTECTED_PATH.INTERN_DOC,
      icon: <DescriptionRounded />,
    },
    {
      name: "นัดหมายนิเทศ",
      path: PROTECTED_PATH.SUPERVISE_SCHEDULE,
      icon: <AssignmentInd />,
    },
    {
      name: "รายงานผลการนิเทศ",
      path: PROTECTED_PATH.SUPERVISE_REPORT,
      icon: <LocationCityRounded />,
    },
    {
      name: "รายงานสรุปผลรวม",
      path: PROTECTED_PATH.SUMMARY_REPORT,
      icon: <DocumentScannerRounded />,
    },
    {
      name: "รายงานการประเมินสถานประกอบการ",
      path: PROTECTED_PATH.COMPANY_EVALUAION,
      icon: <RateReviewRounded />,
    },
    { name: "ตั้งค่า", path: PROTECTED_PATH.SETTING, icon: <Settings /> },
  ];
  const InstructorNav = [
    { name: "หน้าแรก", path: PROTECTED_PATH.DASHBOARD, icon: <Home /> },
    {
      name: "รายการขอสหกิจศึกษา / ฝึกงาน",
      path: PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST,
      icon: <DescriptionRounded />,
    },
    {
      name: "มอบหมายอาจารย์นิเทศ",
      path: PROTECTED_PATH.ASSIGN_VISITOR,
      icon: <AssignmentInd />,
    },
    {
      name: "รายงานผลการนิเทศ",
      path: PROTECTED_PATH.COMPANY_EVALUAION,
      icon: <LocationCityRounded />,
    },
    {
      name: "รายงานสรุปผลรวม",
      path: PROTECTED_PATH.COMPANY_EVALUAION,
      icon: <DocumentScannerRounded />,
    },
    {
      name: "บันทึกเกรด",
      path: PROTECTED_PATH.COMPANY_EVALUAION,
      icon: <RateReviewRounded />,
    },
    // {
    //   name: "ยกเลิกสหกิจศึกษา / ฝึกงาน",
    //   path: PROTECTED_PATH.COMPANY_EVALUAION,
    //   icon: <Home />,
    // },
    {
      name: "การเข้าอบรม",
      path: PROTECTED_PATH.COMPANY_EVALUAION,
      icon: <Home />,
    },
  ];
  const ItemNav =
    // role === "Admin"
    //   ? AdminNav
    //   : role === "Student"
    //   ? StudentNav:
    InstructorNav;
  return (
    <nav className="bg-white fixed h-full">
      <div className="container">
        <div className="py-5 mx-5 border-b-2 border-text-200">
          <img src="/logo.png" alt="img" className="h-16" />
        </div>
        <div className="space-x-4">
          <ul className="mx-5">
            {ItemNav.map((item) => (
              <li
                onClick={() => navigate(item.path)}
                key={item.name}
                className={`${
                  location.pathname === item.path
                    ? "text-white bg-gradient"
                    : "hover:bg-gray-100"
                } flex gap-2 font-bold my-5 py-3 px-5 rounded-lg cursor-pointer transition-colors duration-300`}
              >
                {item.icon}
                <p className="ml-2 my-auto w-32 text-sm">{item.name}</p>
              </li>
            ))}
          </ul>
          <div className="mt-auto mx-5">
            <button
              onClick={() => navigate("/login")}
              className="w-full hover:bg-gray-100 text-error flex gap-2 font-bold my-5 pb-2 pt-3 px-5 rounded-lg cursor-pointer transition-colors duration-300"
            >
              <LoginRounded sx={{ margin: "auto 0" }} />
              <p>ออกจากระบบ</p>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export const Layout = ({
  children,
  header,
}: {
  children: React.ReactNode;
  header: { path: string; name: string }[];
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex">
      <Navbar />

      <main className="flex-1 container p-4 ms-64">
        <div className="border-b-2 border-text-200 mt-4">
          <p className="gradient-text text-xl font-extrabold my-4 w-fit">
            {header.map((item, key) => (
              <span key={item.path} onClick={() => navigate(item.path)}>
                {key === 0 ? "" : " > "}
                {item.name}
              </span>
            ))}
          </p>
        </div>
        {children}
      </main>
    </div>
  );
};
export const PopupLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000] backdrop-blur-xs">
      <div className="bg-white py-4 px-10 rounded-md w-3/4">{children}</div>
    </div>
  );
};
