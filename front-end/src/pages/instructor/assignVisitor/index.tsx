import { Layout } from "../../../component/layout";
import useViewModel from "./viewModel";

const AssignVisitor = () => {
  const {
    rows,
    loading,
    // selection
    selected,
    selectedCount,
    allSelected,
    someSelected,
    selectAllRef,
    toggleRow,
    toggleAll,
    clearSelection,
    // visitors + action
    visitors,
    selectedVisitorId,
    setSelectedVisitorId,
    assigning,
    assignSelected,
  } = useViewModel();

  // keep header checkbox indeterminate state in sync
  if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;

  return (
    <Layout
      header={[
        {
          path: "",
          name: "มอบหมายอาจารย์นิเทศ",
        },
      ]}
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap mt-5">
        <div className="text-sm text-gray-500">
          เลือกไว้ {selectedCount} รายการ
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={selectedVisitorId ?? ""}
            onChange={(e) =>
              setSelectedVisitorId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">เลือกอาจารย์นิเทศ…</option>
            {visitors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-40"
            disabled={
              loading ||
              assigning ||
              selectedCount === 0 ||
              selectedVisitorId == null
            }
            onClick={assignSelected}
          >
            มอบหมายให้ที่เลือก
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
            disabled={selectedCount === 0}
            onClick={clearSelection}
          >
            ล้างการเลือก
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow bg-white">
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
              <th className="p-3 text-left">รหัสนักศึกษา</th>
              <th className="p-3 text-left">ชื่อ-สกุล</th>
              <th className="p-3 text-left">อาจารย์นิเทศ</th>
              <th className="p-3 text-left">ข้อมูลเพิ่มเติม</th>
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
                <td className="p-3">{row.studentId}</td>
                <td className="p-3">{row.student.name}</td>
                <td className="p-3">
                  {row?.visitor_training?.[0]?.visitor.name || "-"}
                </td>
                <td className="p-3">
                  <button>ดูข้อมูล</button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
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

export default AssignVisitor;
