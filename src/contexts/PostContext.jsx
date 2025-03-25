import React, { createContext, useContext, useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from './AuthContext';

const PostContext = createContext();

export function usePosts() {
  return useContext(PostContext);
}

export function PostProvider({ children }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // 创建新帖子
  async function createPost(content, images = [], tags = [], visibility = 'public', expiresAt = null, isAnonymous = false) {
    if (!currentUser) throw new Error('用户未登录');
    
    try {
      setLoading(true);
      
      // 上传图片（如果有）
      const imageUrls = [];
      for (const image of images) {
        const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}-${image.name}`);
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
      
      // 创建帖子文档
      const postData = {
        content,
        imageUrls,
        tags,
        visibility,
        expiresAt,
        isAnonymous,
        authorId: currentUser.uid,
        authorName: isAnonymous ? '匿名用户' : currentUser.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0
      };
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // 增加用户积分
      await updateUserPoints(currentUser.uid, 5, 'post');
      
      return { id: docRef.id, ...postData };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 获取帖子列表 - 修改为支持未登录用户
  async function getPosts(filter = {}) {
    try {
      setLoading(true);
      
      // 创建基本查询
      let postsQuery = collection(db, 'posts');
      
      // 只获取公开帖子，或者当前用户的帖子
      if (currentUser) {
        // 已登录用户可以看到公开帖子和自己的帖子
        postsQuery = query(
          postsQuery, 
          where('visibility', 'in', ['public', 'followers'])
        );
      } else {
        // 未登录用户只能看到公开帖子
        postsQuery = query(
          postsQuery, 
          where('visibility', '==', 'public')
        );
      }
      
      // 应用其他过滤条件
      if (filter.tags && filter.tags.length > 0) {
        postsQuery = query(postsQuery, where('tags', 'array-contains-any', filter.tags));
      }
      
      if (filter.authorId) {
        postsQuery = query(postsQuery, where('authorId', '==', filter.authorId));
      }
      
      // 获取帖子
      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 在客户端进行排序
      if (filter.orderBy === 'createdAt' || !filter.orderBy) {
        posts.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return (filter.order === 'asc') ? dateA - dateB : dateB - dateA;
        });
      }
      
      return posts;
    } catch (error) {
      console.error('获取帖子失败', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 获取单个帖子
  async function getPost(postId) {
    if (!postId) {
      console.error("getPost: 没有提供帖子ID");
      return null;
    }

    console.log("PostContext.getPost: 开始获取帖子", postId);
    
    try {
      const postRef = doc(db, 'posts', postId);
      console.log("PostContext.getPost: 获取帖子引用", postRef);
      
      const postDoc = await getDoc(postRef);
      console.log("PostContext.getPost: 获取到帖子文档", postDoc);
      
      if (!postDoc.exists()) {
        console.error("PostContext.getPost: 帖子不存在", postId);
        return null;
      }
      
      const postData = {
        id: postDoc.id,
        ...postDoc.data()
      };
      
      console.log("PostContext.getPost: 返回帖子数据", postData);
      return postData;
    } catch (error) {
      console.error("PostContext.getPost: 获取帖子失败", error);
      throw error;
    }
  }

  // 更新帖子
  async function updatePost(postId, updates) {
    if (!currentUser) throw new Error('用户未登录');
    
    try {
      setLoading(true);
      
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('帖子不存在');
      }
      
      const postData = postDoc.data();
      
      if (postData.authorId !== currentUser.uid) {
        throw new Error('无权更新此帖子');
      }
      
      await updateDoc(postRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return {
        id: postId,
        ...postData,
        ...updates,
        updatedAt: new Date()
      };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 删除帖子
  async function deletePost(postId) {
    if (!currentUser) throw new Error('用户未登录');
    
    try {
      setLoading(true);
      
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('帖子不存在');
      }
      
      const postData = postDoc.data();
      
      if (postData.authorId !== currentUser.uid) {
        throw new Error('无权删除此帖子');
      }
      
      await deleteDoc(postRef);
      
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 点赞帖子 - 修改为需要登录
  async function likePost(postId) {
    if (!currentUser) {
      throw new Error('请先登录再点赞');
    }
    
    try {
      setLoading(true);
      
      // 检查用户是否已经点赞
      const likeRef = doc(db, 'likes', `${currentUser.uid}_${postId}`);
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists()) {
        // 用户已点赞，取消点赞
        await deleteDoc(likeRef);
        
        // 更新帖子点赞数
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          likes: increment(-1)
        });
        
        return { liked: false };
      } else {
        // 用户未点赞，添加点赞
        await setDoc(likeRef, {
          userId: currentUser.uid,
          postId,
          createdAt: serverTimestamp()
        });
        
        // 更新帖子点赞数
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          likes: increment(1)
        });
        
        // 增加用户积分
        await updateUserPoints(currentUser.uid, 1, 'like');
        
        return { liked: true };
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 检查用户是否已点赞 - 修改为处理未登录状态
  async function checkLiked(postId) {
    if (!currentUser) return { liked: false };
    
    try {
      const likeRef = doc(db, 'likes', `${currentUser.uid}_${postId}`);
      const likeDoc = await getDoc(likeRef);
      
      return { liked: likeDoc.exists() };
    } catch (error) {
      console.error('检查点赞状态失败', error);
      return { liked: false };
    }
  }

  // 添加评论
  async function addComment(postId, content) {
    if (!currentUser) throw new Error('请先登录再评论');
    
    try {
      setLoading(true);
      
      // 创建评论文档
      const commentData = {
        postId,
        content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '用户',
        authorAvatar: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        likes: 0
      };
      
      const commentRef = await addDoc(collection(db, 'comments'), commentData);
      
      // 更新帖子评论数
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      // 增加用户积分
      await updateUserPoints(currentUser.uid, 1, 'comment');
      
      return { 
        id: commentRef.id, 
        ...commentData,
        createdAt: new Date()
      };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 获取帖子评论
  async function getComments(postId) {
    try {
      setLoading(true);
      
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(commentsQuery);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return comments;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 获取用户的评论
  async function getUserComments(userId) {
    if (!userId) throw new Error('未提供用户ID');
    
    try {
      setLoading(true);
      
      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(commentsQuery);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return comments;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 收藏帖子
  async function favoritePost(postId) {
    if (!currentUser) throw new Error('请先登录再收藏');
    
    try {
      setLoading(true);
      
      // 检查用户是否已经收藏
      const favoriteRef = doc(db, 'favorites', `${currentUser.uid}_${postId}`);
      const favoriteDoc = await getDoc(favoriteRef);
      
      if (favoriteDoc.exists()) {
        // 用户已收藏，取消收藏
        await deleteDoc(favoriteRef);
        return { favorited: false };
      } else {
        // 用户未收藏，添加收藏
        await setDoc(favoriteRef, {
          userId: currentUser.uid,
          postId,
          createdAt: serverTimestamp()
        });
        
        // 增加用户积分
        await updateUserPoints(currentUser.uid, 2, 'favorite');
        
        return { favorited: true };
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 检查用户是否已收藏
  async function checkFavorited(postId) {
    if (!currentUser) return { favorited: false };
    
    try {
      const favoriteRef = doc(db, 'favorites', `${currentUser.uid}_${postId}`);
      const favoriteDoc = await getDoc(favoriteRef);
      
      return { favorited: favoriteDoc.exists() };
    } catch (error) {
      console.error('检查收藏状态失败', error);
      return { favorited: false };
    }
  }

  // 获取用户的收藏
  async function getUserFavorites(userId) {
    if (!userId) throw new Error('未提供用户ID');
    
    try {
      setLoading(true);
      
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      const favorites = [];
      const postIds = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favorites.push({
          id: doc.id,
          ...data
        });
        postIds.push(data.postId);
      });
      
      // 如果没有收藏，直接返回空数组
      if (postIds.length === 0) {
        return [];
      }
      
      // 获取收藏的帖子详情
      const posts = [];
      
      // 由于Firestore不支持where('id', 'in', postIds)，我们需要单独获取每个帖子
      for (const postId of postIds) {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          posts.push({
            id: postDoc.id,
            ...postDoc.data(),
            favorited: true
          });
        }
      }
      
      return posts;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 更新用户积分
  async function updateUserPoints(userId, points, action) {
    if (!userId) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPoints = userData.points || 0;
        
        await updateDoc(userRef, {
          points: currentPoints + points,
          [`pointsHistory.${action}`]: increment(1),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, points: currentPoints + points };
      }
    } catch (error) {
      console.error('更新积分失败', error);
    }
  }

  // 获取用户积分
  async function getUserPoints(userId) {
    if (!userId) return { points: 0 };
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { 
          points: userData.points || 0,
          history: userData.pointsHistory || {}
        };
      }
      
      return { points: 0, history: {} };
    } catch (error) {
      console.error('获取积分失败', error);
      return { points: 0, history: {} };
    }
  }

  const value = {
    loading,
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    likePost,
    checkLiked,
    addComment,
    getComments,
    getUserComments,
    favoritePost,
    checkFavorited,
    getUserFavorites,
    updateUserPoints,
    getUserPoints
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
} 