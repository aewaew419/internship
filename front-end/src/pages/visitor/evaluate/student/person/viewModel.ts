import { useState, useEffect } from "react";
import { VisitorService } from "../../../../../service/api/visitor";
import type {
  VisitorEvaluateStudentInterface,
  VisitorEvaluateStudentDTO,
} from "../../../../../service/api/visitor/type";

import { useNavigate } from "react-router-dom";
import { PROTECTED_PATH } from "../../../../../constant/path.route";

import Swal from "sweetalert2";

const useViewModel = (id: number) => {
  const visitorService = new VisitorService();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<VisitorEvaluateStudentInterface[]>(
    []
  );
  const handleOnsubmit = async (entity: VisitorEvaluateStudentDTO) => {
    try {
      await visitorService
        .reqPutVisitorEvaluateStudent(id, entity)
        .then((response) => console.log(response));

      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      navigate(PROTECTED_PATH.VISITOR_EVALUATE_STUDENT);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      throw err;
    }
  };
  useEffect(() => {
    visitorService
      .reqGetVisitorEvaluateStudent(id)
      .then((response) => setVisitors(response));
  }, []);
  return { visitors, handleOnsubmit };
};
export default useViewModel;
