import { Layout } from "../../../component/layout";
import { Persona, CoopInformation } from "./section";
const InternDocPerson = () => {
  return (
    <Layout
      header={[
        { path: "", name: "รายการขอฝึกงาน / สหกิจศึกษา > นายรักดี จิตดี " },
      ]}
    >
      <div className="bg-white p-4 mt-4 rounded-lg">
        <h1 className="text-xl font-bold text-secondary-600">
          เอกสารขอฝึกงาน / สหกิจศึกษา
        </h1>
        <div className="mt-5 mx-5">
          <Persona />
          <CoopInformation />
        </div>
      </div>
    </Layout>
  );
};
export default InternDocPerson;
