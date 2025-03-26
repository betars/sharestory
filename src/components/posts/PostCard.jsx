import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';

export default React.memo(function PostCard({ post, onDelete }) {
  // 添加安全检查
  if (!post || typeof post !== 'object') {
    console.error('PostCard 接收到无效的 post 对象:', post);
    return (
      <div className="mb-6 max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
        <p className="text-red-600">无效的帖子数据</p>
      </div>
    );
  }

  try {
    const { currentUser } = useAuth();
    const { likePost, checkLiked, deletePost, favoritePost, checkFavorited } = usePosts();
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [bookmarked, setBookmarked] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const isAuthor = currentUser && post.authorId === currentUser.uid;
    const navigate = useNavigate();
    const location = useLocation();
    const isMounted = useRef(true);
    const menuRef = useRef(null);
    const [likeLoading, setLikeLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // 使用 useEffect 的清理函数防止组件卸载后设置状态
    useEffect(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);
    
    useEffect(() => {
      const fetchLikeStatus = async () => {
        if (currentUser && isMounted.current) {
          try {
            const { liked } = await checkLiked(post.id);
            if (isMounted.current) {
              setLiked(liked);
            }
          } catch (error) {
            console.error('获取点赞状态失败', error);
          }
        }
      };
      
      fetchLikeStatus();
    }, [currentUser, post.id, checkLiked]);
    
    // 点击外部关闭菜单
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    const handleLike = useCallback(async () => {
      if (!currentUser) {
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      try {
        setLikeLoading(true);
        const { liked: newLikedStatus } = await likePost(post.id);
        if (isMounted.current) {
          setLiked(newLikedStatus);
          setLikeCount(prev => newLikedStatus ? prev + 1 : prev - 1);
        }
      } catch (error) {
        console.error('点赞失败', error);
      } finally {
        setLikeLoading(false);
      }
    }, [currentUser, post.id, likePost, navigate, location.pathname]);
    
    const handleMenuToggle = useCallback(() => {
      setMenuOpen(!menuOpen);
    }, [menuOpen]);
    
    const handleDeleteClick = useCallback(() => {
      setMenuOpen(false);
      setDeleteDialogOpen(true);
    }, []);
    
    const handleDeleteConfirm = useCallback(async () => {
      try {
        await deletePost(post.id);
        setDeleteDialogOpen(false);
        if (onDelete) onDelete(post.id);
      } catch (error) {
        console.error('删除帖子失败', error);
      }
    }, [post.id, deletePost, onDelete]);
    
    const handleImageClick = useCallback((url) => {
      setSelectedImage(url);
      setImageDialogOpen(true);
    }, []);

    const handleBookmark = useCallback(() => {
      setBookmarked(!bookmarked);
      // 这里可以添加收藏功能的实现
    }, [bookmarked]);
    
    // 格式化日期
    const formatDate = useCallback((timestamp) => {
      if (!timestamp) return '';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }, []);

    // 计算时间差
    const getTimeAgo = useCallback((timestamp) => {
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
    }, [formatDate]);
    
    // 检查点赞和收藏状态
    useEffect(() => {
      async function checkStatus() {
        if (post && currentUser) {
          try {
            const [likedStatus, favoritedStatus] = await Promise.all([
              checkLiked(post.id),
              checkFavorited(post.id)
            ]);
            
            setLiked(likedStatus.liked);
            setFavorited(favoritedStatus.favorited);
          } catch (error) {
            console.error('检查状态失败', error);
          }
        }
      }
      
      checkStatus();
    }, [post, currentUser, checkLiked, checkFavorited]);
    
    // 处理收藏
    const handleFavorite = async (e) => {
      e.stopPropagation();
      
      if (!currentUser) {
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      try {
        setFavoriteLoading(true);
        const result = await favoritePost(post.id);
        setFavorited(result.favorited);
        
        // 使用原生 alert 替代 toast
        if (result.favorited) {
          alert('收藏成功');
        } else {
          alert('已取消收藏');
        }
      } catch (error) {
        console.error('收藏失败', error);
        alert('收藏失败: ' + (error.message || '请重试'));
      } finally {
        setFavoriteLoading(false);
      }
    };
    
    return (
      <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
        {/* 帖子头部 */}
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center">
            <div 
              className={`w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100 ${!post.isAnonymous ? 'cursor-pointer transition-transform hover:scale-110 hover:shadow-md' : ''}`}
              onClick={() => !post.isAnonymous && navigate(`/user/${post.authorId}`)}
            >
              {post.authorAvatar ? (
                <img 
                  src={post.authorAvatar} 
                  alt={post.authorName || '用户'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
                  {post.authorName ? post.authorName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="ml-3">
              <div 
                className={`font-semibold text-gray-800 flex items-center ${!post.isAnonymous ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={() => !post.isAnonymous && navigate(`/user/${post.authorId}`)}
              >
                {post.isAnonymous ? '匿名用户' : post.authorName}
                {post.visibility === 'private' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">私密</span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {getTimeAgo(post.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleFavorite}
              className={`p-2 rounded-full hover:bg-gray-100 ${favorited ? 'text-blue-500' : 'text-gray-500'}`}
              aria-label="收藏"
            >
              {favorited ? (
                <BookmarkIcon />
              ) : (
                <BookmarkBorderIcon />
              )}
            </button>
            
            {isAuthor && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={handleMenuToggle}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  aria-label="更多选项"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <Link 
                      to={`/edit-post/${post.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      编辑
                    </Link>
                    <button 
                      onClick={handleDeleteClick}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 帖子内容 */}
        <div className="p-4">
          <div className="text-gray-800 whitespace-pre-line mb-4">
            {post.content}
          </div>
          
          {/* 帖子图片 */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className={`grid gap-2 mb-4 ${post.imageUrls.length === 1 ? '' : 'grid-cols-2'}`}>
              {post.imageUrls.map((url, index) => (
                <div 
                  key={index} 
                  className="relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer aspect-video"
                  onClick={() => handleImageClick(url)}
                >
                  {/* 预加载占位符，确保布局稳定 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin ${loadedImages[url] ? 'opacity-0' : 'opacity-100'}`}></div>
                  </div>
                  <img 
                    src={url} 
                    alt={`帖子图片 ${index + 1}`} 
                    className="w-full h-full object-cover"
                    style={{ opacity: loadedImages[url] ? 1 : 0 }}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [url]: true }))}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* 帖子标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <Link 
                  key={index} 
                  to={`/explore?tag=${tag}`}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* 帖子操作 */}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between">
          <div className="flex space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              {liked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              <span>{likeCount}</span>
            </button>
            
            <Link 
              to={`/post/${post.id}`}
              className="flex items-center text-gray-500 hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comments || 0}</span>
            </Link>
            
            <button 
              className="flex items-center text-gray-500 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                alert('链接已复制到剪贴板');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>分享</span>
            </button>
          </div>
          
          <div className="flex items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{post.views || 0}</span>
          </div>
        </div>
        
        {/* 删除确认对话框 */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-700 mb-6">确定要删除这条帖子吗？此操作无法撤销。</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 图片查看对话框 */}
        {imageDialogOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setImageDialogOpen(false)}
          >
            <button 
              className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-gray-800"
              onClick={() => setImageDialogOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="帖子图片" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('PostCard 渲染错误:', error);
    return (
      <div className="mb-6 max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
        <p className="text-red-600">帖子渲染失败</p>
      </div>
    );
  }
}); 