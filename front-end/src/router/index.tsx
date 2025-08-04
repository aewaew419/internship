import { Login, Dashboard, Setting, AddPerson } from "../pages";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { UNPROTECTED_PATH, PROTECTED_PATH } from "../constant/path.route";
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={UNPROTECTED_PATH.LOGIN} element={<Login />} />
        <Route path={PROTECTED_PATH.DASHBOARD} element={<Dashboard />} />
        <Route path={PROTECTED_PATH.UPLOAD_LIST} element={<AddPerson />} />
        <Route path={PROTECTED_PATH.SETTING} element={<Setting />} />

        {/* <Route path="/about" element={<About />} /> */}
        {/* <Route path="/contact" element={<Contact />} /> */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
