import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-2">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold mb-2">
          页面不存在
        </h2>
        
        <p className="text-gray-600 mb-8">
          抱歉，您访问的页面不存在或已被删除。
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  );
} 