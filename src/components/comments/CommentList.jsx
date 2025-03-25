import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { 
  Box, 
  Typography, 
  Avatar, 
  Divider, 
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function CommentList({ comments: externalComments = null, userId = null, showPostInfo = false }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getUserComments } = usePosts();
  
  useEffect(() => {
    if (externalComments) {
      setComments(externalComments);
      setLoading(false);
      return;
    }
    
    async function fetchComments() {
      try {
        setLoading(true);
        setError('');
        
        if (!userId) {
          setComments([]);
          setLoading(false);
          return;
        }
        
        const fetchedComments = await getUserComments(userId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('获取评论失败', error);
        setError('获取评论失败: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
  }, [externalComments, userId, getUserComments]);
  
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
  
  if (comments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="body1" color="text.secondary">
          暂无评论
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ my: 2 }}>
      {comments.map((comment) => (
        <Card key={comment.id} sx={{ mb: 2, boxShadow: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar 
                src={comment.authorAvatar} 
                alt={comment.authorName}
                sx={{ mr: 2, width: 40, height: 40 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" component="div">
                    {comment.authorName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {comment.createdAt && formatDistanceToNow(
                      new Date(comment.createdAt.seconds * 1000 || comment.createdAt),
                      { addSuffix: true, locale: zhCN }
                    )}
                  </Typography>
                </Box>
                
                <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                  {comment.content}
                </Typography>
                
                {showPostInfo && comment.postId && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      评论于帖子: 
                      <Button 
                        component={Link} 
                        to={`/post/${comment.postId}`} 
                        size="small" 
                        sx={{ ml: 1 }}
                      >
                        查看帖子
                      </Button>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
} 