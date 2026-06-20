import React from 'react';

const LoadingSpinner = ({ message = 'Loading geo data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-violet-100 dark:border-slate-800 animate-pulse"></div>
        {/* Inner spinning wheel */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-t-violet-600 border-r-violet-600 animate-spin"></div>
      </div>
      <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse tracking-wide">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
