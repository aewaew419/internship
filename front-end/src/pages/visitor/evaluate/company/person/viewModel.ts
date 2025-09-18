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
  const handleOnsubmit = (entity: VisitorEvaluateStudentDTO) => {
    visitorService
      .reqPutVisitorEvaluateCompany(id, entity)
      .then((response) => {
        console.log(response);
        // Refresh data after successful submission
        visitorService
          .reqGetVisitorEvaluateCompany(id)
          .then((response) => setVisitors(response));
      })
      .catch((error) => {
        console.error("Error submitting evaluation:", error);
      });
  };
  useEffect(() => {
    visitorService
      .reqGetVisitorEvaluateCompany(id)
      .then((response) => setVisitors(response));
  }, []);
  return { visitors, handleOnsubmit };
};
export default useViewModel;
