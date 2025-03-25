import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostContext';
import PostList from '../components/posts/PostList';
import CommentList from '../components/comments/CommentList';
import UserPoints from '../components/user/UserPoints';
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
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Profile() {
  const { currentUser } = useAuth();
  const { getUserPoints, getUserFavorites } = usePosts();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userPoints, setUserPoints] = useState({ points: 0, history: {} });
  const [favorites, setFavorites] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.displayName || '');
      setBio(currentUser.bio || '');
      fetchUserPoints();
    }
  }, [currentUser]);
  
  const fetchUserPoints = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingPoints(true);
      const points = await getUserPoints(currentUser.uid);
      setUserPoints(points);
    } catch (error) {
      console.error('获取积分失败', error);
    } finally {
      setLoadingPoints(false);
    }
  };
  
  const fetchUserFavorites = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingFavorites(true);
      const favorites = await getUserFavorites(currentUser.uid);
      setFavorites(favorites);
    } catch (error) {
      console.error('获取收藏失败', error);
    } finally {
      setLoadingFavorites(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // 当切换到收藏标签时，获取收藏数据
    if (newValue === 2 && favorites.length === 0) {
      fetchUserFavorites();
    }
  };
  
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      let photoURL = currentUser.photoURL;
      
      // 如果有新头像，先上传
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(storageRef, avatarFile);
        photoURL = await getDownloadURL(storageRef);
      }
      
      // 更新用户资料
      await updateProfile(auth.currentUser, {
        displayName: nickname,
        photoURL
      });
      
      // 更新Firestore中的用户文档
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        nickname,
        bio,
        photoURL,
        updatedAt: new Date()
      });
      
      setSuccess(true);
      setEditMode(false);
      
      // 释放预览URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview('');
      }
      
      setAvatarFile(null);
    } catch (error) {
      console.error('更新资料失败', error);
      setError('更新资料失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    if (nickname !== currentUser.displayName || bio !== currentUser.bio || avatarFile) {
      setConfirmDialogOpen(true);
    } else {
      resetForm();
    }
  };
  
  const resetForm = () => {
    setNickname(currentUser.displayName || '');
    setBio(currentUser.bio || '');
    setEditMode(false);
    setError('');
    setSuccess(false);
    
    // 释放预览URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview('');
    }
    
    setAvatarFile(null);
  };
  
  // 渲染积分信息
  const renderPointsInfo = () => {
    if (loadingPoints) {
      return <CircularProgress size={20} />;
    }
    
    const { points, history } = userPoints;
    const postCount = history.post || 0;
    const commentCount = history.comment || 0;
    const favoriteCount = history.favorite || 0;
    const likeCount = history.like || 0;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Tooltip title="用户积分">
          <Chip
            icon={<EmojiEventsIcon />}
            label={`${points} 积分`}
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
        </Tooltip>
        
        <Tooltip title="发帖数">
          <Chip
            size="small"
            icon={<StarIcon />}
            label={postCount}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        </Tooltip>
        
        <Tooltip title="评论数">
          <Chip
            size="small"
            icon={<CommentIcon />}
            label={commentCount}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        </Tooltip>
        
        <Tooltip title="收藏数">
          <Chip
            size="small"
            icon={<BookmarkIcon />}
            label={favoriteCount}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        </Tooltip>
        
        <Tooltip title="点赞数">
          <Chip
            size="small"
            icon={<ThumbUpIcon />}
            label={likeCount}
            variant="outlined"
          />
        </Tooltip>
      </Box>
    );
  };
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mr: { xs: 0, sm: 4 }, mb: { xs: 2, sm: 0 } }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                !loadingPoints && userPoints.points > 0 ? (
                  <Tooltip title={`${userPoints.points} 积分`}>
                    <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main' }}>
                      <EmojiEventsIcon sx={{ width: 14, height: 14 }} />
                    </Avatar>
                  </Tooltip>
                ) : null
              }
            >
              <Avatar
                alt={currentUser.displayName || '用户'}
                src={avatarPreview || currentUser.photoURL}
                sx={{ width: 120, height: 120 }}
              />
            </Badge>
            
            {editMode && (
              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  borderRadius: '50%',
                  minWidth: 'auto',
                  width: 36,
                  height: 36,
                  p: 0
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
                <PhotoCameraIcon fontSize="small" />
              </Button>
            )}
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            {editMode ? (
              <Box>
                <TextField
                  label="昵称"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                
                <TextField
                  label="个人简介"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>资料更新成功</Alert>}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancelEdit}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : '保存'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5">
                    {currentUser.displayName || '未设置昵称'}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    编辑资料
                  </Button>
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  {currentUser.email}
                </Typography>
                
                {renderPointsInfo()}
                
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {currentUser.bio || '这个人很懒，什么都没留下...'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="我的帖子" />
          <Tab label="我的评论" />
          <Tab label="我的收藏" />
          <Tab label="我的积分" />
        </Tabs>
        
        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <PostList filter={{ authorId: currentUser.uid }} />
          )}
          {tabValue === 1 && (
            <CommentList userId={currentUser.uid} showPostInfo={true} />
          )}
          {tabValue === 2 && (
            loadingFavorites ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : favorites.length > 0 ? (
              <PostList posts={favorites} initialLoading={false} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  暂无收藏
                </Typography>
              </Box>
            )
          )}
          {tabValue === 3 && (
            <UserPoints userId={currentUser.uid} />
          )}
        </Box>
      </Paper>
      
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>放弃修改？</DialogTitle>
        <DialogContent>
          <Typography>
            你有未保存的修改，确定要放弃吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>取消</Button>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              resetForm();
            }} 
            color="error"
          >
            放弃修改
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 