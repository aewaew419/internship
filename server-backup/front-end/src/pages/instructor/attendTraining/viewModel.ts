import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { InstructorService } from "../../../service/api/instructor";
// import { EnrollApproveInterface } from "../../../service/api/instructor/type";
import type { EnrollApproveInterface } from "../../../service/api/enrollment/type";
import { EnrollmentService } from "../../../service/api/enrollment";
// import { EnrollStatusDTO } from "../../../service/api/enrollment/type";

type StatusType = "approve" | "denied";

const useViewModel = () => {
  const instructorService = new InstructorService();
  const enrollmentService = new EnrollmentService();

  const [rows, setRows] = useState<EnrollApproveInterface[]>([]);

  // selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = ids.length > 0 && selected.size === ids.length;
  const someSelected = selected.size > 0 && !allSelected;

  const selectAllRef = useRef<HTMLInputElement>(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await enrollmentService.reqGetStudentEnrollmentApprove();
      setRows(res ?? []);
    } catch (e) {
      console.error("Error fetching approved enrollments:", e);
    }
  }, [enrollmentService]);

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

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const bulkUpdate = useCallback(
    async (status: StatusType) => {
      if (selected.size === 0) return;
      await instructorService.reqPutInstructorAttendTraining({
        ids: Array.from(selected),
        grade: status, // status-only update
      });
      clearSelection();
      await fetchEnrollments();
    },
    [selected, instructorService, clearSelection]
  );

  const bulkApprove = useCallback(() => bulkUpdate("approve"), [bulkUpdate]);

  useEffect(() => {
    fetchEnrollments();
  }, []);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);
  return {
    rows,
    selected,
    selectedCount: selected.size,
    allSelected,
    someSelected,
    selectAllRef,
    toggleRow,
    toggleAll,
    clearSelection,
    bulkApprove,

    refetch: fetchEnrollments,
  };
};
export default useViewModel;
