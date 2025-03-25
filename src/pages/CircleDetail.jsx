import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/posts/PostList';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Chip, 
  Avatar, 
  Divider, 
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Fab
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function CircleDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchCircleData();
  }, [id, currentUser]);
  
  const fetchCircleData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 获取圈子信息
      const circleDocRef = doc(db, 'circles', id);
      const circleDocSnap = await getDoc(circleDocRef);
      
      if (circleDocSnap.exists()) {
        setCircle({
          id: circleDocSnap.id,
          ...circleDocSnap.data()
        });
        
        // 获取圈子成员
        const membersQuery = query(
          collection(db, 'circleMembers'),
          where('circleId', '==', id),
          where('status', '==', 'active')
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        const memberIds = [];
        
        membersSnapshot.forEach((doc) => {
          memberIds.push(doc.data().userId);
        });
        
        // 检查当前用户是否是成员
        if (currentUser) {
          setIsMember(memberIds.includes(currentUser.uid));
        }
        
        // 获取成员详细信息
        if (memberIds.length > 0) {
          const membersData = [];
          
          for (const memberId of memberIds) {
            const userDocRef = doc(db, 'users', memberId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              membersData.push({
                id: userDocSnap.id,
                ...userDocSnap.data()
              });
            }
          }
          
          setMembers(membersData);
        }
      } else {
        setError('圈子不存在');
      }
    } catch (error) {
      console.error('获取圈子信息失败', error);
      setError('获取圈子信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleJoinCircle = async () => {
    if (!currentUser) {
      // 重定向到登录页面
      return;
    }
    
    try {
      setJoinLoading(true);
      
      await addDoc(collection(db, 'circleMembers'), {
        circleId: id,
        userId: currentUser.uid,
        joinedAt: serverTimestamp(),
        status: 'active'
      });
      
      setIsMember(true);
      fetchCircleData(); // 刷新数据
    } catch (error) {
      console.error('加入圈子失败', error);
      alert('加入圈子失败: ' + error.message);
    } finally {
      setJoinLoading(false);
    }
  };
  
  const handleLeaveCircle = async () => {
    if (!currentUser) return;
    
    try {
      setJoinLoading(true);
      
      // 查找成员记录
      const memberQuery = query(
        collection(db, 'circleMembers'),
        where('circleId', '==', id),
        where('userId', '==', currentUser.uid)
      );
      
      const memberSnapshot = await getDocs(memberQuery);
      
      memberSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      setIsMember(false);
      setConfirmDialogOpen(false);
      fetchCircleData(); // 刷新数据
    } catch (error) {
      console.error('退出圈子失败', error);
      alert('退出圈子失败: ' + error.message);
    } finally {
      setJoinLoading(false);
    }
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
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchCircleData}>
              重试
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }
  
  if (!circle) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="info">圈子不存在或已被删除</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${circle.coverImage || 'https://source.unsplash.com/random/1200x400/?community'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          position: 'relative'
        }}
      >
        <Box sx={{ maxWidth: '60%' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {circle.name}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {circle.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              {members.length} 成员
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {circle.tags && circle.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                sx={{ color: 'white', borderColor: 'white' }}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
          {currentUser && (
            isMember ? (
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={joinLoading}
              >
                {joinLoading ? <CircularProgress size={24} color="inherit" /> : '退出圈子'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleJoinCircle}
                disabled={joinLoading}
                startIcon={<CheckIcon />}
              >
                {joinLoading ? <CircularProgress size={24} /> : '加入圈子'}
              </Button>
            )
          )}
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
          <Tab label="帖子" />
          <Tab label="成员" />
          <Tab label="关于" />
        </Tabs>
      </Paper>
      
      {tabValue === 0 && (
        <>
          <PostList filter={{ circleId: id }} />
          
          {currentUser && isMember && (
            <Fab 
              color="primary" 
              aria-label="发布新帖子" 
              component={Link}
              to={`/create-post?circleId=${id}`}
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
            >
              <AddIcon />
            </Fab>
          )}
        </>
      )}
      
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            圈子成员 ({members.length})
          </Typography>
          
          <List>
            {members.map((member) => (
              <ListItem key={member.id} component={Link} to={`/user/${member.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemAvatar>
                  <Avatar src={member.photoURL} alt={member.nickname || member.email} />
                </ListItemAvatar>
                <ListItemText 
                  primary={member.nickname || member.email} 
                  secondary={member.bio ? member.bio.substring(0, 60) + (member.bio.length > 60 ? '...' : '') : '这个人很懒，什么都没留下...'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            关于圈子
          </Typography>
          
          <Typography variant="body1" paragraph>
            {circle.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            圈子规则
          </Typography>
          
          <Typography variant="body2" paragraph>
            {circle.rules || '暂无圈子规则'}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            创建时间
          </Typography>
          
          <Typography variant="body2">
            {circle.createdAt ? new Date(circle.createdAt.seconds * 1000).toLocaleDateString('zh-CN') : '未知'}
          </Typography>
        </Paper>
      )}
      
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>确认退出圈子</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要退出"{circle.name}"圈子吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>取消</Button>
          <Button onClick={handleLeaveCircle} color="error">
            确认退出
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 