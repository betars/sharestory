import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TailwindLoadingSpinner from './components/common/TailwindLoadingSpinner'

// 延迟加载 App 组件
const App = lazy(() => import('./App.jsx'))

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

// 添加未捕获的 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason);
});

root.render(
  <React.StrictMode>
    <Suspense fallback={<TailwindLoadingSpinner />}>
      <App />
    </Suspense>
  </React.StrictMode>
)