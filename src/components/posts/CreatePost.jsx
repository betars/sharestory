import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);
  const { createPost, loading } = usePosts();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (selectedFiles.length + images.length > 9) {
        setError('最多只能上传9张图片');
        return;
      }
      
      setImages([...images, ...selectedFiles]);
      
      // 创建预览
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreview([...preview, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreview = [...preview];
    URL.revokeObjectURL(newPreview[index]); // 释放URL对象
    newPreview.splice(index, 1);
    setPreview(newPreview);
  };

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      setError('请输入内容或上传图片');
      return;
    }
    
    try {
      await createPost(content, images, tags, visibility, null, isAnonymous);
      navigate('/');
    } catch (error) {
      setError('发布失败: ' + error.message);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        发布新帖子
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="分享你的想法..."
          multiline
          rows={4}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
        />
        
        {/* 图片预览区域 */}
        {preview.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
            {preview.map((url, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <img 
                  src={url} 
                  alt={`预览 ${index}`} 
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                />
                <IconButton
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -8, 
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                  onClick={() => removeImage(index)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
        
        {/* 标签输入区域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <TextField
            label="添加标签"
            size="small"
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Button 
            variant="outlined" 
            onClick={handleAddTag}
            disabled={!inputTag}
          >
            添加
          </Button>
        </Box>
        
        {/* 标签显示区域 */}
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="匿名发布"
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>可见性</InputLabel>
            <Select
              value={visibility}
              label="可见性"
              onChange={(e) => setVisibility(e.target.value)}
              size="small"
            >
              <MenuItem value="public">公开</MenuItem>
              <MenuItem value="followers">仅关注者</MenuItem>
              <MenuItem value="private">仅自己</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            component="label"
            startIcon={<AddPhotoIcon />}
            variant="outlined"
          >
            添加图片
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageChange}
              disabled={images.length >= 9}
            />
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || (!content.trim() && images.length === 0)}
          >
            {loading ? <CircularProgress size={24} /> : '发布'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 