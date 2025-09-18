import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  ReportsFilters,
  ReportsResponse,
  ReportsSummaryResponse,
  StudentEnrollDetail,
} from "./type";

export class ReportsService extends RemoteA {
  
  reqGetReports = async (filters: ReportsFilters = {}): Promise<ReportsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.semester) params.append('semester', filters.semester.toString());
    if (filters.course_id) params.append('course_id', filters.course_id.toString());
    if (filters.view) params.append('view', filters.view);
    
    const queryString = params.toString();
    const url = queryString ? `${PROTECTED_PATH.REPORTS}?${queryString}` : PROTECTED_PATH.REPORTS;
    
    const response = await this.getAxiosInstance().get(url);
    const { data } = response;
    return data;
  };

  reqGetSummaryReports = async (filters: Omit<ReportsFilters, 'view'> = {}): Promise<ReportsSummaryResponse> => {
    return this.reqGetReports({ ...filters, view: 'summary' }) as Promise<ReportsSummaryResponse>;
  };

  reqGetDetailReports = async (filters: Omit<ReportsFilters, 'view'> = {}): Promise<StudentEnrollDetail[]> => {
    return this.reqGetReports({ ...filters, view: 'detail' }) as Promise<StudentEnrollDetail[]>;
  };
}