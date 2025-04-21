import React from 'react';

const Loading = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClass = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-20 w-20'
  }[size] || 'h-12 w-12';

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className={`loader animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClass} mb-3`}></div>
      {message && <p className="text-gray-600 dark:text-gray-300">{message}</p>}
    </div>
  );
};

export default Loading; 