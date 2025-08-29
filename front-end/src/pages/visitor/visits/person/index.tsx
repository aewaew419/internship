import { Layout } from "../../../../component/layout";
import { useSearchParams } from "react-router-dom";
import useViewModel from "./viewModel";
import { Formik, Form } from "formik";
import { AutoCompleteField, Field } from "../../../../component/input/field";
import { Dropzone } from "../../../../component/input/dropzone";
import { useEffect, useState } from "react";

import type {
  VisitorScheduleReportInterface,
  VisitorScheduleDTO,
} from "../../../../service/api/visitor/type";
import { Persona, CoopInformation } from "../../../../component/information";
const VisitorVisitsPersons = () => {
  const [edit, setEdit] = useState(false);
  const [searchParams] = useSearchParams();
  const enroll_id = Number(searchParams.get("enroll_id"));
  const id = Number(searchParams.get("id"));
  const {
    visitors_schedule,
    report_initialValues,
    visitor_schedule_report,
    fetchVisitorScheduleReport,
    handleSubmit,
  } = useViewModel(id);
  const initialValues = { visit_id: 0 };
  return (
    <Layout header={[{ path: "", name: "ผลการนิเทศ" }]}>
      <div className="bg-white px-4 pb-4 mt-5 rounded-2xl">
        <div>
          <Persona id={enroll_id} />
          <CoopInformation id={enroll_id} />
        </div>
        <div className="mb-4 items-center gap-2 mt-5">
          <div className="text-sm opacity-70">
            ตารางนิเทศ: {visitors_schedule?.studentEnroll.student.name ?? "-"}
          </div>
          <div className="my-5 w-full">
            <Formik initialValues={initialValues} onSubmit={() => {}}>
              {({ values }) => {
                useEffect(() => {
                  fetchVisitorScheduleReport(Number(values.visit_id));
                }, [values]);
                return (
                  <Form>
                    <AutoCompleteField
                      name="visit_id"
                      label="ผลการนิเทศ"
                      items={
                        visitors_schedule?.schedules?.map((data) => {
                          return {
                            label: "ผลการนิเทศครั้งที่ " + data.visitNo,
                            value: Number(data.id),
                          };
                        }) || []
                      }
                    />
                  </Form>
                );
              }}
            </Formik>
          </div>
          <div className="my-5">
            {!edit && visitor_schedule_report && (
              <div>
                <div>
                  <p>ความคิดเห็น</p>
                  <p>{visitor_schedule_report.comment}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            {edit && visitor_schedule_report && (
              <ReportForm
                data={visitor_schedule_report}
                initialValues={report_initialValues}
                handleClose={() => setEdit(false)}
                handleSubmit={(values) => handleSubmit(values)}
              />
            )}
          </div>
          <div>
            {!edit && visitor_schedule_report && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEdit(true)}
              >
                แก้ไข
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default VisitorVisitsPersons;

type ReportFormType = {
  data: VisitorScheduleReportInterface;
  initialValues: {
    picture: string;
    comment: string;
  };
  handleSubmit: (values: VisitorScheduleDTO) => void;
  handleClose: () => void;
};
const ReportForm = (props: ReportFormType) => {
  return (
    <Formik
      initialValues={props.initialValues}
      onSubmit={(values) => {
        props.handleSubmit({
          visitor_training_id: props.data.visitorTrainingId,
          visit_no: props.data.visitNo,
          visit_at: props.data.visitAt,
          comment: values.comment,
        });
        props.handleClose();
      }}
    >
      {({ handleSubmit, setFieldValue }) => (
        <Form onSubmit={handleSubmit}>
          <Dropzone
            file={""}
            handleUpload={(file) => setFieldValue("company_image_1", file)}
            preview
          />
          <Field
            name="comment"
            label_th="ความคิดเห็นจากอาจารย์นิเทศ"
            placeholder="พิมพ์ข้อความ"
            multiline
            require
          />
          <div className="flex gap-3 justify-end mt-5">
            <button
              className="bg-gray-200 px-4 rounded-2xl"
              type="button"
              onClick={() => props.handleClose()}
            >
              ยกเลิก
            </button>
            <button className="secondary-button" type="submit">
              บันทึก
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
