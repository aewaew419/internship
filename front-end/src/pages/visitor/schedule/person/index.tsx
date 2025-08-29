import { Layout } from "../../../../component/layout";
import { useSearchParams } from "react-router-dom";
import useViewModel from "./viewModel";
import { Formik, Form } from "formik";
import {
  AutoCompleteField,
  DatePickerField,
} from "../../../../component/input/field";
import { useState } from "react";
import dayjs from "dayjs";
import { Persona, CoopInformation } from "../../../../component/information";

type Mode =
  | { kind: "idle" }
  | { kind: "create" }
  | { kind: "edit"; id: number };

const VisitorSchedulePerson = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const enroll_id = Number(searchParams.get("enroll_id"));
  const { visitors_schedule, initialValues, handleSubmit } = useViewModel(id);

  const canAddMore = (visitors_schedule?.schedules?.length ?? 0) < 4;
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  return (
    <Layout header={[{ path: "", name: "นัดหมายการนิเทศ" }]}>
      <div className="bg-white px-4 pb-4 mt-5 rounded-2xl">
        <div>
          <Persona id={enroll_id} />
          <CoopInformation id={enroll_id} />
        </div>
        <div className="mb-4 flex items-center gap-2 mt-5">
          <div className="text-sm opacity-70">
            ตารางนิเทศ: {visitors_schedule?.studentEnroll.student.name ?? "-"}
          </div>
          <div className="ml-auto">
            <button
              type="button"
              className="px-3 py-1 rounded-full bg-primary-600 text-white disabled:opacity-50"
              onClick={() => setMode({ kind: "create" })}
              disabled={!canAddMore || mode.kind !== "idle"}
              title={!canAddMore ? "ครบ 4 ครั้งแล้ว" : ""}
            >
              + เพิ่มนัดหมาย
            </button>
          </div>
        </div>
        <div>
          {mode.kind === "create" && (
            <div className="border rounded-xl p-3 my-5">
              <ScheduleForm
                initialValues={initialValues}
                onCancel={() => setMode({ kind: "idle" })}
                onSubmit={(values) =>
                  handleSubmit({
                    visitor_training_id: id,
                    visit_no: Number(values.visit_no),
                    visit_at: dayjs(values.visit_at).format(
                      "YYYY-MM-DD HH:mm:ss"
                    ),
                    comment: "",
                  })
                }
              />
            </div>
          )}
          {visitors_schedule?.schedules.map((s) => {
            const isEditing = mode.kind === "edit" && mode.id === s.id;
            if (!isEditing) {
              return (
                <div
                  key={s.id}
                  className="border rounded-xl p-3 flex items-center gap-3 my-3"
                >
                  <div className="font-semibold">ครั้งที่ {s.visitNo}</div>
                  <div className="text-sm opacity-80">
                    {dayjs(s.visitAt).format("DD/MM") +
                      "/" +
                      (Number(dayjs(s.visitAt).format("YYYY")) + 543)}
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button
                      className="px-3 py-1 rounded-full border"
                      onClick={() => setMode({ kind: "edit", id: s.id })}
                    >
                      แก้ไข
                    </button>
                  </div>
                </div>
              );
            }

            const initialValueEdit = {
              visit_no: s.visitNo,
              visit_at: s.visitAt,
            };
            return (
              <div key={s.id} className="border rounded-xl p-3">
                <ScheduleForm
                  initialValues={initialValueEdit}
                  onCancel={() => setMode({ kind: "idle" })}
                  onSubmit={(values) => {
                    handleSubmit(
                      {
                        visitor_training_id: id,
                        visit_no: Number(values.visit_no),
                        visit_at: dayjs(values.visit_at).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ),
                        comment: "",
                      },
                      Number(s.id)
                    );
                  }}
                  edit
                />
              </div>
            );
          })}

          {(!visitors_schedule?.schedules ||
            visitors_schedule?.schedules.length === 0) &&
            mode.kind === "idle" && (
              <div className="text-sm opacity-70">
                ยังไม่มีนัดหมาย — คลิก “เพิ่มนัดหมาย” เพื่อสร้างรายการแรก
              </div>
            )}
        </div>
      </div>
    </Layout>
  );
};
export default VisitorSchedulePerson;

type ScheduleType = {
  onSubmit: (values: any) => void;
  initialValues: any;
  onCancel: () => void;
  edit?: boolean;
};
const ScheduleForm = (props: ScheduleType) => {
  return (
    <Formik
      enableReinitialize
      initialValues={props.initialValues}
      onSubmit={(values, { resetForm }) => {
        props.onSubmit(values);
        resetForm();
      }}
    >
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <div className="flex gap-5">
            <AutoCompleteField
              name="visit_no"
              label_th="ครั้งที่"
              placeholder="กรุณาเลือก"
              items={RoundDropdown}
              disabled={props.edit}
            />
            <DatePickerField
              name="visit_at"
              label_th="วันเวลา"
              label_en=""
              placeholder="วันเวลา"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1 rounded-full border"
              onClick={props.onCancel}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-full bg-primary-600 text-white"
            >
              บันทึก
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

const RoundDropdown = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
];
