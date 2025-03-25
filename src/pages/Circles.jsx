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
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Circles() {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchCircles();
  }, [tabValue, currentUser]);
  
  const fetchCircles = async () => {
    try {
      setLoading(true);
      setError('');
      
      let circlesQuery;
      
      if (tabValue === 0) { // 推荐圈子
        circlesQuery = query(
          collection(db, 'circles'),
          orderBy('members', 'desc'),
          limit(12)
        );
      } else if (tabValue === 1) { // 最新圈子
        circlesQuery = query(
          collection(db, 'circles'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      } else if (tabValue === 2 && currentUser) { // 我的圈子
        // 获取用户加入的圈子ID
        const userCirclesQuery = query(
          collection(db, 'circleMembers'),
          where('userId', '==', currentUser.uid)
        );
        
        const userCirclesSnapshot = await getDocs(userCirclesQuery);
        const circleIds = [];
        
        userCirclesSnapshot.forEach((doc) => {
          circleIds.push(doc.data().circleId);
        });
        
        if (circleIds.length > 0) {
          circlesQuery = query(
            collection(db, 'circles'),
            where('__name__', 'in', circleIds)
          );
        } else {
          setCircles([]);
          setLoading(false);
          return;
        }
      }
      
      if (circlesQuery) {
        const querySnapshot = await getDocs(circlesQuery);
        const fetchedCircles = [];
        
        querySnapshot.forEach((doc) => {
          fetchedCircles.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setCircles(fetchedCircles);
      } else {
        setCircles([]);
      }
    } catch (error) {
      console.error('获取圈子失败', error);
      setError('获取圈子失败: ' + error.message);
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
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          圈子
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/create-circle"
        >
          创建圈子
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch}>
          <TextField
            placeholder="搜索圈子..."
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
          <Tab label="推荐圈子" />
          <Tab label="最新圈子" />
          {currentUser && <Tab label="我的圈子" />}
        </Tabs>
      </Paper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchCircles}>
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
      ) : circles.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {tabValue === 2 ? '你还没有加入任何圈子' : '暂无圈子'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {circles.map((circle) => (
            <Grid item xs={12} sm={6} md={4} key={circle.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={circle.coverImage || 'https://source.unsplash.com/random/300x200/?community'}
                  alt={circle.name}
                />
                <CardContent>
                  <Typography 
                    variant="h6" 
                    component={Link} 
                    to={`/circle/${circle.id}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    {circle.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {circle.members || 0} 成员
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1
                    }}
                  >
                    {circle.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {circle.tags && circle.tags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link}
                    to={`/circle/${circle.id}`}
                  >
                    查看详情
                  </Button>
                  
                  {currentUser && tabValue !== 2 && (
                    <Button 
                      size="small" 
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    >
                      加入圈子
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 