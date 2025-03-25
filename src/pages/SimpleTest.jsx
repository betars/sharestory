import React from 'react';

/**
 * 简单测试页面，使用 Tailwind CSS 样式
 */
const SimpleTest = () => {
  return (
    <div className="max-w-lg mx-auto mt-8 p-8 border border-gray-200">
      <h1 className="text-2xl font-bold mb-4">
        简单测试页面
      </h1>
      
      <p className="text-gray-700 mb-4">
        这是一个简单的测试页面，使用 Tailwind CSS 样式。
      </p>
      
      <div className="flex gap-4 mt-4">
        <button className="btn-primary">
          主要按钮
        </button>
        <button className="btn-secondary">
          次要按钮
        </button>
      </div>
    </div>
  );
};

export default SimpleTest; 