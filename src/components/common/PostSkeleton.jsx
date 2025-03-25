import React from 'react';
import { 
  Paper, 
  Box, 
  Skeleton, 
  Divider, 
  Grid 
} from '@mui/material';

export default function PostSkeleton() {
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      {/* 作者信息骨架 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={50} height={50} />
        <Box sx={{ ml: 2, width: '60%' }}>
          <Skeleton variant="text" width="40%" height={30} />
          <Skeleton variant="text" width="30%" height={20} />
        </Box>
      </Box>
      
      {/* 内容骨架 */}
      <Skeleton variant="text" height={30} />
      <Skeleton variant="text" height={30} />
      <Skeleton variant="text" height={30} />
      <Skeleton variant="text" width="80%" height={30} />
      
      {/* 图片骨架 */}
      <Grid container spacing={1} sx={{ my: 3 }}>
        {[1, 2].map((_, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
        ))}
      </Grid>
      
      {/* 标签骨架 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
      </Box>
      
      {/* 操作栏骨架 */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="circular" width={36} height={36} />
        </Box>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    </Paper>
  );
} 