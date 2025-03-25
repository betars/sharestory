import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Chip, 
  Avatar, 
  Divider, 
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CheckCircle as SolvedIcon,
  Help as UnsolvedIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Flag as FlagIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
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

export default function HelpDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [helpPost, setHelpPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState('');
  
  useEffect(() => {
    fetchHelpPost();
  }, [id]);
  
  const fetchHelpPost = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 获取求助帖子
      const helpDocRef = doc(db, 'helpPosts', id);
      const helpDocSnap = await getDoc(helpDocRef);
      
      if (helpDocSnap.exists()) {
        setHelpPost({
          id: helpDocSnap.id,
          ...helpDocSnap.data()
        });
        
        // 获取回答
        const answersQuery = query(
          collection(db, 'helpAnswers'),
          where('helpPostId', '==', id),
          orderBy('accepted', 'desc'),
          orderBy('votes', 'desc'),
          orderBy('createdAt', 'asc')
        );
        
        const answersSnap = await getDocs(answersQuery);
        const fetchedAnswers = [];
        
        answersSnap.forEach((doc) => {
          fetchedAnswers.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setAnswers(fetchedAnswers);
      } else {
        setError('求助帖子不存在或已被删除');
      }
    } catch (error) {
      console.error('获取求助详情失败', error);
      setError('获取求助详情失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    if (!answerContent.trim()) {
      alert('回答内容不能为空');
      return;
    }
    
    try {
      setAnswerLoading(true);
      
      // 创建回答
      const answerData = {
        helpPostId: id,
        content: answerContent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '',
        authorAvatar: currentUser.photoURL || '',
        isAnonymous,
        createdAt: serverTimestamp(),
        votes: 0,
        accepted: false
      };
      
      await addDoc(collection(db, 'helpAnswers'), answerData);
      
      // 更新帖子回答数
      const helpPostRef = doc(db, 'helpPosts', id);
      await updateDoc(helpPostRef, {
        answers: increment(1)
      });
      
      setAnswerContent('');
      setIsAnonymous(false);
      
      // 刷新回答列表
      fetchHelpPost();
    } catch (error) {
      console.error('提交回答失败', error);
      alert('提交回答失败: ' + error.message);
    } finally {
      setAnswerLoading(false);
    }
  };
  
  const handleAcceptAnswer = async () => {
    if (!currentUser || !helpPost || helpPost.authorId !== currentUser.uid) {
      alert('只有求助发布者才能采纳回答');
      return;
    }
    
    try {
      // 更新回答为已采纳
      const answerRef = doc(db, 'helpAnswers', selectedAnswerId);
      await updateDoc(answerRef, {
        accepted: true
      });
      
      // 更新帖子为已解决
      const helpPostRef = doc(db, 'helpPosts', id);
      await updateDoc(helpPostRef, {
        solved: true,
        acceptedAnswerId: selectedAnswerId
      });
      
      setAcceptDialogOpen(false);
      
      // 刷新数据
      fetchHelpPost();
    } catch (error) {
      console.error('采纳回答失败', error);
      alert('采纳回答失败: ' + error.message);
    }
  };
  
  const openAcceptDialog = (answerId) => {
    setSelectedAnswerId(answerId);
    setAcceptDialogOpen(true);
  };
  
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert 
          severity="error" 
          sx={{ my: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchHelpPost}>
              重试
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }
  
  if (!helpPost) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="info">求助帖子不存在或已被删除</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={HELP_CATEGORIES.find(cat => cat.id === helpPost.category)?.name || '其他'} 
                size="small"
                style={{ 
                  backgroundColor: HELP_CATEGORIES.find(cat => cat.id === helpPost.category)?.color || '#607d8b',
                  color: 'white',
                  marginRight: 8
                }}
              />
              {helpPost.solved ? (
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
            
            <Typography variant="h4" component="h1" gutterBottom>
              {helpPost.title}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" sx={{ mr: 2 }}>
              {helpPost.points || 0} 积分
            </Typography>
            
            {currentUser && helpPost.authorId === currentUser.uid && (
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            alt={helpPost.authorName || '用户'} 
            src={helpPost.authorAvatar}
            sx={{ mr: 1 }}
          />
          <Box>
            <Typography variant="subtitle2">
              {helpPost.isAnonymous ? '匿名用户' : helpPost.authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              发布于 {formatDate(helpPost.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {helpPost.content}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small">
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {helpPost.upvotes || 0}
            </Typography>
            
            <IconButton size="small">
              <ThumbDownIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2">
              {helpPost.downvotes || 0}
            </Typography>
          </Box>
          
          <Button 
            size="small" 
            startIcon={<FlagIcon />}
            color="error"
          >
            举报
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          {answers.length} 个回答
        </Typography>
        
        <Box>
          <Button variant="outlined" size="small" sx={{ mr: 1 }}>
            最新
          </Button>
          <Button variant="outlined" size="small">
            最热
          </Button>
        </Box>
      </Box>
      
      {answers.map((answer) => (
        <Paper key={answer.id} sx={{ p: 3, mb: 3, position: 'relative' }}>
          {answer.accepted && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                bgcolor: 'success.main', 
                color: 'white',
                px: 2,
                py: 0.5,
                borderBottomLeftRadius: 8
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                已采纳
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              alt={answer.authorName || '用户'} 
              src={answer.authorAvatar}
              sx={{ mr: 1 }}
            />
            <Box>
              <Typography variant="subtitle2">
                {answer.isAnonymous ? '匿名用户' : answer.authorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                回答于 {formatDate(answer.createdAt)}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
            {answer.content}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small">
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {answer.upvotes || 0}
              </Typography>
              
              <IconButton size="small">
                <ThumbDownIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">
                {answer.downvotes || 0}
              </Typography>
            </Box>
            
            {currentUser && 
             helpPost.authorId === currentUser.uid && 
             !helpPost.solved && 
             !answer.accepted && (
              <Button 
                variant="outlined" 
                color="success"
                size="small"
                onClick={() => openAcceptDialog(answer.id)}
              >
                采纳此回答
              </Button>
            )}
          </Box>
        </Paper>
      ))}
      
      {!helpPost.solved && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            我要回答
          </Typography>
          
          {currentUser ? (
            <Box component="form" onSubmit={handleSubmitAnswer}>
              <TextField
                label="写下你的回答..."
                multiline
                rows={6}
                fullWidth
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                disabled={answerLoading}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      disabled={answerLoading}
                    />
                  }
                  label="匿名回答"
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={answerLoading || !answerContent.trim()}
                >
                  {answerLoading ? <CircularProgress size={24} /> : '提交回答'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              请<Link to="/login" style={{ marginLeft: '4px', marginRight: '4px' }}>登录</Link>后回答
            </Alert>
          )}
        </Paper>
      )}
      
      <Dialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
      >
        <DialogTitle>采纳回答</DialogTitle>
        <DialogContent>
          <Typography>
            确定要采纳这个回答吗？采纳后将无法更改，并且问题将被标记为已解决。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)}>取消</Button>
          <Button onClick={handleAcceptAnswer} color="primary">确认采纳</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 