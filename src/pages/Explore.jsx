import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Grid, 
  TextField, 
  InputAdornment, 
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Whatshot as HotIcon,
  NewReleases as NewIcon,
  EmojiEvents as EventsIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Explore() {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchPosts();
  }, [tabValue]);
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      let postsQuery;
      
      if (tabValue === 0) { // 热门
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('likes', 'desc'),
          limit(20)
        );
      } else if (tabValue === 1) { // 最新
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else if (tabValue === 2) { // 话题
        // 这里可以实现话题相关的查询
        postsQuery = query(
          collection(db, 'posts'),
          where('hasTags', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }
      
      if (postsQuery) {
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = [];
        
        querySnapshot.forEach((doc) => {
          fetchedPosts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setPosts(fetchedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('获取帖子失败', error);
      setError('获取帖子失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    // 实现搜索功能
    console.log('搜索:', searchQuery);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          探索
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              placeholder="搜索帖子、话题、用户..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Paper>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<HotIcon />} label="热门" />
            <Tab icon={<NewIcon />} label="最新" />
            <Tab icon={<TrendingIcon />} label="话题" />
          </Tabs>
        </Paper>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchPosts}>
                重试
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="body1" color="text.secondary">
              暂无内容
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card>
                  {post.images && post.images.length > 0 && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={post.images[0]}
                      alt="帖子图片"
                    />
                  )}
                  <CardContent>
                    <Typography 
                      variant="body1" 
                      component={Link} 
                      to={`/post/${post.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        display: 'block',
                        mb: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                    </Typography>
                    
                    {post.tags && post.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {post.tags.map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small" 
                            component={Link}
                            to={`/tag/${tag}`}
                            clickable
                            sx={{ textDecoration: 'none' }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          alt={post.authorName || '用户'} 
                          src={post.authorAvatar}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {post.isAnonymous ? '匿名用户' : post.authorName}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link}
                      to={`/post/${post.id}`}
                    >
                      查看详情
                    </Button>
                    
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {post.likes || 0} 赞
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {post.comments || 0} 评论
                      </Typography>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
} 