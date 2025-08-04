import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { Checkbox, FormControl, TextField, Autocomplete } from "@mui/material";
import {
  FilterAlt,
  AddRounded,
  EditNoteRounded,
  DeleteForeverRounded,
} from "@mui/icons-material";

const AddPerson = () => {
  const data = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example .com",
      phone: "123-456-7890",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane @example.com",
      phone: "987-654-3210",
    },
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@example",
      phone: "555-555-5555",
    },
  ];
  return (
    <Layout
      header={[{ path: PROTECTED_PATH.ADD_PERSON, name: "อัปโหลดรายชื่อ" }]}
    >
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
          <div className="flex justify-between my-3">
            <div>
              <p className="ms-5 text-xl text-black">รายชื่อ</p>
            </div>
            <div className="flex gap-4 text-white">
              <button className="primary-button bg-gradient">
                <AddRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">อับโหลดรายชื่อ</p>
              </button>

              <button className="primary-button bg-gradient">
                <EditNoteRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">แก้ไข</p>
              </button>
              <button className="primary-button bg-gradient">
                <DeleteForeverRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">ลบ</p>
              </button>
            </div>
          </div>
          <Table
            header={[
              "",
              "ชื่อ",
              "รหัส",
              "สาขาวิชา",
              "ตำแหน่ง",
              "ข้อมูลเพิ่มเติม",
            ]}
            data={data.map((item, index) => (
              <tr key={index}>
                <td className="ps-5">
                  <FormControl component="fieldset" variant="standard">
                    <Checkbox />
                  </FormControl>
                </td>
                <td>{item.lastName}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
              </tr>
            ))}
          />
        </div>
      </div>
    </Layout>
  );
};
export default AddPerson;
