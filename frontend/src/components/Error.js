import React from 'react';
import { AlertTriangle } from 'lucide-react';

const Error = ({ message, className }) => {
  return (
    <div className={`bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md flex items-start ${className || ''}`}>
      <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div>{message || 'An error occurred. Please try again.'}</div>
    </div>
  );
};

export default Error; 