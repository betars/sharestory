import React, { useState, useEffect } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';

export default function UserPoints({ userId }) {
  const { getUserPoints } = usePosts();
  const [userPoints, setUserPoints] = useState({ points: 0, history: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchUserPoints() {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError('');
        
        const points = await getUserPoints(userId);
        setUserPoints(points);
      } catch (error) {
        console.error('获取积分失败', error);
        setError('获取积分失败: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserPoints();
  }, [userId, getUserPoints]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  const { points, history } = userPoints;
  const postCount = history.post || 0;
  const commentCount = history.comment || 0;
  const favoriteCount = history.favorite || 0;
  const likeCount = history.like || 0;
  
  const pointsData = [
    { name: '发帖', count: postCount, icon: <StarIcon color="primary" />, points: postCount * 5 },
    { name: '评论', count: commentCount, icon: <CommentIcon color="secondary" />, points: commentCount * 1 },
    { name: '收藏', count: favoriteCount, icon: <BookmarkIcon color="success" />, points: favoriteCount * 2 },
    { name: '点赞', count: likeCount, icon: <ThumbUpIcon color="info" />, points: likeCount * 1 }
  ];
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <EmojiEventsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h6">积分详情</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Chip
          icon={<EmojiEventsIcon />}
          label={`总积分: ${points}`}
          color="primary"
          sx={{ px: 2, py: 3, fontSize: '1.2rem' }}
        />
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>活动类型</TableCell>
              <TableCell align="center">数量</TableCell>
              <TableCell align="center">单次积分</TableCell>
              <TableCell align="right">获得积分</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pointsData.map((item) => (
              <TableRow key={item.name}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                    <Typography sx={{ ml: 1 }}>{item.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{item.count}</TableCell>
                <TableCell align="center">
                  {item.name === '发帖' && '+5'}
                  {item.name === '评论' && '+1'}
                  {item.name === '收藏' && '+2'}
                  {item.name === '点赞' && '+1'}
                </TableCell>
                <TableCell align="right">{item.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          * 积分规则：发帖 +5，评论 +1，收藏 +2，点赞 +1
        </Typography>
      </Box>
    </Paper>
  );
} 