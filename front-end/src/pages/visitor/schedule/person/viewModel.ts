// viewModel.ts
import { useState, useEffect, useCallback } from "react";
import { VisitorService } from "../../../../service/api/visitor";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
} from "../../../../service/api/visitor/type";

const useViewModel = (training_id: number) => {
  const visitorService = new VisitorService();
  const [visitors_schedule, setVisitorsSchedule] = useState<VisitorInterface>();

  const initialValues = {
    visit_no: "",
    visit_at: "",
    comment: "",
  };

  const fetchIt = useCallback(async () => {
    const res = await visitorService.reqGetVisitorSchedule(training_id);
    setVisitorsSchedule(res);
  }, [training_id]);

  const handleSubmit = (values: VisitorScheduleDTO, id?: number) => {
    if (!id) {
      visitorService
        .reqPostVisitorSchedule(values)
        .then(() => fetchIt())
        .catch((err) => console.log(err));
    } else {
      visitorService
        .reqPutVisitorSchedule(id, values)
        .then(() => fetchIt())
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    if (training_id) fetchIt();
  }, []);

  return { visitors_schedule, refetch: fetchIt, initialValues, handleSubmit };
};

export default useViewModel;
