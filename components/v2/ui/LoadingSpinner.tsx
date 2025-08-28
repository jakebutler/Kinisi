import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-[var(--brand-puce)] mx-auto ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-2 text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner };
