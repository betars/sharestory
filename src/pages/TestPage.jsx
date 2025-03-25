import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * 测试页面，用于验证 Material UI 组件是否正常工作
 */
const TestPage = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postId, setPostId] = useState('M9WAHcKIoTn5folN5mZN');
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    async function testFirebase() {
      try {
        setLoading(true);
        setError('');
        
        // 测试连接
        console.log("测试 Firestore 连接...");
        const querySnapshot = await getDocs(collection(db, 'posts'));
        const postsCount = querySnapshot.size;
        console.log(`找到 ${postsCount} 个帖子`);
        
        setTestResult(`Firestore 连接成功! 找到 ${postsCount} 个帖子`);
        
        // 尝试获取特定帖子
        if (postId) {
          console.log(`尝试获取帖子 ID: ${postId}`);
          const postRef = doc(db, 'posts', postId);
          const postDoc = await getDoc(postRef);
          
          if (postDoc.exists()) {
            const data = {
              id: postDoc.id,
              ...postDoc.data()
            };
            console.log("获取到帖子数据:", data);
            setPostData(data);
          } else {
            console.log("帖子不存在");
            setError(`帖子 ${postId} 不存在`);
          }
        }
      } catch (err) {
        console.error("Firebase 测试失败:", err);
        setError(`Firebase 测试失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    testFirebase();
  }, [postId]);

  const handlePostIdChange = (e) => {
    setPostId(e.target.value);
  };

  const handleTestPost = async () => {
    try {
      setLoading(true);
      setError('');
      setPostData(null);
      
      console.log(`尝试获取帖子 ID: ${postId}`);
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const data = {
          id: postDoc.id,
          ...postDoc.data()
        };
        console.log("获取到帖子数据:", data);
        setPostData(data);
      } else {
        console.log("帖子不存在");
        setError(`帖子 ${postId} 不存在`);
      }
    } catch (err) {
      console.error("获取帖子失败:", err);
      setError(`获取帖子失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Firebase 测试页面</h1>
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
              <p className="text-green-700">{testResult}</p>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">测试获取特定帖子</h2>
        
        <div className="flex mb-4">
          <input 
            type="text" 
            value={postId} 
            onChange={handlePostIdChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入帖子 ID"
          />
          <button 
            onClick={handleTestPost}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            测试
          </button>
        </div>
        
        {postData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">帖子数据:</h3>
            <pre className="bg-gray-100 p-3 rounded-md overflow-auto text-sm">
              {JSON.stringify(postData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage; 