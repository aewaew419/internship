import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { Checkbox, FormControl, TextField, Autocomplete } from "@mui/material";
import { FilterAlt, ReadMoreRounded, PrintRounded } from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
const SupervisorReport = () => {
  const navigate = useNavigate();
  const data = [
    {
      firstName: "นาย A",
      code: "64000000",
      company: "บริษัท A",
      role: "ชื่อตำแหน่งงาน",
      professor: "อาจารย์นิเทศ",
      status: "ยังไม่นัดหมาย",
      other: (
        <button onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST_PERSON)}>
          <ReadMoreRounded className="text-primary-600" />
        </button>
      ),
    },
    {
      firstName: "นาย A",
      code: "64000000",
      company: "บริษัท A",
      role: "ชื่อตำแหน่งงาน",
      professor: "อาจารย์นิเทศ",
      status: "นัดหมาย 2 ครั้ง",
      other: (
        <button onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST_PERSON)}>
          <ReadMoreRounded className="text-primary-600" />
        </button>
      ),
    },
    {
      firstName: "นาย A",
      code: "64000000",
      company: "บริษัท A",
      role: "ชื่อตำแหน่งงาน",
      professor: "อาจารย์นิเทศ",
      status: "นัดหมาย 2 ครั้ง",
      other: (
        <button onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST_PERSON)}>
          <ReadMoreRounded className="text-primary-600" />
        </button>
      ),
    },
  ];
  return (
    <Layout header={[{ path: "", name: "รายงานผลการนิเทศ" }]}>
      <div className="bg-white p-4 mt-4 rounded-lg">
        <h1 className="text-xl font-bold text-secondary-600">ค้นหารายชื่อ</h1>

        <div className="flex gap-3 my-5">
          <div className="w-80">
            <TextField
              name="search"
              placeholder="ชื่อ-สกุล, รหัสประจำตัว"
              label="ค้นหา"
              size="small"
              fullWidth
            />
          </div>
          <div className="w-60">
            <Autocomplete
              options={[]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ตำแหน่ง"
                  placeholder="กรุณาเลือก"
                  size="small"
                />
              )}
            />
          </div>
          <div className="w-60">
            <Autocomplete
              options={[]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="สาขาวิชา"
                  placeholder="กรุณาเลือก"
                  size="small"
                />
              )}
            />
          </div>
          <div className="my-auto">
            <FilterAlt />
          </div>
        </div>
        <div className="w-full mt-16">
          <div className="flex justify-between my-5">
            <div>
              <p className="ms-5 text-xl text-black">รายชื่อ</p>
            </div>
          </div>
          <Table
            header={[
              "ชื่อ",
              "รหัส",
              "ชื่อบริษัท",
              "อาจารย์นิเทศ",
              "ตำแหน่งงาน",
              "นัดหมาย",
              "ข้อมูลเพิ่มเติม",
            ]}
            data={data.map((item, index) => (
              <tr key={index} className="border-b border-x border-text-200">
                <td className="ps-5 py-6 flex">{item.firstName}</td>

                <td>{item.code}</td>
                <td>{item.company}</td>
                <td>{item.professor}</td>
                <td>{item.role}</td>
                <td>
                  <div className="bg-[#BDCAFF] w-fit rounded-full px-2 py-1 flex gap-3">
                    <p>{item.status} </p>
                    <div className="bg-[#5C6FBC] h-4 w-4 rounded-full my-auto"></div>
                  </div>
                </td>
                <td>{item.other}</td>
              </tr>
            ))}
          />
        </div>
      </div>
    </Layout>
  );
};
export default SupervisorReport;
