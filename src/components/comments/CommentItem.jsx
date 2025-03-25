import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CommentForm from './CommentForm';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Paper,
  CircularProgress,
  Tooltip,
  Badge,
  Divider,
  Fade,
  Chip
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc, deleteDoc, updateDoc, increment, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 使用 memo 包装组件以避免不必要的重新渲染
export default memo(function CommentItem({ comment, postId, onCommentAdded, parentId = null }) {
  // 添加安全检查
  if (!comment || !comment.id || !postId) {
    console.error('CommentItem 接收到无效的评论数据:', comment, postId);
    return null;
  }

  try {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes || 0);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    // 确定是否为回复评论
    const isReply = parentId !== null;
    const isAuthor = currentUser && comment.authorId === currentUser.uid;
    
    // 使用 useCallback 包装事件处理函数
    const handleLike = useCallback(async () => {
      if (!currentUser) return;
      
      try {
        const likeRef = doc(db, 'commentLikes', `${currentUser.uid}_${comment.id}`);
        const likeDoc = await getDoc(likeRef);
        
        if (likeDoc.exists()) {
          // 取消点赞
          await deleteDoc(likeRef);
          
          // 更新评论点赞数
          const commentRef = doc(db, 'comments', comment.id);
          await updateDoc(commentRef, {
            likes: increment(-1)
          });
          
          setLiked(false);
          setLikeCount(prev => prev - 1);
        } else {
          // 添加点赞
          await setDoc(likeRef, {
            userId: currentUser.uid,
            commentId: comment.id,
            createdAt: serverTimestamp()
          });
          
          // 更新评论点赞数
          const commentRef = doc(db, 'comments', comment.id);
          await updateDoc(commentRef, {
            likes: increment(1)
          });
          
          setLiked(true);
          setLikeCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('评论点赞失败', error);
      }
    }, [currentUser, comment.id]);
    
    const handleMenuOpen = useCallback((event) => {
      setAnchorEl(event.currentTarget);
    }, []);
    
    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);
    
    const handleDeleteClick = useCallback(() => {
      handleMenuClose();
      setDeleteDialogOpen(true);
    }, [handleMenuClose]);
    
    const handleDeleteConfirm = useCallback(async () => {
      try {
        // 删除评论
        await deleteDoc(doc(db, 'comments', comment.id));
        
        // 更新帖子评论计数
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          comments: increment(-1)
        });
        
        setDeleteDialogOpen(false);
        
        // 刷新评论列表
        window.location.reload();
      } catch (error) {
        console.error('删除评论失败', error);
      }
    }, [comment.id, postId]);
    
    const handleReplyAdded = useCallback((newReply) => {
      setReplies(prevReplies => [...prevReplies, newReply]);
      setShowReplies(true);
    }, []);
    
    // 添加头像点击处理函数
    const handleAvatarClick = useCallback(() => {
      if (comment.isAnonymous) return; // 匿名用户不可点击
      navigate(`/user/${comment.authorId}`);
    }, [comment.authorId, comment.isAnonymous, navigate]);
    
    useEffect(() => {
      let isMounted = true;
      
      // 检查当前用户是否已点赞
      const checkLiked = async () => {
        if (!currentUser || !isMounted) return;
        
        try {
          const likeRef = doc(db, 'commentLikes', `${currentUser.uid}_${comment.id}`);
          const likeDoc = await getDoc(likeRef);
          if (isMounted) {
            setLiked(likeDoc.exists());
          }
        } catch (error) {
          console.error('检查评论点赞状态失败', error);
        }
      };
      
      // 获取回复
      const fetchReplies = async () => {
        if (!comment.id || !isMounted) return;
        
        try {
          setLoadingReplies(true);
          
          // 尝试使用需要索引的查询
          try {
            const repliesQuery = query(
              collection(db, 'comments'),
              where('parentId', '==', comment.id),
              orderBy('createdAt', 'asc')
            );
            
            const querySnapshot = await getDocs(repliesQuery);
            const fetchedReplies = [];
            
            querySnapshot.forEach((doc) => {
              fetchedReplies.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            if (isMounted) {
              setReplies(fetchedReplies);
              setLoadingReplies(false);
            }
          } catch (indexError) {
            console.log('索引尚未构建完成，使用备用查询方法');
            
            // 备用方案：不使用 orderBy，只按 parentId 过滤，然后在客户端排序
            const simpleQuery = query(
              collection(db, 'comments'),
              where('parentId', '==', comment.id)
            );
            
            const querySnapshot = await getDocs(simpleQuery);
            const fetchedReplies = [];
            
            querySnapshot.forEach((doc) => {
              fetchedReplies.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            // 在客户端进行排序
            fetchedReplies.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateA - dateB; // 升序排序
            });
            
            if (isMounted) {
              setReplies(fetchedReplies);
              setLoadingReplies(false);
            }
          }
        } catch (error) {
          console.error('获取回复失败', error);
          if (isMounted) {
            setLoadingReplies(false);
          }
        }
      };
      
      checkLiked();
      fetchReplies();
      
      return () => {
        isMounted = false;
      };
    }, [currentUser, comment.id]);
    
    // 格式化日期
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 计算时间差
    const getTimeAgo = (timestamp) => {
      if (!timestamp) return '';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return '刚刚';
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}分钟前`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}小时前`;
      } else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)}天前`;
      } else {
        return formatDate(timestamp);
      }
    };
    
    return (
      <Fade in={true} timeout={500}>
        <Paper 
          elevation={isReply ? 0 : 1} 
          sx={{ 
            p: isReply ? 2 : 3, 
            mb: isReply ? 1 : 3,
            ml: isReply ? 2 : 0,
            borderRadius: 2,
            bgcolor: isReply ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
            border: isReply ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: isReply ? '0 2px 8px rgba(0,0,0,0.05)' : '0 4px 12px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Box sx={{ display: 'flex' }}>
            <Avatar 
              src={comment.authorAvatar} 
              alt={comment.authorName}
              onClick={comment.isAnonymous ? undefined : handleAvatarClick}
              sx={{ 
                width: isReply ? 36 : 40, 
                height: isReply ? 36 : 40,
                mr: 2,
                border: '2px solid #f0f0f0',
                transition: 'transform 0.2s',
                cursor: comment.isAnonymous ? 'default' : 'pointer',
                '&:hover': {
                  transform: comment.isAnonymous ? 'none' : 'scale(1.1)',
                  boxShadow: comment.isAnonymous ? 'none' : '0 0 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              {comment.isAnonymous ? '匿' : comment.authorName?.charAt(0)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant="subtitle2" 
                    component={comment.isAnonymous ? 'span' : Link}
                    to={comment.isAnonymous ? undefined : `/user/${comment.authorId}`}
                    sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'text.primary',
                      cursor: comment.isAnonymous ? 'default' : 'pointer',
                      '&:hover': {
                        color: comment.isAnonymous ? 'text.primary' : 'primary.main',
                        textDecoration: comment.isAnonymous ? 'none' : 'underline'
                      }
                    }}
                  >
                    {comment.isAnonymous ? '匿名用户' : comment.authorName}
                    {comment.isAnonymous && (
                      <Chip 
                        label="匿名" 
                        size="small" 
                        color="default" 
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                      />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.8rem', ml: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                    {getTimeAgo(comment.createdAt)}
                  </Box>
                </Box>
                
                {isAuthor && (
                  <Tooltip title="更多选项" arrow placement="top">
                    <IconButton 
                      size="small" 
                      onClick={handleMenuOpen}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mt: 1, 
                  mb: 2,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  color: 'text.primary',
                  fontSize: '0.95rem'
                }}
              >
                {comment.content}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Tooltip title={liked ? "取消点赞" : "点赞"} arrow placement="top">
                  <IconButton 
                    size="small" 
                    onClick={handleLike}
                    color={liked ? 'primary' : 'default'}
                    sx={{ 
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    <Badge badgeContent={likeCount > 0 ? likeCount : null} color="primary">
                      {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                {!isReply && (
                  <Tooltip title="回复" arrow placement="top">
                    <Button 
                      size="small" 
                      startIcon={<ReplyIcon fontSize="small" />}
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      color="primary"
                      sx={{ 
                        ml: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                      }}
                    >
                      回复
                    </Button>
                  </Tooltip>
                )}
                
                {!isReply && replies.length > 0 && (
                  <Tooltip title={showReplies ? "收起回复" : "查看回复"} arrow placement="top">
                    <Button 
                      size="small" 
                      endIcon={showReplies ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      onClick={() => setShowReplies(!showReplies)}
                      color="primary"
                      variant="text"
                      sx={{ 
                        ml: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                      }}
                    >
                      {replies.length}条回复
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { borderRadius: 2, minWidth: 120 }
            }}
          >
            <MenuItem onClick={handleDeleteClick}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              删除
            </MenuItem>
          </Menu>
          
          {/* 回复表单 */}
          <Collapse in={showReplyForm} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, ml: isReply ? 0 : 5 }}>
              <CommentForm 
                postId={postId} 
                parentId={comment.id} 
                onCommentAdded={handleReplyAdded}
              />
            </Box>
          </Collapse>
          
          {/* 回复列表 */}
          {!isReply && (
            <Collapse in={showReplies} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, ml: 5 }}>
                {loadingReplies ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  replies.map((reply, index) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      postId={postId}
                      parentId={comment.id}
                    />
                  ))
                )}
              </Box>
            </Collapse>
          )}
          
          {/* 删除确认对话框 */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            PaperProps={{
              sx: { borderRadius: 2, p: 1 }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              确认删除
              <IconButton
                aria-label="close"
                onClick={() => setDeleteDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography>
                确定要删除这条评论吗？此操作无法撤销。
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDeleteDialogOpen(false)} 
                color="primary"
                sx={{ borderRadius: 4 }}
              >
                取消
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                color="error" 
                variant="contained"
                sx={{ borderRadius: 4 }}
              >
                删除
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Fade>
    );
  } catch (error) {
    console.error('CommentItem 组件渲染时发生错误:', error, comment);
    return (
      <Fade in={true}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255, 235, 235, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
            <Typography color="error" variant="body2">
              评论加载错误: {error.message || '未知错误'}
            </Typography>
          </Box>
        </Paper>
      </Fade>
    );
  }
}); 