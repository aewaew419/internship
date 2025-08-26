import { useEffect, useState, useCallback } from "react";
import { VisitorService } from "../../../../service/api/visitor";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
  VisitorScheduleReportInterface,
} from "../../../../service/api/visitor/type";
const useViewModel = (id: number) => {
  const visitorService = new VisitorService();
  const [visitors_schedule, setVisitorsSchedule] = useState<VisitorInterface>();
  const [visitor_schedule_report, setVisitorsScheduleReport] =
    useState<VisitorScheduleReportInterface>();
  const [report_initialValues, setReportInitialValues] = useState<{
    picture: string;
    comment: string;
  }>({
    picture: "",
    comment: "",
  });
  const [schedule_report_id, setScheduleReportId] = useState<number>(0);

  const fetchVisitorSchedule = useCallback(async () => {
    const res = await visitorService.reqGetVisitorSchedule(id);
    setVisitorsSchedule(res);
  }, [id]);

  const fetchVisitorScheduleReport = async (schedule_id: number) => {
    setScheduleReportId(schedule_id);
    await visitorService
      .reqGetVisitorScheduleReport(schedule_id)
      .then((res) => {
        setVisitorsScheduleReport(res);
        setReportInitialValues({
          picture: "",
          comment: res.comment || "",
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchVisitorSchedule();
  }, []);
  const handleSubmit = (values: VisitorScheduleDTO) => {
    visitorService
      .reqPutVisitorSchedule(schedule_report_id, values)
      .then(() => fetchVisitorSchedule())
      .catch((err) => console.log(err));
  };

  return {
    visitors_schedule,
    visitor_schedule_report,
    report_initialValues,
    handleSubmit,
    fetchVisitorScheduleReport,
  };
};
export default useViewModel;
