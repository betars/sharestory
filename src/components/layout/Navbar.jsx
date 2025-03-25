import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProfileMenuToggle = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      {/* 导航栏 */}
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* 菜单按钮 */}
              <button 
                onClick={toggleDrawer}
                className="p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo */}
              <Link to="/" className="ml-4 font-bold text-xl">匿名社交平台</Link>
            </div>
            
            {/* 用户菜单 */}
            <div className="flex items-center">
              {currentUser ? (
                <div className="relative">
                  <button 
                    onClick={handleProfileMenuToggle}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center">
                      {currentUser.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt={currentUser.displayName || '用户'} 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '用'}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  {/* 下拉菜单 */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        个人资料
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        登出
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login" className="px-3 py-2 rounded text-white hover:bg-blue-700">登录</Link>
                  <Link to="/signup" className="px-3 py-2 rounded bg-white text-blue-600 hover:bg-gray-100">注册</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* 侧边抽屉 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={toggleDrawer}
          ></div>
          
          {/* 侧边栏内容 */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="px-2 space-y-1">
                <Link 
                  to="/" 
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={toggleDrawer}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  首页
                </Link>
                
                <Link 
                  to="/explore" 
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={toggleDrawer}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  </svg>
                  发现
                </Link>
                
                <Link 
                  to="/circles" 
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={toggleDrawer}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  圈子
                </Link>
                
                <Link 
                  to="/help" 
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={toggleDrawer}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  求助广场
                </Link>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="px-2 space-y-1">
                  {currentUser ? (
                    <>
                      <Link 
                        to="/profile" 
                        className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={toggleDrawer}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人资料
                      </Link>
                      
                      <button 
                        onClick={() => {
                          handleLogout();
                          toggleDrawer();
                        }}
                        className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        登出
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={toggleDrawer}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        登录
                      </Link>
                      
                      <Link 
                        to="/signup" 
                        className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={toggleDrawer}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-4 h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        注册
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 