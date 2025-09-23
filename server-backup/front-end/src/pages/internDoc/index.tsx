import { Layout } from "../../component/layout";
import { TextField, Autocomplete } from "@mui/material";
import { FilterAlt, ReadMoreRounded } from "@mui/icons-material";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { useNavigate } from "react-router-dom";
import useViewModel from "./viewModel";
const InternDoc = () => {
  const { rows } = useViewModel();
  const navigate = useNavigate();

  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน  / สหกิจศึกษา" }]}>
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
                  label="สาขาวิชา"
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
                  label="สถานะ"
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
              "ชื่อนักศึกษา",
              "รหัสนักศึกษา",
              "สาขาวิชา",
              "ชื่อบริษัท",
              "ตำแหน่งงาน",
              "สถานะ",
              "ข้อมูลเพิ่มเติม",
            ]}
            data={rows.map((item, index) => (
              <tr key={index} className="border-b border-x border-text-200">
                <td className="ps-4 py-5">{item.student.name}</td>
                <td>{item.student?.studentId}</td>
                <td>{item.student.program?.programNameTh}</td>
                <td>{item.student_training?.company?.companyNameTh}</td>
                <td>{item.student_training?.position}</td>
                <td>
                  <div className="bg-[#BDCAFF] w-fit rounded-full px-2 py-1 flex gap-3">
                    <p>approve </p>
                    <div className="bg-[#5C6FBC] h-4 w-4 rounded-full my-auto"></div>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() =>
                      navigate(
                        PROTECTED_PATH.INTERN_DOC_PERSON + `?id=${item.id}`
                      )
                    }
                  >
                    <ReadMoreRounded className="text-primary-600" />
                  </button>
                </td>
              </tr>
            ))}
          />
        </div>
      </div>
    </Layout>
  );
};
export default InternDoc;
