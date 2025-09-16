import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { TextField, Autocomplete, CircularProgress, Alert, Button } from "@mui/material";
import { FilterAlt, ReadMoreRounded, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import useSuperviseReportViewModel from "./viewModel";
import { DataStalenessIndicator } from "../../component/information/DataStalenessIndicator";

const SupervisorReport = () => {
  const navigate = useNavigate();
  const {
    filteredReportData,
    loading,
    error,
    filters,
    applyFilters,
    refreshData,
    clearError,
    retryFetch,
    summaryStats,
    hasData,
    isRetrying,
    positionOptions,
    majorOptions,
    // Real-time update properties
    stalenessInfo,
    isAutoRefreshing,
    triggerManualRefresh,
    toggleAutoRefresh
  } = useSuperviseReportViewModel();

  // Local state for form inputs
  const [searchInput, setSearchInput] = useState(filters.search);
  const [positionInput, setPositionInput] = useState(filters.position);
  const [majorInput, setMajorInput] = useState(filters.major);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    applyFilters({ search: value });
  }, [applyFilters]);

  const handlePositionChange = useCallback((value: string) => {
    setPositionInput(value);
    applyFilters({ position: value });
  }, [applyFilters]);

  const handleMajorChange = useCallback((value: string) => {
    setMajorInput(value);
    applyFilters({ major: value });
  }, [applyFilters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    clearError();
    await retryFetch();
  }, [clearError, retryFetch]);

  // Handle manual refresh from staleness indicator
  const handleManualRefresh = useCallback(async () => {
    await triggerManualRefresh();
  }, [triggerManualRefresh]);

  return (
    <Layout header={[{ path: "", name: "รายงานผลการนิเทศ" }]}>
      <div className="bg-white p-4 mt-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-secondary-600">ค้นหารายชื่อ</h1>
          <div className="flex gap-2 items-center">
            <DataStalenessIndicator
              stalenessInfo={stalenessInfo}
              isRefreshing={loading}
              isAutoRefreshing={isAutoRefreshing}
              onManualRefresh={handleManualRefresh}
              onToggleAutoRefresh={toggleAutoRefresh}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              disabled={loading || isRetrying}
              startIcon={isRetrying ? <CircularProgress size={16} /> : <Refresh />}
            >
              {isRetrying ? 'กำลังโหลด...' : 'รีเฟรช'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {hasData && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.totalStudents}</div>
              <div className="text-sm text-gray-600">นักศึกษาทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.completedEvaluations}</div>
              <div className="text-sm text-gray-600">ประเมินแล้ว</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summaryStats.averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryStats.pendingReports}</div>
              <div className="text-sm text-gray-600">รอดำเนินการ</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            className="mb-4"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                ลองใหม่
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <div className="flex gap-3 my-5">
          <div className="w-80">
            <TextField
              name="search"
              placeholder="ชื่อ-สกุล, รหัสประจำตัว"
              label="ค้นหา"
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-60">
            <Autocomplete
              options={positionOptions}
              value={positionInput}
              onChange={(_, value) => handlePositionChange(value || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ตำแหน่ง"
                  placeholder="กรุณาเลือก"
                  size="small"
                />
              )}
            />
          </div>
          <div className="w-60">
            <Autocomplete
              options={majorOptions}
              value={majorInput}
              onChange={(_, value) => handleMajorChange(value || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="สาขาวิชา"
                  placeholder="กรุณาเลือก"
                  size="small"
                />
              )}
            />
          </div>
          <div className="my-auto">
            <FilterAlt />
          </div>
        </div>

        <div className="w-full mt-16">
          <div className="flex justify-between my-5">
            <div>
              <p className="ms-5 text-xl text-black">
                รายชื่อ {filteredReportData.length > 0 && `(${filteredReportData.length} รายการ)`}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <CircularProgress />
              <span className="ml-2">กำลังโหลดข้อมูล...</span>
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && filteredReportData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {hasData ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ไม่มีข้อมูลรายงานการนิเทศ'}
            </div>
          )}

          {/* Data Table */}
          {!loading && filteredReportData.length > 0 && (
            <Table
              header={[
                "ชื่อ",
                "รหัส",
                "ชื่อบริษัท",
                "อาจารย์นิเทศ",
                "ตำแหน่งงาน",
                "นัดหมาย",
                "คะแนนเฉลี่ย",
                "ข้อมูลเพิ่มเติม",
              ]}
              data={filteredReportData.map((report, index) => (
                <tr key={report.id} className="border-b border-x border-text-200">
                  <td className="ps-5 py-6 flex">{report.studentName}</td>
                  <td>{report.studentCode}</td>
                  <td>{report.companyName}</td>
                  <td>{report.supervisorName}</td>
                  <td>{report.jobPosition}</td>
                  <td>
                    <div className="bg-[#BDCAFF] w-fit rounded-full px-2 py-1 flex gap-3">
                      <p>{report.appointmentStatus} {report.appointmentCount > 0 && `${report.appointmentCount} ครั้ง`}</p>
                      <div className="bg-[#5C6FBC] h-4 w-4 rounded-full my-auto"></div>
                    </div>
                  </td>
                  <td>
                    {report.evaluationScores && report.evaluationScores.length > 0 ? (
                      <div className="text-center">
                        <span className="font-semibold text-green-600">
                          {report.averageScore.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">ยังไม่ประเมิน</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST_PERSON)}
                      disabled={loading}
                    >
                      <ReadMoreRounded className="text-primary-600" />
                    </button>
                  </td>
                </tr>
              ))}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorReport;