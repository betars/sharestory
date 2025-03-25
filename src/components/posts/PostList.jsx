import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePosts } from '../../contexts/PostContext';
import PostCard from './PostCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Box, 
  Typography, 
  Alert,
  Button
} from '@mui/material';

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 使用 React.memo 包装组件，避免不必要的重新渲染
export default React.memo(function PostList({ 
  filter = {}, 
  posts: externalPosts = null, 
  initialLoading = true 
}) {
  const [posts, setPosts] = useState(externalPosts || []);
  const [loading, setLoading] = useState(externalPosts ? false : initialLoading);
  const [error, setError] = useState('');
  const { getPosts } = usePosts();
  const mountedRef = useRef(true);
  
  // 组件挂载/卸载处理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 获取帖子的函数
  const fetchPosts = useCallback(async () => {
    if (externalPosts !== null) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 使用 PostContext 中的方法获取帖子
      const fetchedPosts = await getPosts(filter);
      
      if (mountedRef.current) {
        setPosts(fetchedPosts);
        setLoading(false);
      }
    } catch (error) {
      console.error('获取帖子失败', error);
      if (mountedRef.current) {
        setError('获取帖子失败: ' + error.message);
        setLoading(false);
      }
    }
  }, [getPosts, filter, externalPosts]);
  
  // 防抖处理的 setPosts 函数
  const debouncedSetPosts = useCallback(
    debounce((newPosts) => {
      if (mountedRef.current) {
        setPosts(newPosts);
      }
    }, 50),
    []
  );
  
  // 只有在没有传入外部 posts 数据时才获取数据
  useEffect(() => {
    if (externalPosts !== null) {
      // 使用防抖处理，避免频繁更新
      debouncedSetPosts(externalPosts);
      if (loading) setLoading(false);
      return;
    }
    
    fetchPosts();
  }, [filter, externalPosts, fetchPosts, debouncedSetPosts, loading]);
  
  const handlePostDelete = useCallback((postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ my: 2 }}
        action={
          <Button color="inherit" size="small" onClick={fetchPosts}>
            重试
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  if (posts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="body1" color="text.secondary">
          暂无帖子
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ my: 2 }}>
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          onDelete={handlePostDelete}
        />
      ))}
    </Box>
  );
}); 