interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "กำลังโหลด..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-100">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-text-600">{message}</p>
      </div>
    </div>
  );
};