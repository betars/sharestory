import React from 'react';

/**
 * 使用 Tailwind CSS 的加载组件
 */
const TailwindLoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-700 font-medium">加载中...</p>
      </div>
    </div>
  );
};

export default TailwindLoadingSpinner; 