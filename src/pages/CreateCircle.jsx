import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export default function CreateCircle() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleAddTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim()) && tags.length < 5) {
      setTags([...tags, inputTag.trim()]);
      setInputTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('圈子名称不能为空');
      return;
    }
    
    if (!description.trim()) {
      setError('圈子描述不能为空');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      let coverImageUrl = '';
      
      // 上传封面图片
      if (coverImage) {
        const storageRef = ref(storage, `circles/${Date.now()}_${coverImage.name}`);
        await uploadBytes(storageRef, coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }
      
      // 创建圈子
      const circleData = {
        name,
        description,
        rules,
        tags,
        isPrivate,
        coverImage: coverImageUrl,
        creatorId: currentUser.uid,
        createdAt: serverTimestamp(),
        members: 1 // 创建者自动成为成员
      };
      
      const docRef = await addDoc(collection(db, 'circles'), circleData);
      
      // 将创建者添加为圈子成员
      await addDoc(collection(db, 'circleMembers'), {
        circleId: docRef.id,
        userId: currentUser.uid,
        role: 'admin', // 创建者是管理员
        joinedAt: serverTimestamp(),
        status: 'active'
      });
      
      navigate(`/circle/${docRef.id}`);
    } catch (error) {
      console.error('创建圈子失败', error);
      setError('创建圈子失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          创建新圈子
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: '100%',
                height: 200,
                bgcolor: 'grey.200',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 1,
                mb: 1
              }}
            >
              {!coverPreview && (
                <IconButton 
                  color="primary" 
                  aria-label="上传封面图片" 
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleCoverChange}
                  />
                  <PhotoCameraIcon fontSize="large" />
                </IconButton>
              )}
            </Box>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCameraIcon />}
            >
              {coverPreview ? '更换封面图片' : '上传封面图片'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleCoverChange}
              />
            </Button>
          </Box>
          
          <TextField
            label="圈子名称"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            label="圈子描述"
            multiline
            rows={3}
            variant="outlined"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            label="圈子规则"
            multiline
            rows={3}
            variant="outlined"
            fullWidth
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            helperText="可选，设置圈子规则帮助成员了解圈子文化"
            sx={{ mb: 3 }}
          />
          
          <TextField
            label="添加标签"
            variant="outlined"
            fullWidth
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            helperText="最多添加5个标签，按回车添加"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleAddTag}
                    disabled={!inputTag.trim() || tags.length >= 5}
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
          </Box>
          
          <FormControlLabel
            control={
              <Switch 
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
            }
            label="设为私密圈子（仅邀请可加入）"
            sx={{ mb: 3, display: 'block' }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/circles')}
            >
              取消
            </Button>
            
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '创建圈子'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 