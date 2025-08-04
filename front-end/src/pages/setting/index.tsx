import { Layout } from "../../component/layout";
const Setting = () => {
  return (
    <Layout header={[{ path: "/setting", name: "ตั้งค่า" }]}>
      <div className="setting">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p>Manage your settings here.</p>
      </div>
    </Layout>
  );
};
export default Setting;
