import { useState, useEffect } from "react";
import { VisitorService } from "../../../../service/api/visitor";
import type { VisitorInterface } from "../../../../service/api/visitor/type";
const useViewModel = () => {
  const visitorService = new VisitorService();
  const [visitors, setVisitors] = useState<VisitorInterface[]>([]);

  useEffect(() => {
    visitorService.reqGetVisitor().then((response) => {
      setVisitors(response);
    });
  }, []);
  return {
    visitors,
  };
};
export default useViewModel;
