import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import PrivateRoute from './components/common/PrivateRoute';

// 布局组件
import Navbar from './components/layout/Navbar';

// 页面组件
import Home from './pages/Home';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import CreatePost from './components/posts/CreatePost';
import PostDetail from './pages/PostDetail';
import Explore from './pages/Explore';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';
import CreateCircle from './pages/CreateCircle';
import HelpSquare from './pages/HelpSquare';
import HelpDetail from './pages/HelpDetail';
import CreateHelp from './pages/CreateHelp';
import NotFound from './pages/NotFound';
import TestPage from './pages/TestPage';
import SimpleTest from './pages/SimpleTest';
import BasicTest from './pages/BasicTest';
import TailwindTest from './pages/TailwindTest';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PostProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />
                
                <Route path="/user/:id" element={<UserProfile />} />
                
                <Route 
                  path="/create-post" 
                  element={
                    <PrivateRoute>
                      <CreatePost />
                    </PrivateRoute>
                  } 
                />
                
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/explore" element={<Explore />} />
                
                <Route path="/circles" element={<Circles />} />
                <Route path="/circle/:id" element={<CircleDetail />} />
                <Route 
                  path="/create-circle" 
                  element={
                    <PrivateRoute>
                      <CreateCircle />
                    </PrivateRoute>
                  } 
                />
                
                <Route path="/help" element={<HelpSquare />} />
                <Route path="/help/:id" element={<HelpDetail />} />
                <Route 
                  path="/create-help" 
                  element={
                    <PrivateRoute>
                      <CreateHelp />
                    </PrivateRoute>
                  } 
                />
                
                <Route path="/test" element={<TestPage />} />
                <Route path="/simple" element={<SimpleTest />} />
                <Route path="/basic" element={<BasicTest />} />
                <Route path="/tailwind" element={<TailwindTest />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </PostProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 