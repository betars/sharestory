import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 创建一个外部函数来检查 postId 是否有效
function isValidPostId(postId) {
  return postId && typeof postId === 'string' && postId.trim() !== '';
}

// 使用 React.memo 包装组件以避免不必要的重新渲染
const CommentForm = React.memo(function CommentForm({ postId, parentId = null, onCommentAdded }) {
  // 添加安全检查
  if (!isValidPostId(postId)) {
    console.error('CommentForm 组件未接收到有效的 postId:', postId);
    return null;
  }
  
  const { currentUser } = useAuth();
  
  // 确保 currentUser 存在
  if (!currentUser) {
    console.error('CommentForm 组件未接收到有效的 currentUser');
    return null;
  }
  
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const postIdRef = useRef(postId);
  const mountedRef = useRef(true);
  
  // 在组件挂载和卸载时设置 mountedRef
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 如果 postId 变化，重置表单状态
  useEffect(() => {
    if (postIdRef.current !== postId) {
      setContent('');
      setIsAnonymous(false);
      setError('');
      setSuccess(false);
      postIdRef.current = postId;
    }
  }, [postId]);

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
  }, []);

  const handleAnonymousChange = useCallback((e) => {
    setIsAnonymous(e.target.checked);
  }, []);

  const handleErrorClose = useCallback(() => {
    setError('');
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // 创建评论文档
      const commentData = {
        content,
        postId,
        parentId,
        authorId: currentUser.uid,
        authorName: isAnonymous ? '匿名用户' : currentUser.displayName || '用户',
        authorAvatar: currentUser.photoURL || '',
        isAnonymous,
        createdAt: serverTimestamp(),
        likes: 0
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // 更新帖子的评论计数
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      // 只有在组件仍然挂载时才更新状态
      if (mountedRef.current) {
        setContent('');
        setSuccess(true);
        
        if (onCommentAdded) {
          onCommentAdded({
            id: docRef.id,
            ...commentData,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('发表评论失败', error);
      if (mountedRef.current) {
        setError('发表评论失败: ' + (error.message || '未知错误'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [content, postId, parentId, currentUser, isAnonymous, onCommentAdded]);

  // 使用 useMemo 缓存表单内容
  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit}>
      <div className="flex mb-4 items-start">
        <div className="mr-4 w-12 h-12 rounded-full border-2 border-gray-100 overflow-hidden transition-transform duration-200 hover:scale-110">
          {currentUser.photoURL ? (
            <img 
              alt={currentUser.displayName || '用户'} 
              src={currentUser.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '用'}
            </div>
          )}
        </div>
        <textarea
          placeholder="写下你的评论..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          value={content}
          onChange={handleContentChange}
          disabled={loading}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center group relative">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isAnonymous}
                onChange={handleAnonymousChange}
                disabled={loading}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${isAnonymous ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isAnonymous ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 flex items-center text-sm">
              {isAnonymous ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-gray-700">{isAnonymous ? "匿名评论" : "公开评论"}</span>
            </div>
          </label>
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none">
            {isAnonymous ? "匿名发表评论" : "以真实身份发表评论"}
            <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
          </div>
        </div>
        
        <button
          type="submit"
          className={`px-4 py-2 rounded-full bg-blue-600 text-white font-medium flex items-center transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading || !content.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
          <span className="ml-1">发表评论</span>
        </button>
      </div>
    </form>
  ), [content, handleContentChange, handleAnonymousChange, handleSubmit, isAnonymous, loading, currentUser]);

  return (
    <div className="p-6 mb-6 bg-white rounded-lg shadow-md transition-all duration-200 hover:shadow-lg">
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex justify-between">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={handleErrorClose}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex justify-between">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-green-700">评论发表成功</p>
            </div>
            <button 
              onClick={handleSuccessClose}
              className="text-green-500 hover:text-green-700"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {formContent}
    </div>
  );
});

export default CommentForm; 