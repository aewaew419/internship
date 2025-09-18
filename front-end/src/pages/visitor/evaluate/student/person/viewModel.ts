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
  const handleOnsubmit = (
    entity: VisitorEvaluateStudentDTO,
    isDraft = false
  ) => {
    // ตรวจสอบว่าประเมินครบทุกข้อหรือไม่ (เฉพาะเมื่อไม่ใช่การบันทึกร่าง)
    const hasIncompleteEvaluation = entity.scores.some(
      (score) => score === 0 || score === null || score === undefined
    );

    if (!isDraft && hasIncompleteEvaluation) {
      alert("กรุณาประเมินให้ครบทุกข้อก่อนส่งข้อมูล");
      return;
    }

    visitorService
      .reqPutVisitorEvaluateStudent(id, entity)
      .then((response) => {
        console.log(response);
        if (isDraft) {
          alert("บันทึกร่างเรียบร้อยแล้ว คุณสามารถกลับมาประเมินต่อได้ภายหลัง");
        } else {
          alert("บันทึกการประเมินเรียบร้อยแล้ว");
        }
      })
      .catch((error) => {
        console.error("Error submitting evaluation:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      });
  };
  useEffect(() => {
    visitorService
      .reqGetVisitorEvaluateStudent(id)
      .then((response) => setVisitors(response));
  }, []);
  return { visitors, handleOnsubmit };
};
export default useViewModel;
