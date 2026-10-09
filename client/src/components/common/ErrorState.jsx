import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center bg-rose-950/20 rounded-3xl border border-rose-900/40 my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-900/50 text-rose-400 flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h4 className="text-base font-bold text-[#F8FAFC] mb-1">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} icon={RotateCcw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
