import { Layout, PopupLayout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { Checkbox, FormControl, TextField, Autocomplete } from "@mui/material";
import {
  FilterAlt,
  AddRounded,
  EditNoteRounded,
  DeleteForeverRounded,
  CancelRounded,
  FileUploadRounded,
  ReadMoreRounded,
} from "@mui/icons-material";
import { useState } from "react";
import { Dropzone } from "../../component/input/dropzone";
import useViewModel from "./viewModel";
import { useNavigate } from "react-router-dom";

const AddPerson = () => {
  //   const { handleOnSubmitXLSX } = useViewModel();
  const navigate = useNavigate();

  const [editUser, setEditUser] = useState<"" | "upload" | "edit" | "delete">(
    ""
  );
  const [isUploadExcel, setIsUploadExcel] = useState(false);
  return (
    <Layout
      header={[{ path: PROTECTED_PATH.UPLOAD_LIST, name: "อัปโหลดรายชื่อ" }]}
    >
      {editUser && (
        <PopupLayout>
          <div>
            <div className="flex justify-between">
              <p className="text-xl font-semibold my-auto text-secondary-600">
                {editUser === "upload" && "อัปโหลดรายชื่อ"}
                {editUser === "edit" && "แก้ไข"}
                {editUser === "delete" && "ลบรายชื่อ"}
              </p>
              <div
                onClick={() => {
                  setEditUser("");
                  setIsUploadExcel(false);
                }}
              >
                <CancelRounded
                  fontSize="large"
                  className="text-primary-600 cursor-pointer"
                />
              </div>
            </div>
            <div className="w-fit mx-auto my-16">
              {!isUploadExcel && (
                <button
                  className="primary-button bg-gradient font-bold text-2xl"
                  onClick={() => setIsUploadExcel(true)}
                >
                  <FileUploadRounded fontSize="large" />
                  อับโหลดExcel
                </button>
              )}
            </div>

            {editUser === "upload" && isUploadExcel && <AddUser />}
          </div>
        </PopupLayout>
      )}
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
            <div className="flex gap-4 text-white">
              <button
                className="primary-button bg-gradient w-48"
                onClick={() => setEditUser("upload")}
              >
                <AddRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">อับโหลดรายชื่อ</p>
              </button>

              <button
                className="primary-button bg-gradient w-48"
                onClick={() => setEditUser("edit")}
              >
                <EditNoteRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">แก้ไข</p>
              </button>
              <button
                className="primary-button bg-gradient w-48"
                onClick={() => setEditUser("delete")}
              >
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
            data={
              <p></p>
              //     data.map((item, index) => (
              //   <tr key={index} className="border-b border-x border-text-200">
              //     <td className="ps-5 py-3">
              //       <FormControl component="fieldset" variant="standard">
              //         <Checkbox />
              //       </FormControl>
              //     </td>
              //     <td>{item.firstName}</td>
              //     <td>{item.code}</td>
              //     <td>{item.major}</td>
              //     <td>{item.role}</td>
              //     <td>{item.other}</td>
              //   </tr>
              // ))
            }
          />
        </div>
      </div>
    </Layout>
  );
};
export default AddPerson;

const AddUser = () => {
  const {
    xlsxFile,
    handleUploadXLSX,
    handleOnSubmitXLSX,
    submitting,
    roleIdForAll,
    setRoleIdForAll,
    result,
  } = useViewModel();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">กำหนด Role ทั้งไฟล์:</label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={roleIdForAll === "" ? "" : String(roleIdForAll)}
            onChange={(e) =>
              setRoleIdForAll(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- ไม่กำหนด --</option>
            <option value="1">Staff (1)</option>
            <option value="2">Instructor (2)</option>
            <option value="3">Student (3)</option>
          </select>
        </div>
      </div>

      <Dropzone
        file={xlsxFile}
        handleUpload={handleUploadXLSX}
        // make sure your Dropzone passes this "accept" through to react-dropzone
      />

      <button
        onClick={handleOnSubmitXLSX}
        type="button"
        className="primary-button bg-gradient font-semibold"
        disabled={!xlsxFile || submitting}
      >
        {submitting ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
      </button>

      {result && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-semibold">ผลลัพธ์</p>
          <p>สร้างใหม่: {result.created_count}</p>

          {result.skipped?.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">ข้าม ({result.skipped.length})</p>
              <ul className="list-disc ml-5">
                {result.skipped.slice(0, 5).map((s: any, i: number) => (
                  <li key={i}>
                    {s.email || "-"} — {s.reason}
                  </li>
                ))}
                {result.skipped.length > 5 && <li>...</li>}
              </ul>
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="mt-2 text-red-700">
              <p className="font-semibold">
                ข้อผิดพลาด ({result.errors.length})
              </p>
              <ul className="list-disc ml-5">
                {result.errors.slice(0, 5).map((e: any, i: number) => (
                  <li key={i}>
                    {e.email || "-"} — {e.reason}
                  </li>
                ))}
                {result.errors.length > 5 && <li>...</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
