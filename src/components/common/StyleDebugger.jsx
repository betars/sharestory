import React, { useEffect, useState } from 'react';

/**
 * 样式调试组件，用于帮助诊断样式加载问题
 */
const StyleDebugger = () => {
  const [styleInfo, setStyleInfo] = useState({
    styleElements: 0,
    tailwindStyleElements: 0,
    cssRules: 0
  });
  
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // 收集样式信息
    const collectStyleInfo = () => {
      const allStyleElements = document.querySelectorAll('style');
      const tailwindStyleElements = document.querySelectorAll('style[data-tailwind]');
      
      let totalCssRules = 0;
      allStyleElements.forEach(styleEl => {
        try {
          totalCssRules += styleEl.sheet?.cssRules.length || 0;
        } catch (e) {
          console.error('无法访问样式表规则:', e);
        }
      });
      
      setStyleInfo({
        styleElements: allStyleElements.length,
        tailwindStyleElements: tailwindStyleElements.length,
        cssRules: totalCssRules
      });
    };
    
    collectStyleInfo();
    
    // 每秒更新一次
    const interval = setInterval(collectStyleInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 p-4 max-w-xs bg-white bg-opacity-90 rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">样式调试器</h3>
        <button 
          className="text-sm px-2 py-1 text-gray-600 hover:text-gray-800" 
          onClick={() => setVisible(false)}
        >
          关闭
        </button>
      </div>
      
      <p className="text-sm text-gray-700">
        样式元素总数: {styleInfo.styleElements}
      </p>
      <p className="text-sm text-gray-700">
        Tailwind 样式元素: {styleInfo.tailwindStyleElements}
      </p>
      <p className="text-sm text-gray-700">
        CSS 规则总数: {styleInfo.cssRules}
      </p>
      
      <button 
        className="w-full mt-2 px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        onClick={() => {
          // 强制重新加载样式
          const links = document.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
              link.setAttribute('href', href + '?reload=' + Date.now());
            }
          });
          
          // 重新加载页面
          window.location.reload();
        }}
      >
        重新加载样式
      </button>
    </div>
  );
};

export default StyleDebugger; 