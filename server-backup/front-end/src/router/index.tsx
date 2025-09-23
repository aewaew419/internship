import {
  Login,
  Dashboard,
  Setting,
  AddPerson,
  PersonInformation,
  SupervisorReport,
  SupervisorSchedule,
  InternDoc,
  CompanyEvaluate,
  SummaryReport,
  InternDocPerson,
  RegisterCoopInfo,
  RegisterPersonalInfo,
  InternRequest,
  InstructorInternReq,
  InstructorInternReqPerson,
  AssignVisitor,
  VisitorSchedule,
  VisitorSchedulePerson,
  VisitorVisits,
  VisitorVisitsPersons,
  Evaluate,
  VisitorEvaluateCompany,
  VisitorEvaluateCompanyPerson,
  VisitorEvaluateStudent,
  VisitorEvaluateStudentPerson,
  StudentEvaluateCompany,
  StudentEvaluateCompanyPerCompany,
  AttendTraining,
  AssignGrade,
  InstructorAssignGradePerPerson,
  AssignVisitorPerson,
  InstructorAttendTrainingPerson,
} from "../pages";
import {
  Route,
  Routes,
  BrowserRouter,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { UNPROTECTED_PATH, PROTECTED_PATH } from "../constant/path.route";
import RegisterProject from "../pages/project/regitser";

import { useAuth } from "../auth/useAuth";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        <Route element={<UnRequireAuth />}>
          <Route path={UNPROTECTED_PATH.LOGIN} element={<Login />} />
        </Route>
        <Route
          element={
            <RequireAuth
              role={["admin", "student", "instructor", "visitor", "committee"]}
            />
          }
        >
          <Route path={PROTECTED_PATH.DASHBOARD} element={<Dashboard />} />
        </Route>

        <Route element={<RequireAuth role={["admin"]} />}>
          <Route path={PROTECTED_PATH.UPLOAD_LIST} element={<AddPerson />} />
          <Route
            path={PROTECTED_PATH.UPLOAD_LIST_PERSON}
            element={<PersonInformation />}
          />
          <Route path={PROTECTED_PATH.INTERN_DOC} element={<InternDoc />} />
          <Route
            path={PROTECTED_PATH.INTERN_DOC_PERSON}
            element={<InternDocPerson />}
          />
          <Route path={PROTECTED_PATH.SETTING} element={<Setting />} />
        </Route>

        <Route
          path={PROTECTED_PATH.SUPERVISE_REPORT}
          element={<SupervisorReport />}
        />
        <Route
          path={PROTECTED_PATH.SUPERVISE_SCHEDULE}
          element={<SupervisorSchedule />}
        />
        <Route
          path={PROTECTED_PATH.COMPANY_EVALUAION}
          element={<CompanyEvaluate />}
        />
        <Route
          path={PROTECTED_PATH.SUMMARY_REPORT}
          element={<SummaryReport />}
        />
        <Route element={<RequireAuth role={["instructor"]} />}>
          <Route
            path={PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST}
            element={<InstructorInternReq />}
          />
          <Route
            path={PROTECTED_PATH.INSTRUCTOR_INTERN_REQUEST_PERSON}
            element={<InstructorInternReqPerson />}
          />
          <Route
            path={PROTECTED_PATH.ASSIGN_VISITOR}
            element={<AssignVisitor />}
          />
          <Route
            path={PROTECTED_PATH.ASSIGN_VISITOR_PERSON}
            element={<AssignVisitorPerson />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_SCHEDULE}
            element={<VisitorSchedule />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_SCHEDULE_PERSON}
            element={<VisitorSchedulePerson />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_VISITS}
            element={<VisitorVisits />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_VISITS_PERSON}
            element={<VisitorVisitsPersons />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_EVALUATE}
            element={<Evaluate />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_EVALUATE_COMPANY}
            element={<VisitorEvaluateCompany />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_EVALUATE_COMPANY_PERSON}
            element={<VisitorEvaluateCompanyPerson />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_EVALUATE_STUDENT}
            element={<VisitorEvaluateStudent />}
          />
          <Route
            path={PROTECTED_PATH.VISITOR_EVALUATE_STUDENT_PERSON}
            element={<VisitorEvaluateStudentPerson />}
          />
          <Route
            path={PROTECTED_PATH.ATTEND_TRAINING}
            element={<AttendTraining />}
          />
          <Route
            path={PROTECTED_PATH.ATTEND_TRAINING_PERSON}
            element={<InstructorAttendTrainingPerson />}
          />

          <Route path={PROTECTED_PATH.ASSIGN_GRADE} element={<AssignGrade />} />
          <Route
            path={PROTECTED_PATH.ASSIGN_GRADE_PERSON}
            element={<InstructorAssignGradePerPerson />}
          />
        </Route>

        <Route element={<RequireAuth role={["student"]} />}>
          <Route
            path={PROTECTED_PATH.INTERN_REQUEST}
            element={<InternRequest />}
          />
          <Route
            path={PROTECTED_PATH.REGISTER_PERSONAL_INFO}
            element={<RegisterPersonalInfo />}
          />
          <Route
            path={PROTECTED_PATH.REGISTER_COOP_INFO}
            element={<RegisterCoopInfo />}
          />
          <Route
            path={PROTECTED_PATH.REGISTER_PROJECT}
            element={<RegisterProject />}
          />
          <Route
            path={PROTECTED_PATH.EVALUTAE_COMPANY}
            element={<StudentEvaluateCompany />}
          />
          <Route
            path={PROTECTED_PATH.COMPANY_EVALUAION_PER_COMPANY}
            element={<StudentEvaluateCompanyPerCompany />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;

const RequireAuth = ({ role }: { role: string[] }) => {
  const location = useLocation();
  const auth = useAuth();
  console.log(role);

  //   const AuthRole = ["instructor", "visitor", "committee"];
  //   ["student"];

  if (!auth?.user) {
    return (
      <Navigate
        to={UNPROTECTED_PATH.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }
  // const isHasRole = role.find((data) => AuthRole.find((auth) => auth === data));
  // if (!isHasRole) {
  //   return (
  //     <Navigate
  //       to={PROTECTED_PATH.DASHBOARD}
  //       state={{ from: location }}
  //       replace
  //     />
  //   );
  // }
  return (
    <>
      <Outlet />
    </>
  );
};
function UnRequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth?.user) {
    return (
      <Navigate
        to={PROTECTED_PATH.DASHBOARD}
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <>
      <Outlet />
    </>
  );
}

function RootRedirect() {
  const auth = useAuth();
  
  if (auth?.user) {
    return <Navigate to={PROTECTED_PATH.DASHBOARD} replace />;
  }
  
  return <Navigate to={UNPROTECTED_PATH.LOGIN} replace />;
}
