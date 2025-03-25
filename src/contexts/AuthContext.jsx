import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  async function signup(email, password, nickname) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 更新用户资料
      await updateProfile(userCredential.user, {
        displayName: nickname
      });
      
      // 在Firestore中创建用户文档
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        nickname,
        createdAt: new Date(),
        isAnonymous: false
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function createAnonymousProfile(nickname) {
    if (!currentUser) return;
    
    try {
      await updateProfile(currentUser, {
        displayName: nickname
      });
      
      await setDoc(doc(db, "anonymousProfiles", currentUser.uid), {
        nickname,
        createdAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 获取用户的额外信息
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser({
              ...user,
              ...userDoc.data()
            });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("获取用户信息失败", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    createAnonymousProfile
  }), [currentUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {authReady ? children : <LoadingSpinner />}
    </AuthContext.Provider>
  );
} 