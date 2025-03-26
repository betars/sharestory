import React from 'react';

export default function LoadingSpinner({ size = 40, minHeight = 200 }) {
  return (
    <div 
      className="w-full flex justify-center items-center"
      style={{ 
        minHeight: `${minHeight}px`,
        height: `${minHeight}px`
      }}
    >
      <div 
        className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: 'inline-block'
        }}
      ></div>
    </div>
  );
} 