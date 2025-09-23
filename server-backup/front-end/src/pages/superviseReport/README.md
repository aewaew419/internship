# SuperviseReportViewModel

A comprehensive React hook for managing supervision report data with API integration, filtering, and error handling.

## Features

- **Comprehensive Data Fetching**: Fetches visitor data and evaluation scores from multiple API endpoints
- **Data Aggregation**: Combines visitor schedules with evaluation data for comprehensive reporting
- **Advanced Filtering**: Search by student name/code, filter by position, major, and appointment status
- **Error Handling**: Robust error handling with retry mechanisms and user-friendly error messages
- **Real-time Updates**: Automatic data refresh and manual refresh capabilities
- **Performance Optimized**: Caching of evaluation data to reduce API calls

## Usage

```typescript
import { useSuperviseReportViewModel } from './pages/superviseReport';

function SuperviseReportPage() {
  const {
    // Data
    reportData,
    filteredReportData,
    summaryStats,
    
    // State
    loading,
    error,
    filters,
    
    // Methods
    applyFilters,
    refreshData,
    generateDetailedReport,
    clearError
  } = useSuperviseReportViewModel();

  // Apply search filter
  const handleSearch = (searchTerm: string) => {
    applyFilters({ search: searchTerm });
  };

  // Generate detailed report for specific visitor
  const handleViewDetails = async (visitorId: number) => {
    const detailedReport = await generateDetailedReport(visitorId);
    if (detailedReport) {
      // Handle detailed report data
      console.log(detailedReport);
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && (
        <div>
          Error: {error}
          <button onClick={clearError}>Clear Error</button>
          <button onClick={refreshData}>Retry</button>
        </div>
      )}
      
      {/* Search and filters */}
      <input 
        type="text" 
        value={filters.search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name or student code"
      />
      
      {/* Summary statistics */}
      <div>
        <p>Total Students: {summaryStats.totalStudents}</p>
        <p>Completed Evaluations: {summaryStats.completedEvaluations}</p>
        <p>Average Score: {summaryStats.averageScore.toFixed(2)}</p>
        <p>Pending Reports: {summaryStats.pendingReports}</p>
      </div>
      
      {/* Report data */}
      {filteredReportData.map(report => (
        <div key={report.id}>
          <h3>{report.studentName} ({report.studentCode})</h3>
          <p>Company: {report.companyName}</p>
          <p>Status: {report.appointmentStatus}</p>
          <p>Average Score: {report.averageScore.toFixed(2)}</p>
          <p>Visits: {report.completedVisits}/{report.totalVisits}</p>
          <button onClick={() => handleViewDetails(report.id)}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Integration

The ViewModel integrates with the following VisitorService APIs:

- `reqGetVisitor()`: Fetches all visitor training data
- `reqGetVisitorEvaluateStudent(id)`: Fetches student evaluation data
- `reqGetVisitorEvaluateCompany(id)`: Fetches company evaluation data

## Data Structure

### AggregatedReportData
```typescript
interface AggregatedReportData {
  id: number;
  studentName: string;
  studentCode: string;
  companyName: string;
  supervisorName: string;
  jobPosition: string;
  appointmentStatus: AppointmentStatus;
  appointmentCount: number;
  evaluationScores: EvaluationScore[];
  averageScore: number;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  lastEvaluationDate?: string;
  visitReports?: VisitReport[];
}
```

### Summary Statistics
```typescript
interface SummaryStats {
  totalStudents: number;
  completedEvaluations: number;
  averageScore: number;
  pendingReports: number;
}
```

## Error Handling

The ViewModel provides comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Data Validation**: Validates API responses before processing
- **User-Friendly Messages**: Converts technical errors to user-friendly messages
- **Error Recovery**: Maintains existing data when possible during errors

## Performance Considerations

- **Evaluation Caching**: Evaluation data is cached to avoid redundant API calls
- **Lazy Loading**: Evaluation data is fetched on-demand for better initial load performance
- **Batch Processing**: Limits concurrent evaluation fetches to avoid overwhelming the server
- **Memoization**: Uses React.useMemo for expensive computations

## Testing

The ViewModel includes comprehensive unit tests covering:

- Initial state and data fetching
- Error handling and retry mechanisms
- Filtering and search functionality
- Data validation and transformation
- API integration scenarios

Run tests with:
```bash
npm test src/pages/superviseReport/__tests__/viewModel.test.ts
```