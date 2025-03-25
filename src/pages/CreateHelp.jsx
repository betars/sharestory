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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Slider,
  InputAdornment
} from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

export default function CreateHelp() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [points, setPoints] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }
    
    if (!content.trim()) {
      setError('内容不能为空');
      return;
    }
    
    if (!category) {
      setError('请选择分类');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const helpData = {
        title,
        content,
        category,
        points,
        isAnonymous,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '',
        authorAvatar: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        solved: false,
        answers: 0,
        acceptedAnswerId: null
      };
      
      const docRef = await addDoc(collection(db, 'helpPosts'), helpData);
      
      navigate(`/help/${docRef.id}`);
    } catch (error) {
      console.error('发布求助失败', error);
      setError('发布求助失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          发布求助
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="标题"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={category}
              label="分类"
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {HELP_CATEGORIES.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="详细描述"
            multiline
            rows={8}
            variant="outlined"
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <Typography gutterBottom>
            悬赏积分
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Slider
              value={points}
              onChange={(e, newValue) => setPoints(newValue)}
              min={0}
              max={100}
              step={5}
              valueLabelDisplay="auto"
              sx={{ mr: 2 }}
            />
            <TextField
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">积分</InputAdornment>,
              }}
              inputProps={{
                min: 0,
                max: 100,
                step: 5
              }}
              sx={{ width: 120 }}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch 
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="匿名发布"
            sx={{ mb: 3, display: 'block' }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/help')}
            >
              取消
            </Button>
            
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '发布求助'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 