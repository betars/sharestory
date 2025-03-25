import React from 'react';

/**
 * 使用 Tailwind CSS 的基础测试页面
 */
const BasicTest = () => {
  return (
    <div className="p-4 max-w-xl mx-auto mt-4">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">
          基础 Tailwind CSS 测试
        </h1>
        
        <p className="text-gray-700 mb-4">
          这是一个使用 Tailwind CSS 样式的基础测试页面，不使用任何复杂组件。
        </p>
        
        <button className="btn-primary">
          测试按钮
        </button>
      </div>
    </div>
  );
};

export default BasicTest; 