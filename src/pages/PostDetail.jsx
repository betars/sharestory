import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePosts } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import CommentList from '../components/comments/CommentList';
import CommentForm from '../components/comments/CommentForm';
// 暂时注释掉 StyleDebugger 导入
// import StyleDebugger from '../components/common/StyleDebugger';

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("组件渲染错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto my-4 px-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 mb-1">页面加载出错</h3>
                <p className="text-sm text-red-700">抱歉，页面渲染时发生错误。请尝试刷新页面或返回首页。</p>
                <div className="mt-4">
                  <button 
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => {
                      this.setState({ hasError: false });
                      window.location.reload();
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重新加载
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function PostDetail() {
  const { id } = useParams();
  const { getPost } = usePosts();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const [comments, setComments] = useState([]);
  const [commentListKey, setCommentListKey] = useState(Date.now());
  
  // 使用 useRef 存储 postId，避免因 id 变化导致的重复获取
  const postIdRef = useRef(id);
  
  const fetchPost = useCallback(async () => {
    // 如果已经获取过数据或者组件已卸载，则不再获取
    if (!postIdRef.current || fetchedRef.current || !isMountedRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // 使用本地变量存储 postId，避免闭包问题
      const currentPostId = postIdRef.current;
      const fetchedPost = await getPost(currentPostId);
      
      // 再次检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      if (!fetchedPost) {
        setError('帖子不存在或已被删除');
      } else {
        setPost(fetchedPost);
      }
      fetchedRef.current = true;
    } catch (error) {
      if (isMountedRef.current) {
        setError('获取帖子详情失败: ' + (error.message || '未知错误'));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getPost]); // 只依赖 getPost，不依赖 id
  
  useEffect(() => {
    // 组件挂载时设置 isMountedRef
    isMountedRef.current = true;
    
    // 更新 postIdRef
    postIdRef.current = id;
    
    // 重置获取状态
    if (id !== postIdRef.current) {
      fetchedRef.current = false;
    }
    
    // 获取数据
    fetchPost();
    
    // 组件卸载时清理
    return () => {
      isMountedRef.current = false;
      fetchedRef.current = false;
    };
  }, [id, fetchPost]);
  
  const renderLoading = useCallback(() => {
    return (
      <div className="my-4">
        <div className="h-16 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }, []);
  
  const renderError = useCallback(() => {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-2">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-2">
              <button 
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => {
                  fetchedRef.current = false;
                  fetchPost();
                }}
              >
                <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [error, fetchPost]);
  
  const renderEmpty = useCallback(() => {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">帖子不存在或已被删除</p>
          </div>
        </div>
      </div>
    );
  }, []);
  
  // 添加评论后的处理函数
  const handleCommentAdded = useCallback((newComment) => {
    // 更新评论计数
    if (post) {
      setPost(prevPost => ({
        ...prevPost,
        comments: (prevPost.comments || 0) + 1
      }));
    }
    
    // 强制刷新评论列表
    setCommentListKey(Date.now());
  }, [post]);
  
  const renderedCommentForm = useMemo(() => {
    if (!post || !post.id) return null;
    
    return currentUser ? (
      <CommentForm 
        key={`form-${post.id}`} 
        postId={post.id} 
        onCommentAdded={handleCommentAdded}
      />
    ) : (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              请<Link to="/login" className="mx-1 text-blue-800 font-medium hover:underline">登录</Link>后发表评论
            </p>
          </div>
        </div>
      </div>
    );
  }, [post, currentUser, handleCommentAdded]);
  
  const renderedCommentList = useMemo(() => {
    if (!post || !post.id || typeof post.id !== 'string' || post.id.trim() === '') {
      return null;
    }
    
    try {
      return <CommentList key={`comments-${post.id}-${commentListKey}`} postId={post.id} />;
    } catch (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">加载评论时出错: {error.message}</p>
        </div>
      );
    }
  }, [post, commentListKey]);
  
  const renderedCommentSection = useMemo(() => {
    if (!post || !post.id || typeof post.id !== 'string' || post.id.trim() === '') {
      return null;
    }
    
    try {
      return (
        <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-semibold">评论</h2>
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {post.comments || 0}
            </span>
          </div>
          
          <hr className="mb-4" />
          
          {renderedCommentForm}
          {renderedCommentList}
        </div>
      );
    } catch (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-2">
          <p className="text-sm text-red-700">渲染评论区时出错: {error.message}</p>
        </div>
      );
    }
  }, [post, renderedCommentForm, renderedCommentList]);
  
  const renderedPostCard = useMemo(() => {
    if (!post) return null;
    
    try {
      if (!post || typeof post !== 'object') {
        return (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-2">
            <p className="text-sm text-red-700">帖子数据格式错误</p>
          </div>
        );
      }
      
      const requiredProps = ['id', 'content', 'authorId', 'createdAt'];
      const missingProps = requiredProps.filter(prop => !post[prop]);
      
      if (missingProps.length > 0) {
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md my-2">
            <p className="text-sm text-yellow-700">帖子数据不完整，缺少: {missingProps.join(', ')}</p>
          </div>
        );
      }
      
      return <PostCard key={`post-${post.id}`} post={post} />;
    } catch (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-2">
          <p className="text-sm text-red-700">渲染帖子时出错: {error.message}</p>
        </div>
      );
    }
  }, [post]);
  
  const renderedBreadcrumbs = useMemo(() => (
    <nav className="flex py-3 px-5 mb-4 bg-gray-50 rounded-md">
      <ol className="flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <a className="inline-flex items-center text-sm text-gray-700 hover:text-blue-600" href="/" data-discover="true">
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            首页
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
            <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2 truncate max-w-[200px]">帖子详情</span>
          </div>
        </li>
      </ol>
    </nav>
  ), []);
  
  const renderedContent = useMemo(() => {
    if (loading) {
      return renderLoading();
    } else if (error) {
      return renderError();
    } else if (!post) {
      return renderEmpty();
    } else {
      return (
        <>
          {renderedPostCard}
          {renderedCommentSection}
        </>
      );
    }
  }, [loading, error, post, renderLoading, renderError, renderEmpty, renderedPostCard, renderedCommentSection]);
  
  return (
    <ErrorBoundary>
      <div className="max-w-3xl mx-auto my-4 px-4">
        {renderedBreadcrumbs}
        {renderedContent}
      </div>
    </ErrorBoundary>
  );
} 