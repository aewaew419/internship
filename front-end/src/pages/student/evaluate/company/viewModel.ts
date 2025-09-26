import { StudentService } from "../../../../service/api/student";
import type {
  StudentEvaluateCompanyInterface,
  StudentEvaluateCompanyDTO,
  EvaluationStatusResponse,
  SubmissionResponse,
} from "../../../../service/api/student/type";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ViewModelState {
  student: StudentEvaluateCompanyInterface[];
  evaluationStatus: EvaluationStatusResponse | null;
  isLoading: boolean;
  isStatusLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  statusError: string | null;
  submissionSuccess: boolean;
  submissionMessage: string | null;
  validationError: string | null;
  isValidating: boolean;
}

const useViewModel = (id: number) => {
  const studentService = new StudentService();
  const navigate = useNavigate();
  
  const [state, setState] = useState<ViewModelState>({
    student: [],
    evaluationStatus: null,
    isLoading: false,
    isStatusLoading: false,
    isSubmitting: false,
    error: null,
    statusError: null,
    submissionSuccess: false,
    submissionMessage: null,
    validationError: null,
    isValidating: false,
  });

  // Validate URL parameters
  const validateUrlParameters = () => {
    setState(prev => ({ ...prev, isValidating: true, validationError: null }));
    
    // Check if ID parameter exists
    if (!id) {
      setState(prev => ({ 
        ...prev, 
        validationError: "Company ID is required. Please provide a valid company ID in the URL.",
        isValidating: false 
      }));
      return false;
    }
    
    // Check if ID is a valid number
    if (isNaN(id) || id <= 0) {
      setState(prev => ({ 
        ...prev, 
        validationError: "Invalid company ID. Please provide a valid numeric company ID.",
        isValidating: false 
      }));
      return false;
    }
    
    setState(prev => ({ ...prev, isValidating: false }));
    return true;
  };

  // Check evaluation status on component mount
  const checkEvaluationStatus = async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isStatusLoading: true, statusError: null }));
    
    try {
      const statusResponse = await studentService.checkEvaluationStatus(id);
      setState(prev => ({ 
        ...prev, 
        evaluationStatus: statusResponse,
        isStatusLoading: false 
      }));
    } catch (error: any) {
      console.error("Error checking evaluation status:", error);
      
      // Enhanced error handling with specific messages
      let errorMessage = "Failed to check evaluation status";
      
      if (error.message.includes("Company not found") || error.message.includes("Student training not found")) {
        errorMessage = "Company not found. Please check the company ID and try again.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "You are not authorized to view this evaluation.";
      } else if (error.message.includes("Access forbidden")) {
        errorMessage = "Access denied. You can only view your own evaluations.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setState(prev => ({ 
        ...prev, 
        statusError: errorMessage,
        isStatusLoading: false 
      }));
    }
  };

  const fetchStudentEnrollments = async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await studentService.getStudentEvaluateCompany(id);
      setState(prev => ({ 
        ...prev, 
        student: response,
        isLoading: false 
      }));
    } catch (error: any) {
      console.error("Error fetching student enrollments:", error);
      
      // Enhanced error handling with specific messages
      let errorMessage = "Failed to fetch evaluation data";
      
      if (error.response?.status === 404) {
        errorMessage = "Company not found. The specified company ID does not exist.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in and try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. You are not authorized to view this evaluation.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
    }
  };

  const handleOnsubmit = async (value: StudentEvaluateCompanyDTO) => {
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null,
      submissionSuccess: false,
      submissionMessage: null 
    }));

    try {
      const response: SubmissionResponse = await studentService.putStudentEvaluateCompany(id, value);
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        submissionSuccess: true,
        submissionMessage: response.message 
      }));

      // Update evaluation status after successful submission
      await checkEvaluationStatus();

      // Navigate back to the same page to show updated status
      // This ensures the URL stays the same but the component re-renders with new status
      if (response.redirectUrl) {
        // Small delay to show success message before redirect
        setTimeout(() => {
          navigate(response.redirectUrl, { replace: true });
        }, 1500);
      } else {
        // Fallback: refresh current page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (error: any) {
      console.error("Error submitting evaluation:", error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || "Failed to submit evaluation",
        isSubmitting: false 
      }));
    }
  };

  // Reset submission success state after a delay
  useEffect(() => {
    if (state.submissionSuccess) {
      const timer = setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          submissionSuccess: false,
          submissionMessage: null 
        }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.submissionSuccess]);

  useEffect(() => {
    // First validate URL parameters
    const isValid = validateUrlParameters();
    
    if (isValid && id) {
      // Check status first, then fetch enrollment data if not evaluated
      checkEvaluationStatus();
      fetchStudentEnrollments();
    }
  }, [id]);

  return { 
    student: state.student,
    evaluationStatus: state.evaluationStatus,
    isLoading: state.isLoading,
    isStatusLoading: state.isStatusLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    statusError: state.statusError,
    submissionSuccess: state.submissionSuccess,
    submissionMessage: state.submissionMessage,
    validationError: state.validationError,
    isValidating: state.isValidating,
    handleOnsubmit,
    checkEvaluationStatus,
    fetchStudentEnrollments,
    validateUrlParameters
  };
};
export default useViewModel;
