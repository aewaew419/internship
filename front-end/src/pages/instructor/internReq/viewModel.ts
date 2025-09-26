import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { InstructorService } from "../../../service/api/instructor";
import type { InstructorStudentEnrollStatusInterface } from "../../../service/api/instructor/type";
import { EnrollmentService } from "../../../service/api/enrollment";
// import { EnrollStatusDTO } from "../../../service/api/enrollment/type";

type StatusType = "approve" | "denied" | "pending";

type Row = {
  id: number;
  status: StatusType;
  student_enroll: { id: number; student: { name: string; studentId: string } };
};
const useViewModel = () => {
  const instructorService = new InstructorService();
  const enrollmentService = new EnrollmentService();
  const [studentEnrollmentsStatus, setStudentEnrollmentsStatus] =
    useState<InstructorStudentEnrollStatusInterface[]>();

  const [rows, setRows] = useState<Row[]>([]);
  //   const [loading, setLoading] = useState(false);

  // selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = ids.length > 0 && selected.size === ids.length;
  const someSelected = selected.size > 0 && !allSelected;
  const fetchInstructorInternReqStatus = () => {
    instructorService
      .reqGetInstructorInternRequestStatus()
      .then((response) => {
        setStudentEnrollmentsStatus(response);
        setRows(
          response.map((item) => ({
            id: item.id,
            status: item.status,
            student_enroll: {
              id: item.studentEnrollId,
              student: {
                name: item.student_enroll.student.name,
                studentId: item.student_enroll.student.studentId,
              },
            },
          }))
        );
      })
      .catch((error) => {
        console.error("Error fetching student enrollments:", error);
      });
  };

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);
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
      await enrollmentService.reqPutStudentEnrollStatus({
        ids: Array.from(selected),
        status, // status-only update
        remarks: "",
      });
      clearSelection();
      await fetchInstructorInternReqStatus();
    },
    [selected, enrollmentService, clearSelection]
  );

  const bulkApprove = useCallback(() => bulkUpdate("approve"), [bulkUpdate]);

  useEffect(() => {
    fetchInstructorInternReqStatus();
  }, []);
  return {
    rows,
    // loading,
    // selection
    selected,
    selectedCount: selected.size,
    allSelected,
    someSelected,
    selectAllRef,
    toggleRow,
    toggleAll,
    clearSelection,
    // actions
    bulkApprove,

    refetch: fetchInstructorInternReqStatus,
    studentEnrollmentsStatus,
  };
};
export default useViewModel;
