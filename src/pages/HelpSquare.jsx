import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardActions, 
  Chip, 
  Avatar, 
  TextField, 
  InputAdornment, 
  IconButton,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as SolvedIcon,
  Help as UnsolvedIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// 求助分类
const HELP_CATEGORIES = [
  { id: 'study', name: '学习', color: '#2196f3' },
  { id: 'work', name: '工作', color: '#4caf50' },
  { id: 'life', name: '生活', color: '#ff9800' },
  { id: 'emotion', name: '情感', color: '#e91e63' },
  { id: 'health', name: '健康', color: '#9c27b0' },
  { id: 'other', name: '其他', color: '#607d8b' }
];

export default function HelpSquare() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [helpPosts, setHelpPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchHelpPosts();
  }, [tabValue, category]);
  
  const fetchHelpPosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      let helpQuery;
      
      if (tabValue === 0) { // 全部
        helpQuery = query(
          collection(db, 'helpPosts'),
          category !== 'all' ? where('category', '==', category) : where('category', '!=', ''),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else if (tabValue === 1) { // 未解决
        helpQuery = query(
          collection(db, 'helpPosts'),
          where('solved', '==', false),
          category !== 'all' ? where('category', '==', category) : where('category', '!=', ''),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else if (tabValue === 2) { // 已解决
        helpQuery = query(
          collection(db, 'helpPosts'),
          where('solved', '==', true),
          category !== 'all' ? where('category', '==', category) : where('category', '!=', ''),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else if (tabValue === 3 && currentUser) { // 我的求助
        helpQuery = query(
          collection(db, 'helpPosts'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }
      
      if (helpQuery) {
        const querySnapshot = await getDocs(helpQuery);
        const fetchedPosts = [];
        
        querySnapshot.forEach((doc) => {
          fetchedPosts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setHelpPosts(fetchedPosts);
      } else {
        setHelpPosts([]);
      }
    } catch (error) {
      console.error('获取求助帖子失败', error);
      setError('获取求助帖子失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    // 实现搜索功能
    console.log('搜索:', searchQuery);
  };
  
  const handleCreateHelp = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    navigate('/create-help');
  };
  
  // 格式化日期
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          求助广场
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateHelp}
        >
          发布求助
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label="全部" 
            color={category === 'all' ? 'primary' : 'default'} 
            onClick={() => handleCategoryChange('all')}
            clickable
          />
          {HELP_CATEGORIES.map((cat) => (
            <Chip 
              key={cat.id}
              label={cat.name}
              style={{ backgroundColor: category === cat.id ? cat.color : undefined, color: category === cat.id ? 'white' : undefined }}
              onClick={() => handleCategoryChange(cat.id)}
              clickable
            />
          ))}
        </Box>
        
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex' }}>
          <TextField
            placeholder="搜索求助..."
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
          <Tab label="全部" />
          <Tab label="未解决" />
          <Tab label="已解决" />
          {currentUser && <Tab label="我的求助" />}
        </Tabs>
      </Paper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchHelpPosts}>
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
      ) : helpPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" color="text.secondary">
            暂无求助帖子
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {helpPosts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={HELP_CATEGORIES.find(cat => cat.id === post.category)?.name || '其他'} 
                      size="small"
                      style={{ 
                        backgroundColor: HELP_CATEGORIES.find(cat => cat.id === post.category)?.color || '#607d8b',
                        color: 'white'
                      }}
                    />
                    {post.solved ? (
                      <Chip 
                        icon={<SolvedIcon />} 
                        label="已解决" 
                        size="small" 
                        color="success"
                      />
                    ) : (
                      <Chip 
                        icon={<UnsolvedIcon />} 
                        label="未解决" 
                        size="small" 
                        color="default"
                      />
                    )}
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    component={Link} 
                    to={`/help/${post.id}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1
                    }}
                  >
                    {post.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2
                    }}
                  >
                    {post.content}
                  </Typography>
                  
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Badge badgeContent={post.answers || 0} color="primary" sx={{ mr: 1 }}>
                      <Typography variant="body2">回答</Typography>
                    </Badge>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{post.points || 0} 积分</Typography>
                  </Box>
                  
                  <Button 
                    size="small" 
                    component={Link}
                    to={`/help/${post.id}`}
                    sx={{ ml: 'auto' }}
                  >
                    查看详情
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 