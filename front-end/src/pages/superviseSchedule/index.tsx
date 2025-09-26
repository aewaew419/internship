import { Layout } from "../../component/layout";
import { PROTECTED_PATH } from "../../constant/path.route";
import { Table } from "../../component/table";
import { TextField, Autocomplete, CircularProgress, Alert, Button, Box } from "@mui/material";
import { FilterAlt, ReadMoreRounded, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useSuperviseScheduleViewModel from "./viewModel";
import { ErrorBoundary, FallbackUI, TableSkeleton } from "../../component/error";
import { DataStalenessIndicator } from "../../component/information/DataStalenessIndicator";
const SupervisorSchedule = () => {
  const navigate = useNavigate();
  const {
    filteredVisitors,
    loading,
    error,
    enhancedError,
    filters,
    applyFilters,
    refreshData,
    clearError,
    retryFetch,
    hasData,
    totalCount,
    retryCount,
    isRetrying,
    // Real-time update properties
    stalenessInfo,
    isAutoRefreshing,
    triggerManualRefresh,
    toggleAutoRefresh,
    // Enhanced synchronization properties
    isSyncing,
    syncStatus,
    connectionStatus,
    lastSyncTime,
    forceSynchronization,
    updateRefreshInterval
  } = useSuperviseScheduleViewModel();

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyFilters({ search: event.target.value });
  };

  // Handle position filter change
  const handlePositionChange = (value: string | null) => {
    applyFilters({ position: value || '' });
  };

  // Handle major filter change
  const handleMajorChange = (value: string | null) => {
    applyFilters({ major: value || '' });
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Handle retry button click
  const handleRetry = async () => {
    await retryFetch();
  };

  // Handle manual refresh from staleness indicator
  const handleManualRefresh = async () => {
    await triggerManualRefresh();
  };

  // Handle force synchronization
  const handleForceSync = async () => {
    await forceSynchronization();
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (interval: number) => {
    updateRefreshInterval(interval);
  };

  // Handle error boundary retry
  const handleErrorBoundaryRetry = () => {
    clearError();
    refreshData();
  };
  return (
    <ErrorBoundary onRetry={handleErrorBoundaryRetry}>
      <Layout header={[{ path: "", name: "นัดหมายการนิเทศ" }]}>
        <div className="bg-white p-4 mt-4 rounded-lg">
        <h1 className="text-xl font-bold text-secondary-600">ค้นหารายชื่อ</h1>

        <div className="flex gap-3 my-5">
          <div className="w-80">
            <TextField
              name="search"
              placeholder="ชื่อ-สกุล, รหัสประจำตัว"
              label="ค้นหา"
              size="small"
              fullWidth
              value={filters.search}
              onChange={handleSearchChange}
              disabled={loading}
            />
          </div>
          <div className="w-60">
            <Autocomplete
              options={[]}
              value={filters.position || null}
              onChange={(_, value) => handlePositionChange(value)}
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
              options={[]}
              value={filters.major || null}
              onChange={(_, value) => handleMajorChange(value)}
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
          <div className="my-auto">
            <Button
              onClick={handleRefresh}
              disabled={loading || isRetrying}
              size="small"
              startIcon={(loading || isRetrying) ? <CircularProgress size={16} /> : <Refresh />}
            >
              {isRetrying ? 'กำลังลองใหม่...' : 'รีเฟรช'}
            </Button>
          </div>
        </div>

        {/* Real-time Data Status Indicator */}
        <div className="flex justify-between items-center mb-4">
          <DataStalenessIndicator
            stalenessInfo={stalenessInfo}
            isRefreshing={loading}
            isAutoRefreshing={isAutoRefreshing}
            onManualRefresh={handleManualRefresh}
            onToggleAutoRefresh={toggleAutoRefresh}
            className="ml-auto"
            // Enhanced props
            showSettings={true}
            refreshInterval={30000}
            onRefreshIntervalChange={handleRefreshIntervalChange}
            connectionStatus={connectionStatus}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onForceSync={handleForceSync}
          />
        </div>
        {/* Enhanced Error Display */}
        {error && enhancedError && (
          <div className="my-4">
            <Alert 
              severity={enhancedError.type.includes('NETWORK') || enhancedError.type.includes('SERVER') ? 'error' : 'warning'}
              onClose={clearError}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {enhancedError.isRetryable && (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleRetry}
                      disabled={isRetrying}
                      startIcon={isRetrying ? <CircularProgress size={16} /> : <Refresh />}
                    >
                      {isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่'}
                    </Button>
                  )}
                  <Button color="inherit" size="small" onClick={handleRefresh}>
                    รีเฟรช
                  </Button>
                </Box>
              }
            >
              {error}
              {retryCount > 0 && (
                <div style={{ fontSize: '0.875rem', marginTop: '4px', opacity: 0.8 }}>
                  ลองใหม่แล้ว {retryCount} ครั้ง
                </div>
              )}
            </Alert>
          </div>
        )}

        <div className="w-full mt-16">
          <div className="flex justify-between my-5">
            <div className="flex items-center gap-4">
              <p className="ms-5 text-xl text-black">รายชื่อ</p>
              {loading && <CircularProgress size={20} />}
              {!loading && hasData && (
                <span className="text-gray-600">({totalCount} รายการ)</span>
              )}
            </div>
            {/* <div className="flex gap-4 text-white">
              <button
                className="primary-button bg-gradient w-48"
                // onClick={() => setEditUser("upload")}
              >
                <PrintRounded fontSize="small" sx={{ my: "auto" }} />
                <p className="my-auto">ออกเอกสาร</p>
              </button>
            </div> */}
          </div>

          {/* Loading State with Skeleton */}
          {loading && !hasData && !error && (
            <Box sx={{ mt: 2 }}>
              <TableSkeleton rows={5} />
            </Box>
          )}

          {/* Fallback UI for various states */}
          {!loading && !hasData && (
            <FallbackUI
              error={enhancedError || undefined}
              onRetry={enhancedError?.isRetryable ? handleRetry : undefined}
              onRefresh={handleRefresh}
              title={error ? undefined : "ไม่พบข้อมูลนิเทศ"}
              description={error ? undefined : "ไม่มีข้อมูลการนิเทศให้แสดงในขณะนี้"}
            />
          )}

          {/* Data Table */}
          {(hasData || loading) && (
            <Table
              header={[
                "ชื่อ",
                "รหัส",
                "ชื่อบริษัท",
                "ผู้ติดต่อ",
                "อาจารย์นิเทศ",
                "นัดหมาย",
                "ข้อมูลเพิ่มเติม",
              ]}
              data={filteredVisitors.map((visitor, index) => (
                <tr key={visitor.id} className="border-b border-x border-text-200">
                  <td className="ps-5 py-3 flex">
                    {/* <FormControl component="fieldset" variant="standard">
                      <Checkbox />
                    </FormControl> */}
                    <p className="my-auto">{visitor.studentName}</p>
                  </td>

                  <td>{visitor.studentCode}</td>
                  <td>{visitor.companyName}</td>
                  <td>{visitor.contactName}</td>
                  <td>{visitor.supervisorName}</td>
                  <td>
                    <div className="bg-[#BDCAFF] w-fit rounded-full px-2 py-1 flex gap-3">
                      <p>
                        {visitor.appointmentCount > 0 
                          ? `${visitor.appointmentStatus} ${visitor.appointmentCount} ครั้ง`
                          : visitor.appointmentStatus
                        }
                      </p>
                      <div className="bg-[#5C6FBC] h-4 w-4 rounded-full my-auto"></div>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => navigate(PROTECTED_PATH.UPLOAD_LIST_PERSON)}>
                      <ReadMoreRounded className="text-primary-600" />
                    </button>
                  </td>
                </tr>
              ))}
            />
          )}
        </div>
        </div>
        <div></div>
      </Layout>
    </ErrorBoundary>
  );
};
export default SupervisorSchedule;
