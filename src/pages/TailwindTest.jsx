import React from 'react';

/**
 * Tailwind CSS 测试页面
 */
const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="md:shrink-0">
            <div className="h-48 w-full bg-gradient-to-r from-blue-500 to-purple-500 md:h-full md:w-48"></div>
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Tailwind CSS</div>
            <h2 className="block mt-1 text-lg leading-tight font-medium text-black">使用 Tailwind CSS 构建美观的用户界面</h2>
            <p className="mt-2 text-gray-500">Tailwind CSS 是一个功能强大的实用优先 CSS 框架，让你可以直接在 HTML 中应用样式，而不需要编写自定义 CSS。</p>
            
            <div className="mt-6">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                开始使用
              </button>
              <button className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                了解更多
              </button>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-block h-10 w-10 rounded-full bg-gray-200"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">用户名</p>
                  <p className="text-sm text-gray-500">2023年3月12日</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tailwind CSS 功能</h2>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">实用优先</h3>
            <p className="mt-2 text-gray-500">直接在 HTML 中应用预定义的类，而不是编写自定义 CSS。</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">响应式设计</h3>
            <p className="mt-2 text-gray-500">使用简单的前缀如 sm:, md:, lg: 和 xl: 创建响应式布局。</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">可定制</h3>
            <p className="mt-2 text-gray-500">通过 tailwind.config.js 文件轻松定制颜色、间距、字体等。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest; 