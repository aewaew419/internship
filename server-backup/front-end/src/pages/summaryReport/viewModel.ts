import { useState, useEffect } from "react";
import { ReportsService } from "../../service/api/reports";
import type { 
  ReportsSummaryResponse, 
  StudentEnrollDetail, 
  ReportsFilters 
} from "../../service/api/reports/type";

const useViewModel = () => {
  const [summaryData, setSummaryData] = useState<ReportsSummaryResponse | null>(null);
  const [detailData, setDetailData] = useState<StudentEnrollDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
  const [filters, setFilters] = useState<ReportsFilters>({
    year: new Date().getFullYear() + 543, // Thai year
    semester: 1,
  });

  const reportsService = new ReportsService();

  const fetchSummaryData = async (currentFilters: ReportsFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.reqGetSummaryReports(currentFilters);
      setSummaryData(data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป');
      console.error('Error fetching summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailData = async (currentFilters: ReportsFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsService.reqGetDetailReports(currentFilters);
      setDetailData(data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายละเอียด');
      console.error('Error fetching detail data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ReportsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (viewMode === 'summary') {
      fetchSummaryData(updatedFilters);
    } else {
      fetchDetailData(updatedFilters);
    }
  };

  const handleViewModeChange = (mode: 'summary' | 'detail') => {
    setViewMode(mode);
    if (mode === 'summary') {
      fetchSummaryData();
    } else {
      fetchDetailData();
    }
  };

  const refreshData = () => {
    if (viewMode === 'summary') {
      fetchSummaryData();
    } else {
      fetchDetailData();
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, []);

  return {
    summaryData,
    detailData,
    loading,
    error,
    viewMode,
    filters,
    handleFilterChange,
    handleViewModeChange,
    refreshData,
  };
};

export default useViewModel;