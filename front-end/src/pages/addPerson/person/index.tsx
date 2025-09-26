import { TextField } from "@mui/material";
import { Layout } from "../../../component/layout";
import {
  CancelRounded,
  EditNoteRounded,
  UploadFileRounded,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../constant/path.route";

const PersonInformation = () => {
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  return (
    <Layout header={[{ path: "", name: "อัปโหลดรายชื่อ  > นายรักดี จิตดี " }]}>
      <div className="bg-white p-4 mt-4 rounded-lg">
        <div className="flex justify-between mb-5">
          <h1 className="text-xl font-bold text-secondary-600">
            ข้อมูลส่วนตัว
          </h1>
          <div onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST)}>
            <CancelRounded
              fontSize="large"
              className="text-secondary-600 cursor-pointer"
            />
          </div>
        </div>
        <div className="text-secondary-600 grid grid-cols-2 w-3/4 gap-3">
          <div>
            <p className="text-lg font-medium">ชื่อ</p>
            <p className="text-sm -mt-1.5 mb-1">First name</p>
            <TextField
              size="small"
              value={"รักดี"}
              disabled={!isEdit}
              fullWidth
            />
          </div>
          <div>
            <p className="text-lg font-medium">นามสกุล</p>
            <p className="text-sm -mt-1.5 mb-1">Last name</p>
            <TextField
              size="small"
              value={"จิตดี"}
              disabled={!isEdit}
              fullWidth
            />
          </div>
          <div>
            <p className="text-lg font-medium">รหัส</p>
            <p className="text-sm -mt-1.5 mb-1">ID</p>
            <TextField
              size="small"
              value={"6400112233"}
              disabled={!isEdit}
              fullWidth
            />
          </div>
          <div>
            <p className="text-lg font-medium">หลักสูตร</p>
            <p className="text-sm -mt-1.5 mb-1">Course</p>
            <TextField
              size="small"
              value={"คอมพิวเตอร์"}
              disabled={!isEdit}
              fullWidth
            />
          </div>
          <div>
            <p className="text-lg font-medium">ชั้นปี</p>
            <p className="text-sm -mt-1.5 mb-1">Year of college</p>
            <TextField size="small" value={"4"} disabled={!isEdit} fullWidth />
          </div>
          <div>
            <p className="text-lg font-medium">ปีการศึกษา</p>
            <p className="text-sm -mt-1.5 mb-1">Year</p>
            <TextField
              size="small"
              value={"2564"}
              disabled={!isEdit}
              fullWidth
            />
          </div>
        </div>
        <div>
          <div className="my-5">
            <h1 className="text-xl font-bold text-secondary-600">
              ข้อมูลการติดต่อ
            </h1>
          </div>
          <div className="text-secondary-600 grid grid-cols-2 w-3/4 gap-3">
            <div>
              <p className="text-lg font-medium">เบอร์โทรศัพท์</p>
              <p className="text-sm -mt-1.5 mb-1">Phone number</p>
              <TextField
                size="small"
                value={"081000000"}
                disabled={!isEdit}
                fullWidth
              />
            </div>
            <div>
              <p className="text-lg font-medium">อีเมล</p>
              <p className="text-sm -mt-1.5 mb-1">Email</p>
              <TextField
                size="small"
                value={"Jitdee@gmail.com"}
                disabled={!isEdit}
                fullWidth
              />
            </div>
          </div>
        </div>
        <div>
          <div className="my-5">
            <h1 className="text-xl font-bold text-secondary-600">รหัสผ่าน</h1>
          </div>
          <div className="text-secondary-600 grid grid-cols-2 w-3/4 gap-3">
            <div>
              <p className="text-lg font-medium">รหัสผ่านปัจจุบัน</p>
              <p className="text-sm -mt-1.5 mb-1">Current password</p>
              <TextField
                size="small"
                value={"081000000"}
                disabled={!isEdit}
                fullWidth
                type="password"
              />
            </div>
            {isEdit && (
              <div>
                <p className="text-lg font-medium">รหัสผ่านใหม่</p>
                <p className="text-sm -mt-1.5 mb-1">New password</p>
                <TextField
                  size="small"
                  value={"Jitdee@gmail.com"}
                  disabled={!isEdit}
                  fullWidth
                  type="password"
                />
              </div>
            )}
          </div>
        </div>
        <div className="my-3 ml-auto w-fit mr-5">
          {isEdit ? (
            <button
              className="primary-button bg-gradient"
              onClick={() => setIsEdit(false)}
            >
              <UploadFileRounded />
              <p>ยืนยันและบันทึก</p>
            </button>
          ) : (
            <button
              className="primary-button bg-gradient"
              onClick={() => setIsEdit(true)}
            >
              <EditNoteRounded />
              <p>แก้ไขข้อมูล</p>
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default PersonInformation;
