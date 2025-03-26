import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/posts/PostList';
import { Link } from 'react-router-dom';
import { usePosts } from '../contexts/PostContext';

export default function Home() {
  const { currentUser } = useAuth();
  const { getPosts } = usePosts();
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 直接在Home组件中获取帖子
  useEffect(() => {
    async function fetchPosts() {
      try {
        console.log("Home组件: 开始获取帖子");
        setLoading(true);
        const fetchedPosts = await getPosts({ orderBy: 'createdAt', order: 'desc' });
        console.log("Home组件: 获取到帖子数据", fetchedPosts.length);
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Home组件: 获取帖子失败", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [getPosts]);
  
  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 pb-20" style={{ minHeight: '100vh' }}>
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
      
      {/* 直接传递posts数据和loading状态给PostList */}
      <PostList 
        posts={posts}
        initialLoading={loading}
      />
      
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

      {error && (
        <div className="my-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          <p>加载失败: {error}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      )}
    </div>
  );
} 