import { PROTECTED_PATH } from "../../constant/path.route";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Settings,
  LoginRounded,
  PersonAddRounded,
  AssignmentInd,
  DocumentScannerRounded,
  DescriptionRounded,
  LocationCityRounded,
  RateReviewRounded,
} from "@mui/icons-material";
export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const NavItem = [
    { name: "หน้าแรก", path: PROTECTED_PATH.DASHBOARD, icon: <Home /> },
    {
      name: "อัปโหลดรายชื่อ",
      path: PROTECTED_PATH.ADD_PERSON,
      icon: <PersonAddRounded />,
    },
    {
      name: "เอกสารขอสหกิจศึกษา / ฝึกงาน",
      path: "",
      icon: <DescriptionRounded />,
    },
    { name: "นัดหมายนิเทศ", path: "", icon: <AssignmentInd /> },
    { name: "รายงานผลการนิเทศ", path: "", icon: <LocationCityRounded /> },
    { name: "รายงานสรุปผลรวม", path: "", icon: <DocumentScannerRounded /> },
    {
      name: "รายงานการประเมินสถานประกอบการ",
      path: "",
      icon: <RateReviewRounded />,
    },
    { name: "ตั้งค่า", path: PROTECTED_PATH.SETTING, icon: <Settings /> },
  ];
  return (
    <nav className="bg-white">
      <div className="container">
        <div className="py-5 mx-5 border-b-2 border-text-200">
          <img src="/logo.png" alt="img" className="h-16" />
        </div>
        <div className="space-x-4">
          <ul className="mx-5">
            {NavItem.map((item) => (
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
    <div className="min-h-screen flex ">
      <Navbar />
      <main className="flex-1 container mx-auto p-4">
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
