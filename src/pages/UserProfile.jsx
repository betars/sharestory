import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostContext';
import PostList from '../components/posts/PostList';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Button, 
  Tabs, 
  Tab, 
  Divider,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function UserProfile() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { getPosts } = usePosts();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const mountedRef = useRef(true);
  
  // 使用 useMemo 缓存过滤条件，避免不必要的重新渲染
  const postsFilter = useMemo(() => ({ authorId: id }), [id]);
  
  // 当 id 变化时重置状态
  useEffect(() => {
    setLoading(true);
    setError('');
    setUser(null);
    setPosts([]);
  }, [id]);
  
  // 组件挂载/卸载处理
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 获取用户信息
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        // 从 Firestore 获取用户信息
        const userRef = doc(db, 'users', id);
        const userDoc = await getDoc(userRef);
        
        if (!mountedRef.current) return; // 如果组件已卸载，不更新状态
        
        if (!userDoc.exists()) {
          setError('用户不存在');
          setLoading(false);
          return;
        }
        
        const userData = {
          id: userDoc.id,
          ...userDoc.data()
        };
        
        setUser(userData);
        
        // 获取用户发布的帖子
        const userPosts = await getPosts({ authorId: id });
        
        if (!mountedRef.current) return; // 如果组件已卸载，不更新状态
        
        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        console.error('获取用户信息失败', error);
        if (mountedRef.current) {
          setError('获取用户信息失败: ' + (error.message || '未知错误'));
          setLoading(false);
        }
      }
    };
    
    if (loading) {
      fetchUserData();
    }
  }, [id, getPosts, loading]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // 渲染加载状态的骨架屏
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
          {/* 封面图骨架屏 */}
          <Skeleton variant="rectangular" height={150} animation="wave" />
          
          {/* 用户信息骨架屏 */}
          <Box sx={{ p: 3, pt: 0, position: 'relative' }}>
            <Skeleton 
              variant="circular"
              width={120}
              height={120}
              animation="wave"
              sx={{
                position: 'relative',
                top: -60,
                mb: -4
              }}
            />
            
            <Box sx={{ mt: 8, mb: 2 }}>
              <Skeleton variant="text" width="60%" height={40} animation="wave" />
              <Skeleton variant="text" width="80%" animation="wave" />
              <Skeleton variant="text" width="40%" animation="wave" />
            </Box>
          </Box>
          
          {/* 选项卡骨架屏 */}
          <Box sx={{ px: 3, pb: 1 }}>
            <Skeleton variant="rectangular" height={48} animation="wave" />
          </Box>
        </Paper>
        
        {/* 内容骨架屏 */}
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} animation="wave" />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} animation="wave" />
          <Skeleton variant="rectangular" height={100} animation="wave" />
        </Paper>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} to="/" variant="outlined">
          返回首页
        </Button>
      </Container>
    );
  }
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          用户不存在或已被删除
        </Alert>
        <Button component={Link} to="/" variant="outlined">
          返回首页
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* 用户资料卡片 */}
      <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
        {/* 封面图 */}
        <Box 
          sx={{ 
            height: 150, 
            bgcolor: 'primary.light', 
            position: 'relative' 
          }}
        />
        
        {/* 用户信息 */}
        <Box sx={{ p: 3, pt: 0, position: 'relative' }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName || '用户'}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              position: 'relative',
              top: -60,
              mb: -4
            }}
          >
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user.displayName || '未设置昵称'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user.bio || '这个用户很懒，还没有填写个人简介'}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{posts.length}</strong> 帖子
                </Typography>
                {/* 可以添加更多统计信息，如粉丝数、关注数等 */}
              </Box>
            </Box>
            
            {currentUser && currentUser.uid !== id && (
              <Button variant="contained" color="primary">
                关注
              </Button>
            )}
          </Box>
        </Box>
        
        {/* 选项卡 */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="帖子" />
          <Tab label="关于" />
        </Tabs>
      </Paper>
      
      {/* 选项卡内容 - 使用固定高度容器避免布局偏移 */}
      <Box sx={{ minHeight: posts.length > 0 ? 'auto' : 200 }}>
        {tabValue === 0 && (
          <Box>
            {posts.length > 0 ? (
              <PostList 
                key={`user-posts-${id}`} // 添加 key 属性，确保用户切换时重新渲染
                posts={posts} // 直接传递已获取的帖子数据
                initialLoading={false} // 指示数据已加载完成
              />
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  该用户还没有发布任何帖子
                </Typography>
              </Paper>
            )}
          </Box>
        )}
        
        {tabValue === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>关于 {user.displayName || '该用户'}</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">个人简介</Typography>
              <Typography variant="body1">
                {user.bio || '这个用户很懒，还没有填写个人简介'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">注册时间</Typography>
              <Typography variant="body1">
                {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : '未知'}
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
} 