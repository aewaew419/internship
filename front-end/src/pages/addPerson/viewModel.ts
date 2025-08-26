import { UserService } from "../../service/api/user";
import type { UserListInterface } from "../../service/api/user/type";
import { useEffect, useCallback, useState, useMemo } from "react";

type BulkResult = {
  created_count: number;
  skipped: Array<{ email?: string; reason: string }>;
  errors: Array<{ email?: string; reason: string }>;
};

const useViewModel = () => {
  const userService = new UserService();
  const [xlsxFile, setXlsxFile] = useState<File | string | null>(null);
  const [roleIdForAll, setRoleIdForAll] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const [userList, setUserList] = useState<UserListInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const ids = useMemo(() => userList.map((u) => u.id), [userList]);
  const allSelected = ids.length > 0 && selected.size === ids.length;
  const someSelected = selected.size > 0 && !allSelected;

  const fetchUserList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.reqGetUsers();
      setUserList(response);
      setSelected(new Set()); // reset selection on new data
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [userService]);

  useEffect(() => {
    fetchUserList();
  }, []);

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids)
    );
  }, [ids]);

  const deleteSelected = useCallback(async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`ลบผู้ใช้จำนวน ${selected.size} รายการ?`)) return;
    setDeleting(true);
    try {
      await userService.reqDeletedUsers({ ids: Array.from(selected) });
      await fetchUserList();
    } catch (e) {
      console.error("Bulk delete failed:", e);
    } finally {
      setDeleting(false);
    }
  }, [selected, userService, fetchUserList]);

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
      if (roleIdForAll !== "") form.append("role_id", String(roleIdForAll));
      const res = await userService.reqPostAddUserByXLSX(form);
      setResult(res as unknown as BulkResult);
      await fetchUserList(); // refresh list after upload
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
  }, [xlsxFile, roleIdForAll, userService, fetchUserList]);

  return {
    // list + selection
    userList,
    loading,
    deleting,
    selected,
    allSelected,
    someSelected,
    toggleRow,
    toggleAll,
    deleteSelected,

    // upload
    xlsxFile,
    handleUploadXLSX,
    handleOnSubmitXLSX,
    submitting,
    roleIdForAll,
    setRoleIdForAll,
    result,
  };
};
export default useViewModel;
