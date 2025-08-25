import { UserService } from "../../service/api/user";
import { useCallback, useState } from "react";
type BulkResult = {
  created_count: number;
  skipped: Array<{ email?: string; reason: string }>;
  errors: Array<{ email?: string; reason: string }>;
};

const useViewModel = () => {
  const userService = new UserService();
  const [xlsxFile, setXlsxFile] = useState<File | string | null>(null);
  const [roleIdForAll, setRoleIdForAll] = useState<number | "">(""); // optional global role_id
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const handleUploadXLSX = useCallback((file: File) => {
    setXlsxFile(file);
    setResult(null);
  }, []);
  const handleOnSubmitXLSX = useCallback(async () => {
    if (!(xlsxFile instanceof File)) return;
    setSubmitting(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", xlsxFile);
      if (roleIdForAll !== "") form.append("role_id", String(roleIdForAll)); // optional global role_id

      const res = await userService.reqPostAddUserByXLSX(form);
      setResult(res as unknown as BulkResult); // your service returns "data"; adjust if needed
    } catch (err) {
      console.error("Upload failed:", err);
      setResult({
        created_count: 0,
        skipped: [],
        errors: [{ reason: "Upload failed" }],
      });
    } finally {
      setSubmitting(false);
    }
  }, [xlsxFile, roleIdForAll, userService]);

  return {
    submitting,
    result,
    xlsxFile,
    setRoleIdForAll,
    handleUploadXLSX,
    handleOnSubmitXLSX,
    roleIdForAll,
  };
};
export default useViewModel;
