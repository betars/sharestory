import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/posts/PostList';
import { Link } from 'react-router-dom';

export default function Home() {
  const { currentUser } = useAuth();
  
  return (
    <div className="max-w-3xl mx-auto px-4 mt-6">
      {!currentUser && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-2">
            欢迎来到匿名社交平台
          </h2>
          <p className="text-gray-700 mb-4">
            这里是一个可以自由分享想法和交流的平台。
          </p>
          <div className="flex gap-4">
            <Link 
              to="/signup"
              className="btn-primary"
            >
              立即注册
            </Link>
            <Link 
              to="/login"
              className="btn-secondary"
            >
              登录
            </Link>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-4">
        最新动态
      </h2>
      
      <PostList filter={{ orderBy: 'createdAt', order: 'desc' }} />
      
      {currentUser && (
        <Link 
          to="/create-post"
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="发布新帖子"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}
    </div>
  );
} 