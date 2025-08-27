import { useState, useEffect } from "react";
import { VisitorService } from "../../../../../service/api/visitor";
import type {
  VisitorEvaluateStudentInterface,
  VisitorEvaluateStudentDTO,
} from "../../../../../service/api/visitor/type";
const useViewModel = (id: number) => {
  const visitorService = new VisitorService();
  const [visitors, setVisitors] = useState<VisitorEvaluateStudentInterface[]>(
    []
  );
  const handleOnsubmit = (entity: VisitorEvaluateStudentDTO) => {
    visitorService
      .reqPutVisitorEvaluateCompany(id, entity)
      .then((response) => console.log(response));
  };
  useEffect(() => {
    visitorService
      .reqGetVisitorEvaluateCompany(id)
      .then((response) => setVisitors(response));
  }, []);
  return { visitors, handleOnsubmit };
};
export default useViewModel;
