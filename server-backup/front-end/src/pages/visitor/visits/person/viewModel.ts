import { useEffect, useState, useCallback } from "react";
import { VisitorService } from "../../../../service/api/visitor";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
  VisitorScheduleReportInterface,
} from "../../../../service/api/visitor/type";
import Swal from "sweetalert2";

const useViewModel = (id: number) => {
  const visitorService = new VisitorService();
  const [visitors_schedule, setVisitorsSchedule] = useState<VisitorInterface>();
  const [visitor_schedule_report, setVisitorsScheduleReport] =
    useState<VisitorScheduleReportInterface>();
  const [report_initialValues, setReportInitialValues] = useState<{
    picture: { slot: number; value: File | string | null }[];
    comment: string;
  }>({
    picture: [{ slot: 0, value: "" }],
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
          picture: res.photos?.map((data) => {
            return {
              slot: data.photoNo,
              value: "/" + data.fileUrl,
            };
          }),
          comment: res.comment || "",
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchVisitorSchedule();
  }, []);
  const handleSubmit = async (
    values: VisitorScheduleDTO,
    file: { value: File | string | null; slot: number }[]
  ) => {
    try {
      const form = new FormData();

      file.forEach(({ value, slot }) => {
        if (value instanceof File) {
          form.append("photos[]", value); // File objects only for changed slots
          form.append("photo_nos[]", String(slot)); // 1..N
        }
      });

      await visitorService.reqPutVisitorSchedule(schedule_report_id, values);

      await visitorService.reqPutVisitorSchedulePicture(
        schedule_report_id,
        form
      );
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
    } catch (err) {
      Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ปิด",
        confirmButtonColor: "#966033",
      });
      console.error(err);
      throw err;
    } finally {
      fetchVisitorSchedule();
    }
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
