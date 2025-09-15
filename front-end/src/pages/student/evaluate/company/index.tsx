import { Layout } from "../../../../component/layout";
import useViewModel from "./viewModel";
import { useSearchParams } from "react-router-dom";
import { Formik, Form } from "formik";
import { RadioField, Field } from "../../../../component/input/field";
import { Persona, EvaluationStatus } from "../../../../component/information";
import { Alert, CircularProgress, Box } from "@mui/material";
const StudentEvaluateCompanyPerCompany = () => {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { 
    student, 
    handleOnsubmit,
    evaluationStatus,
    isLoading,
    isStatusLoading,
    isSubmitting,
    error,
    statusError,
    submissionSuccess,
    submissionMessage,
    validationError,
    isValidating
  } = useViewModel(id);

  // Show validation error state first
  if (validationError) {
    return (
      <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
        <div className="bg-white px-4 pb-4 rounded-2xl">
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>URL Parameter Error:</strong> {validationError}
          </Alert>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Expected URL Format:</h3>
            <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
              /company_evaluation/company?id=[company_id]
            </code>
            <p className="text-sm text-gray-600 mt-2">
              Example: <code>/company_evaluation/company?id=2</code>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state while validating or checking status
  if (isValidating || isStatusLoading || isLoading) {
    return (
      <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
        <div className="bg-white px-4 pb-4 rounded-2xl">
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ mb: 2 }} />
            <p className="text-gray-600">
              {isValidating && "Validating parameters..."}
              {isStatusLoading && "Checking evaluation status..."}
              {isLoading && "Loading evaluation data..."}
            </p>
          </Box>
        </div>
      </Layout>
    );
  }

  // Show error state if there's an error
  if (error || statusError) {
    return (
      <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
        <div className="bg-white px-4 pb-4 rounded-2xl">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || statusError}
          </Alert>
          
          {/* Retry button for network errors */}
          {(error?.includes("Network error") || statusError?.includes("Network error") || 
            error?.includes("Server error") || statusError?.includes("Server error")) && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-700 mb-2">Connection Issue:</h3>
              <p className="text-sm text-orange-600 mb-3">
                There seems to be a connection problem. Please try again.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Troubleshooting for company not found errors */}
          {(error?.includes("Company not found") || statusError?.includes("Company not found")) && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-700 mb-2">Troubleshooting:</h3>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Check if the company ID in the URL is correct</li>
                <li>• Verify that you have access to this company evaluation</li>
                <li>• Contact your instructor if the problem persists</li>
              </ul>
            </div>
          )}
          
          {/* Troubleshooting for access denied errors */}
          {(error?.includes("Access") || statusError?.includes("Access") || 
            error?.includes("Unauthorized") || statusError?.includes("Unauthorized")) && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-700 mb-2">Access Issue:</h3>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Make sure you are logged in with the correct account</li>
                <li>• You can only access evaluations for your own training</li>
                <li>• Contact your instructor if you believe this is an error</li>
              </ul>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout header={[{ path: "", name: "แบบประเมิน" }]}>
      <div className="bg-white px-4 pb-4 rounded-2xl">
        <div>
          {student?.[0]?.student_training && (
            <Persona id={student?.[0]?.student_training?.studentEnrollId} />
          )}
        </div>

        {/* Success message after form submission */}
        {submissionSuccess && submissionMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {submissionMessage}
          </Alert>
        )}

        <div>
          <h1 className="text-xl font-bold text-secondary-600 py-5 border-b border-secondary-600 my-5">
            {evaluationStatus?.hasEvaluated ? "สถานะการประเมิน" : "กรุณาให้คะแนน"}
          </h1>

          {/* Conditional rendering: Show status when evaluation is completed */}
          {evaluationStatus?.hasEvaluated ? (
            <div className="py-6">
              <div className="flex flex-col items-center gap-4">
                <EvaluationStatus
                  isEvaluated={true}
                  evaluationDate={evaluationStatus.evaluationDate}
                  showTimestamp={true}
                  className="mb-4"
                />
                <div className="text-center">
                  <p className="text-lg font-medium text-secondary-600 mb-2">
                    คุณได้ประเมินบริษัท "{evaluationStatus.companyName}" เรียบร้อยแล้ว
                  </p>
                  <p className="text-secondary-500">
                    ขอบคุณสำหรับการให้ข้อมูลย้อนกลับ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Show evaluation form when not yet evaluated */
            <>
              <p className="text-secondary-600">(1 = น้อยมาก, 5 = มากที่สุด)</p>
              <Formik
                initialValues={{
                  ids: student.map((v) => v.id),
                  scores: student.map((v) => v.score || 0),
                  comment: student?.[0]?.comment || "",
                }}
                enableReinitialize
                onSubmit={(value) =>
                  handleOnsubmit({
                    ids: student.map((v) => v.id),
                    scores: value.scores.map((v) => Number(v)),
                    comment: value.comment,
                  })
                }
              >
                {({}) => (
                  <Form>
                    <div>
                      {student.map((data, index) => (
                        <div key={data.id} className="my-3">
                          <RadioField
                            name={`scores[${index}]`}
                            label={`${index + 1}.${data.questions}`}
                            row
                            options={[1, 2, 3, 4, 5].map((n) => ({
                              label: "★".repeat(n),
                              value: n,
                            }))}
                          />
                        </div>
                      ))}
                      <div className="my-5">
                        <label>ข้อเสนอแนะเพิ่มเติม</label>
                        <Field name="comment" multiline />
                      </div>
                      <button 
                        type="submit" 
                        className="secondary-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            กำลังส่ง...
                          </>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default StudentEvaluateCompanyPerCompany;
