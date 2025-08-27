import { Layout } from "../../../component/layout";
import useViewModel from "./viewModel";
import { PROTECTED_PATH } from "../../../constant/path.route";
import { useNavigate } from "react-router-dom";
const AttendTraining = () => {
  const navigate = useNavigate();
  const {
    rows,
    selected,
    selectedCount,
    allSelected,
    // someSelected,
    selectAllRef,
    toggleRow,
    toggleAll,
    clearSelection,
    bulkApprove,
  } = useViewModel();
  return (
    <Layout header={[{ path: "", name: "รายการขอฝึกงาน  / สหกิจศึกษา" }]}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          เลือกไว้ {selectedCount} รายการ
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-green-600 text-white disabled:opacity-40"
            disabled={selectedCount === 0}
            onClick={bulkApprove}
          >
            อนุมัติที่เลือก
          </button>

          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-gray-200"
            disabled={selectedCount === 0}
            onClick={clearSelection}
          >
            ล้างการเลือก
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left">ชื่อ-สกุล</th>
              <th className="p-3 text-left">รหัสนักศึกษา</th>
              <th className="p-3 text-left">สถานะ</th>
              <th className="p-3 text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                  />
                </td>
                <td className="p-3">{row.student.name}</td>
                <td className="p-3">{row.student.studentId}</td>
                <td className="p-3">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full " +
                      (row.attendTraining === "approve"
                        ? "bg-green-100 text-green-700"
                        : row.attendTraining === "denied"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {row.attendTraining === "approve"
                      ? "เข้าอบรม"
                      : row.attendTraining === "denied"
                      ? "ไม่เข้าอบรม"
                      : "-"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white"
                    onClick={() =>
                      navigate(
                        PROTECTED_PATH.ATTEND_TRAINING_PERSON + `?id=${row.id}`
                      )
                    }
                  >
                    รายละเอียด
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};
export default AttendTraining;
