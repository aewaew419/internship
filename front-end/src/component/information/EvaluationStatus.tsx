import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';

interface EvaluationStatusProps {
  /**
   * Whether the evaluation has been completed
   */
  isEvaluated: boolean;
  /**
   * Optional timestamp of when the evaluation was completed
   */
  evaluationDate?: string | Date;
  /**
   * Whether to show the timestamp alongside the status
   */
  showTimestamp?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
}

/**
 * EvaluationStatus component displays "ประเมินแล้ว" status for completed evaluations
 * Matches the existing design system using Material-UI components with custom styling
 */
export const EvaluationStatus: React.FC<EvaluationStatusProps> = ({
  isEvaluated,
  evaluationDate,
  showTimestamp = false,
  className = '',
}) => {
  if (!isEvaluated) {
    return null;
  }

  const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Chip
        icon={<CheckCircleIcon />}
        label="ประเมินแล้ว"
        variant="filled"
        sx={{
          backgroundColor: '#2f7b69', // success color from CSS variables
          color: 'white',
          fontWeight: 'medium',
          '& .MuiChip-icon': {
            color: 'white',
          },
          '&:hover': {
            backgroundColor: '#2f7b69',
            opacity: 0.9,
          },
        }}
      />
      {showTimestamp && evaluationDate && (
        <span className="text-sm text-secondary-600 font-medium">
          {formatDate(evaluationDate)}
        </span>
      )}
    </div>
  );
};

export default EvaluationStatus;