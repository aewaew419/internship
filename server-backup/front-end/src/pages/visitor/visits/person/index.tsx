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
                <div className="flex gap-5 flex-wrap justify-center">
                  {visitor_schedule_report?.photos?.map((photo) => (
                    <img
                      src={
                        import.meta.env.VITE_APP_API_V1 + "/" + photo.fileUrl
                      }
                      className="h-80"
                    />
                  ))}
                </div>
                <div className="ms-10">
                  <p>ความคิดเห็น</p>
                  <p>{visitor_schedule_report.comment || "-"}</p>
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
                handleSubmit={(values, picture) =>
                  handleSubmit(values, picture)
                }
              />
            )}
          </div>
          <div>
            {!edit && visitor_schedule_report && (
              <div className="ms-auto w-fit mr-10">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setEdit(true)}
                >
                  แก้ไข
                </button>
              </div>
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
    picture: { slot: number; value: File | string | null }[];
    comment: string;
  };
  handleSubmit: (
    values: VisitorScheduleDTO,
    file: { value: File | string | null; slot: number }[]
  ) => void;
  handleClose: () => void;
};
const ReportForm = (props: ReportFormType) => {
  return (
    <Formik
      initialValues={props.initialValues}
      enableReinitialize
      onSubmit={(values, { resetForm }) => {
        props.handleSubmit(
          {
            visitor_training_id: props.data.visitorTrainingId,
            visit_no: props.data.visitNo,
            visit_at: props.data.visitAt,
            comment: values.comment,
          },
          values.picture
        );
        resetForm();
        props.handleClose();
      }}
    >
      {({ handleSubmit, setFieldValue, values }) => {
        const slots = [0, 1, 2];

        const getPhoto = (slot: number) => {
          const item = values.picture.find((p) => p.slot === slot);

          return item?.value || "";
        };

        const setPhoto = (slot: number, newVal: File | string | null) => {
          const idx = values.picture.findIndex((p) => p.slot === slot);
          if (idx === -1) {
            setFieldValue("picture", [
              ...values.picture,
              { slot, value: newVal },
            ]);
          } else {
            setFieldValue(`picture[${idx}].value`, newVal);
          }
        };
        return (
          <Form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-5">
              {slots.map((slot) => (
                <Dropzone
                  key={slot}
                  file={getPhoto(slot)}
                  preview
                  handleUpload={(file) => setPhoto(slot, file)}
                />
              ))}
            </div>
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
        );
      }}
    </Formik>
  );
};
