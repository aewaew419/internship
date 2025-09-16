import { RemoteA } from "../../remote";
import { PROTECTED_PATH } from "../../../constant/api.route";
import type {
  VisitorInterface,
  VisitorScheduleDTO,
  VisitorScheduleReportInterface,
  VisitorEvaluateStudentDTO,
  VisitorEvaluateStudentInterface,
} from "./type";
import type { AxiosResponse } from "axios";
import { useToken } from "../../../utils/localStorage";

// Enhanced filter interfaces for server-side filtering
export interface VisitorFilterParams {
  search?: string;
  position?: string;
  major?: string;
  appointmentStatus?: string;
  department?: string;
  company?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'studentCode' | 'companyName' | 'appointmentCount';
  sortOrder?: 'asc' | 'desc';
}

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedParams: VisitorFilterParams;
}

export class VisitorService extends RemoteA {
  token = useToken();
  instructor_id = this.token.user?.instructors?.id;

  // Validate and sanitize filter parameters
  private validateFilterParams(params: VisitorFilterParams): FilterValidationResult {
    const errors: string[] = [];
    const sanitizedParams: VisitorFilterParams = {};

    // Validate search parameter
    if (params.search !== undefined) {
      const search = params.search.trim();
      if (search.length > 100) {
        errors.push('Search term must be less than 100 characters');
      } else if (search.length > 0) {
        // Sanitize search input to prevent injection
        sanitizedParams.search = search.replace(/[<>\"']/g, '');
      }
    }

    // Validate position parameter
    if (params.position !== undefined) {
      const position = params.position.trim();
      if (position.length > 50) {
        errors.push('Position filter must be less than 50 characters');
      } else if (position.length > 0) {
        sanitizedParams.position = position.replace(/[<>\"']/g, '');
      }
    }

    // Validate major parameter
    if (params.major !== undefined) {
      const major = params.major.trim();
      if (major.length > 50) {
        errors.push('Major filter must be less than 50 characters');
      } else if (major.length > 0) {
        sanitizedParams.major = major.replace(/[<>\"']/g, '');
      }
    }

    // Validate appointment status
    if (params.appointmentStatus !== undefined) {
      const validStatuses = ['นัดหมายแล้ว', 'รอนัดหมาย', 'เสร็จสิ้น', 'ยกเลิก'];
      if (params.appointmentStatus && !validStatuses.includes(params.appointmentStatus)) {
        errors.push('Invalid appointment status');
      } else {
        sanitizedParams.appointmentStatus = params.appointmentStatus;
      }
    }

    // Validate department parameter
    if (params.department !== undefined) {
      const department = params.department.trim();
      if (department.length > 50) {
        errors.push('Department filter must be less than 50 characters');
      } else if (department.length > 0) {
        sanitizedParams.department = department.replace(/[<>\"']/g, '');
      }
    }

    // Validate company parameter
    if (params.company !== undefined) {
      const company = params.company.trim();
      if (company.length > 100) {
        errors.push('Company filter must be less than 100 characters');
      } else if (company.length > 0) {
        sanitizedParams.company = company.replace(/[<>\"']/g, '');
      }
    }

    // Validate pagination parameters
    if (params.limit !== undefined) {
      const limit = Number(params.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push('Limit must be between 1 and 100');
      } else {
        sanitizedParams.limit = limit;
      }
    }

    if (params.offset !== undefined) {
      const offset = Number(params.offset);
      if (isNaN(offset) || offset < 0) {
        errors.push('Offset must be a non-negative number');
      } else {
        sanitizedParams.offset = offset;
      }
    }

    // Validate sorting parameters
    if (params.sortBy !== undefined) {
      const validSortFields = ['name', 'studentCode', 'companyName', 'appointmentCount'];
      if (!validSortFields.includes(params.sortBy)) {
        errors.push('Invalid sort field');
      } else {
        sanitizedParams.sortBy = params.sortBy;
      }
    }

    if (params.sortOrder !== undefined) {
      if (!['asc', 'desc'].includes(params.sortOrder)) {
        errors.push('Sort order must be asc or desc');
      } else {
        sanitizedParams.sortOrder = params.sortOrder;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedParams
    };
  }

  // Enhanced visitor fetching with server-side filtering support
  reqGetVisitor = async (filterParams?: VisitorFilterParams): Promise<VisitorInterface[]> => {
    let url = PROTECTED_PATH.VISITOR_VISITOR_TRAINING_LIST + "/" + this.instructor_id;
    
    // If filter parameters are provided, validate and apply them
    if (filterParams) {
      const validation = this.validateFilterParams(filterParams);
      
      if (!validation.isValid) {
        throw new Error(`Filter validation failed: ${validation.errors.join(', ')}`);
      }

      // Build query parameters for server-side filtering
      const queryParams = new URLSearchParams();
      
      Object.entries(validation.sanitizedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
    }

    const response = await this.getAxiosInstance().get(url);
    const { data } = response;
    
    // Apply client-side filtering since backend doesn't support all filters yet
    if (filterParams) {
      return this.applyClientSideFiltering(data, filterParams);
    }
    
    return data;
  };

  // Client-side filtering implementation for features not yet supported by backend
  private applyClientSideFiltering(data: VisitorInterface[], filterParams: VisitorFilterParams): VisitorInterface[] {
    let filteredData = [...data];

    // Apply search filter
    if (filterParams.search) {
      const searchTerm = filterParams.search.toLowerCase();
      filteredData = filteredData.filter(visitor => {
        const firstName = visitor.studentEnroll?.student?.name || '';
        const lastName = visitor.studentEnroll?.student?.surname || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const studentCode = (visitor.studentEnroll?.student?.student_id || '').toLowerCase();
        const companyName = (visitor.studentEnroll?.student_training?.company?.name || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               studentCode.includes(searchTerm) || 
               companyName.includes(searchTerm);
      });
    }

    // Apply position filter
    if (filterParams.position) {
      filteredData = filteredData.filter(visitor => {
        const position = visitor.studentEnroll?.student_training?.position || '';
        return position.toLowerCase().includes(filterParams.position!.toLowerCase());
      });
    }

    // Apply company filter
    if (filterParams.company) {
      filteredData = filteredData.filter(visitor => {
        const companyName = visitor.studentEnroll?.student_training?.company?.name || '';
        return companyName.toLowerCase().includes(filterParams.company!.toLowerCase());
      });
    }

    // Apply department filter
    if (filterParams.department) {
      filteredData = filteredData.filter(visitor => {
        const department = visitor.studentEnroll?.student_training?.department || '';
        return department.toLowerCase().includes(filterParams.department!.toLowerCase());
      });
    }

    // Apply appointment status filter
    if (filterParams.appointmentStatus) {
      filteredData = filteredData.filter(visitor => {
        const hasSchedules = visitor.schedules && visitor.schedules.length > 0;
        const now = new Date();
        
        let status = 'รอนัดหมาย';
        if (hasSchedules) {
          const completedVisits = visitor.schedules.filter(schedule => 
            new Date(schedule.visitAt) <= now
          ).length;
          const totalVisits = visitor.schedules.length;
          
          if (completedVisits === totalVisits && totalVisits > 0) {
            status = 'เสร็จสิ้น';
          } else if (completedVisits > 0) {
            status = 'นัดหมายแล้ว';
          }
        }
        
        return status === filterParams.appointmentStatus;
      });
    }

    // Apply sorting
    if (filterParams.sortBy) {
      filteredData.sort((a, b) => {
        let aValue = '';
        let bValue = '';
        
        switch (filterParams.sortBy) {
          case 'name':
            aValue = `${a.studentEnroll?.student?.name || ''} ${a.studentEnroll?.student?.surname || ''}`;
            bValue = `${b.studentEnroll?.student?.name || ''} ${b.studentEnroll?.student?.surname || ''}`;
            break;
          case 'studentCode':
            aValue = a.studentEnroll?.student?.student_id || '';
            bValue = b.studentEnroll?.student?.student_id || '';
            break;
          case 'companyName':
            aValue = a.studentEnroll?.student_training?.company?.name || '';
            bValue = b.studentEnroll?.student_training?.company?.name || '';
            break;
          case 'appointmentCount':
            return (filterParams.sortOrder === 'desc' ? -1 : 1) * 
                   ((b.schedules?.length || 0) - (a.schedules?.length || 0));
          default:
            return 0;
        }
        
        const comparison = aValue.localeCompare(bValue, 'th');
        return filterParams.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination if specified
    if (filterParams.limit || filterParams.offset) {
      const offset = filterParams.offset || 0;
      const limit = filterParams.limit || filteredData.length;
      filteredData = filteredData.slice(offset, offset + limit);
    }

    return filteredData;
  }

  // Enhanced server-side filtering with pagination and sorting
  reqGetVisitorsWithFilters = async (filterParams: VisitorFilterParams & {
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: VisitorInterface[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => {
    const validation = this.validateFilterParams(filterParams);
    
    if (!validation.isValid) {
      throw new Error(`Filter validation failed: ${validation.errors.join(', ')}`);
    }

    // For now, implement client-side pagination since backend doesn't support it yet
    // In a real implementation, this would be a separate endpoint with server-side pagination
    const allData = await this.reqGetVisitor(validation.sanitizedParams);
    
    const page = filterParams.page || 1;
    const pageSize = filterParams.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedData = allData.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      total: allData.length,
      page,
      pageSize,
      totalPages: Math.ceil(allData.length / pageSize)
    };
  };

  // Enhanced visitor fetching with advanced search capabilities
  reqSearchVisitors = async (searchParams: {
    query: string;
    searchFields?: ('name' | 'studentCode' | 'companyName' | 'position')[];
    filters?: Omit<VisitorFilterParams, 'search'>;
    fuzzySearch?: boolean;
    exactMatch?: boolean;
  }): Promise<VisitorInterface[]> => {
    const validation = this.validateFilterParams({
      search: searchParams.query,
      ...searchParams.filters
    });

    if (!validation.isValid) {
      throw new Error(`Search validation failed: ${validation.errors.join(', ')}`);
    }

    // For now, we'll use client-side filtering since the backend doesn't support advanced search
    // In a real implementation, this would be a separate endpoint
    const allVisitors = await this.reqGetVisitor();
    
    if (!searchParams.query.trim()) {
      return allVisitors;
    }

    const searchTerm = searchParams.query.toLowerCase();
    const searchFields = searchParams.searchFields || ['name', 'studentCode', 'companyName', 'position'];
    const fuzzySearch = searchParams.fuzzySearch || false;
    const exactMatch = searchParams.exactMatch || false;

    return allVisitors.filter(visitor => {
      return searchFields.some(field => {
        let fieldValue = '';
        
        switch (field) {
          case 'name':
            const firstName = visitor.studentEnroll?.student?.name || '';
            const lastName = visitor.studentEnroll?.student?.surname || '';
            fieldValue = `${firstName} ${lastName}`.toLowerCase();
            break;
          case 'studentCode':
            fieldValue = (visitor.studentEnroll?.student?.student_id || '').toLowerCase();
            break;
          case 'companyName':
            fieldValue = (visitor.studentEnroll?.student_training?.company?.name || '').toLowerCase();
            break;
          case 'position':
            fieldValue = (visitor.studentEnroll?.student_training?.position || '').toLowerCase();
            break;
          default:
            return false;
        }

        if (exactMatch) {
          return fieldValue === searchTerm;
        } else if (fuzzySearch) {
          // Simple fuzzy search implementation
          return this.fuzzyMatch(fieldValue, searchTerm);
        } else {
          return fieldValue.includes(searchTerm);
        }
      });
    });
  };

  // Advanced search with multiple criteria and operators
  reqAdvancedSearch = async (searchCriteria: {
    criteria: Array<{
      field: 'name' | 'studentCode' | 'companyName' | 'position' | 'major' | 'department';
      operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'not';
      value: string;
    }>;
    logicalOperator?: 'AND' | 'OR';
    filters?: VisitorFilterParams;
  }): Promise<VisitorInterface[]> => {
    const allVisitors = await this.reqGetVisitor(searchCriteria.filters);
    
    if (!searchCriteria.criteria.length) {
      return allVisitors;
    }

    const logicalOperator = searchCriteria.logicalOperator || 'AND';

    return allVisitors.filter(visitor => {
      const results = searchCriteria.criteria.map(criterion => {
        let fieldValue = '';
        
        switch (criterion.field) {
          case 'name':
            const firstName = visitor.studentEnroll?.student?.name || '';
            const lastName = visitor.studentEnroll?.student?.surname || '';
            fieldValue = `${firstName} ${lastName}`.toLowerCase();
            break;
          case 'studentCode':
            fieldValue = (visitor.studentEnroll?.student?.student_id || '').toLowerCase();
            break;
          case 'companyName':
            fieldValue = (visitor.studentEnroll?.student_training?.company?.name || '').toLowerCase();
            break;
          case 'position':
            fieldValue = (visitor.studentEnroll?.student_training?.position || '').toLowerCase();
            break;
          case 'major':
            // Assuming major is available in student data - would need to be added to API response
            fieldValue = ''; // TODO: Add major field to API response
            break;
          case 'department':
            // Assuming department is available in company data - would need to be added to API response
            fieldValue = ''; // TODO: Add department field to API response
            break;
          default:
            return false;
        }

        const searchValue = criterion.value.toLowerCase();

        switch (criterion.operator) {
          case 'contains':
            return fieldValue.includes(searchValue);
          case 'equals':
            return fieldValue === searchValue;
          case 'startsWith':
            return fieldValue.startsWith(searchValue);
          case 'endsWith':
            return fieldValue.endsWith(searchValue);
          case 'not':
            return !fieldValue.includes(searchValue);
          default:
            return false;
        }
      });

      return logicalOperator === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  };

  // Simple fuzzy matching implementation
  private fuzzyMatch(text: string, pattern: string): boolean {
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;

    const textLen = text.length;
    const patternLen = pattern.length;
    
    let textIndex = 0;
    let patternIndex = 0;
    
    while (textIndex < textLen && patternIndex < patternLen) {
      if (text[textIndex] === pattern[patternIndex]) {
        patternIndex++;
      }
      textIndex++;
    }
    
    return patternIndex === patternLen;
  }

  reqGetVisitorSchedule = async (
    training_id: number
  ): Promise<VisitorInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_VISITOR_SCHEDULE_LIST + "/" + training_id
    );
    const { data } = response;
    return data;
  };

  reqPostVisitorSchedule = async (
    entity: VisitorScheduleDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().post(
      PROTECTED_PATH.VISITOR_ASSIGN_SCHEDULE,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutVisitorSchedule = async (
    id: number,
    entity: VisitorScheduleDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_ASSIGN_SCHEDULE + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
  reqGetVisitorScheduleReport = async (
    schedule_id: number
  ): Promise<VisitorScheduleReportInterface> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_VISITOR_SCHEDULE_REPORT + `/${schedule_id}`
    );

    const { data } = response;
    return data;
  };
  reqGetVisitorEvaluateStudent = async (
    id: number
  ): Promise<VisitorEvaluateStudentInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_EVALUATE_STUDENT + `/${id}`
    );

    const { data } = response;
    return data;
  };
  reqGetVisitorEvaluateCompany = async (
    id: number
  ): Promise<VisitorEvaluateStudentInterface[]> => {
    const response = await this.getAxiosInstance().get(
      PROTECTED_PATH.VISITOR_EVALUATE_COMPANY + `/${id}`
    );

    const { data } = response;
    return data;
  };

  reqPutVisitorEvaluateStudent = async (
    id: number,
    entity: VisitorEvaluateStudentDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_EVALUATE_STUDENT + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
  reqPutVisitorEvaluateCompany = async (
    id: number,
    entity: VisitorEvaluateStudentDTO
  ): Promise<AxiosResponse> => {
    const response = await this.getAxiosInstance().put(
      PROTECTED_PATH.VISITOR_EVALUATE_COMPANY + `/${id}`,
      entity
    );
    const { data } = response;
    return data;
  };
}
