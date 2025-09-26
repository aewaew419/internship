import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnrollmentService } from "../../../service/api/enrollment";
// If you already have an InstructorService, use that instead:
import { InstructorService } from "../../../service/api/instructor";

// --- types you likely already have ---
import type { EnrollApproveInterface } from "../../../service/api/enrollment/type";

type VisitorOption = { id: number; name: string };

const useViewModel = () => {
  const enrollmentService = new EnrollmentService();
  const instructorService = new InstructorService();

  // table rows (approved enrollments)
  const [rows, setRows] = useState<EnrollApproveInterface[]>([]);
  const [loading, setLoading] = useState(false);

  // visitor list + chosen visitor
  const [visitors, setVisitors] = useState<VisitorOption[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(
    null
  );
  const [assigning, setAssigning] = useState(false);

  // selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = ids.length > 0 && selected.size === ids.length;
  const someSelected = selected.size > 0 && !allSelected;
  const selectedCount = selected.size;

  // header checkbox ref (for indeterminate UI)
  const selectAllRef = useRef<HTMLInputElement>(null);

  // fetch approved enrollments
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentService.reqGetStudentEnrollmentApprove();
      // Expecting an array of { id, studentId, student: { name } }
      setRows(res ?? []);
    } catch (e) {
      console.error("Error fetching approved enrollments:", e);
    } finally {
      setLoading(false);
    }
  }, [enrollmentService]);

  // fetch visitor instructors (adjust to your API)
  const fetchVisitors = useCallback(async () => {
    try {
      const res = await instructorService.reqGetInstructor();
      // Expecting [{ id, name }, ...]
      setVisitors(res ?? []);
    } catch (e) {
      console.error("Error fetching visitors:", e);
    }
  }, [instructorService]);

  useEffect(() => {
    fetchEnrollments();
    fetchVisitors();
  }, []);

  // selection handlers
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

  // bulk assign action
  const assignSelected = useCallback(async () => {
    if (selected.size === 0 || selectedVisitorId == null) return;
    setAssigning(true);
    try {
      await enrollmentService.reqPostVisitorToEnroll({
        student_enroll_ids: Array.from(selected),
        visitor_instructor_id: selectedVisitorId,
      });
      clearSelection();
      await fetchEnrollments();
    } catch (e) {
      console.error("Bulk assign failed:", e);
    } finally {
      setAssigning(false);
    }
  }, [
    selected,
    selectedVisitorId,
    enrollmentService,
    clearSelection,
    fetchEnrollments,
  ]);

  return {
    // data
    rows,
    loading,

    // visitors
    visitors,
    selectedVisitorId,
    setSelectedVisitorId,
    assigning,

    // selection (table)
    selected,
    selectedCount,
    allSelected,
    someSelected,
    selectAllRef,
    toggleRow,
    toggleAll,
    clearSelection,

    // actions
    assignSelected,
  };
};

export default useViewModel;
