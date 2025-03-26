import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePosts } from '../../contexts/PostContext';
import PostCard from './PostCard';
import LoadingSpinner from '../common/LoadingSpinner';

// 使用 React.memo 包装组件，避免不必要的重新渲染
export default React.memo(function PostList({ 
  filter = {}, 
  posts: externalPosts = null, 
  initialLoading = true 
}) {
  // 使用useState而不是useRef跟踪首次渲染，确保状态更新触发重渲染
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [posts, setPosts] = useState(externalPosts || []);
  const [loading, setLoading] = useState(externalPosts ? false : initialLoading);
  const [error, setError] = useState('');
  const { getPosts } = usePosts();
  const mountedRef = useRef(true);
  
  // 简化获取帖子的函数，移除loading依赖以避免循环调用
  const fetchPosts = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log("开始获取帖子数据...");
      setLoading(true);
      setError('');
      
      // 添加超时处理，避免无限加载
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('获取数据超时')), 15000)
      );
      
      // 使用 Promise.race 实现超时控制
      const fetchedPosts = await Promise.race([
        getPosts(filter),
        timeoutPromise
      ]);
      
      console.log("获取到帖子数据:", fetchedPosts ? fetchedPosts.length : 0);
      
      if (mountedRef.current) {
        setPosts(fetchedPosts || []);
        setLoading(false);
        // 标记首次加载完成
        if (isFirstLoad) setIsFirstLoad(false);
      }
    } catch (error) {
      console.error('获取帖子失败', error);
      if (mountedRef.current) {
        setError('获取帖子失败: ' + (error.message || '未知错误'));
        setLoading(false);
        // 即使出错也标记首次加载完成
        if (isFirstLoad) setIsFirstLoad(false);
      }
    }
  }, [getPosts, filter, isFirstLoad]);
  
  // 组件挂载处理 - 简化逻辑
  useEffect(() => {
    mountedRef.current = true;
    
    // 如果有外部数据，直接使用
    if (externalPosts) {
      console.log("使用外部提供的帖子数据");
      setPosts(externalPosts);
      setLoading(false);
      setIsFirstLoad(false);
    } 
    // 否则，获取数据 (仅在组件挂载时执行一次)
    else {
      console.log("组件挂载，准备获取数据");
      fetchPosts();
    }
    
    return () => {
      console.log("组件卸载");
      mountedRef.current = false;
    };
  }, [externalPosts, fetchPosts]);
  
  // 监听过滤器变化 - 使用字符串化过滤器作为依赖
  const stringifiedFilter = JSON.stringify(filter);
  useEffect(() => {
    // 跳过首次加载，避免重复获取
    if (!isFirstLoad && !externalPosts) {
      console.log("过滤器变化，重新获取数据");
      fetchPosts();
    }
  }, [stringifiedFilter, externalPosts, fetchPosts, isFirstLoad]);
  
  // 外部数据变化处理 - 确保只在externalPosts真正变化时更新
  useEffect(() => {
    if (externalPosts) {
      console.log("外部数据变化，更新状态");
      setPosts(externalPosts);
      setLoading(false);
    }
  }, [externalPosts]);
  
  const handlePostDelete = useCallback((postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);
  
  // 显示加载和错误状态的调试信息
  console.log(`PostList 状态: loading=${loading}, error=${!!error}, posts=${posts.length}`);
  
  // 简化条件渲染逻辑
  return (
    <div className="min-h-screen">
      {loading && (
        <div>
          <LoadingSpinner minHeight={300} />
          <div className="text-center text-gray-500 mt-2">正在加载内容...</div>
        </div>
      )}
      
      {!loading && error && (
        <div className="my-2 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <button 
              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              onClick={() => fetchPosts()}
            >
              重试
            </button>
          </div>
        </div>
      )}
      
      {!loading && !error && posts.length === 0 && (
        <div style={{ minHeight: '150px' }}>
          <div className="text-center my-4">
            <p className="text-gray-500">暂无帖子</p>
          </div>
        </div>
      )}
      
      {!loading && !error && posts.length > 0 && (
        <div className="my-2">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={handlePostDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}); 