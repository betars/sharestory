import React from 'react';

// 简化版的 StyleProvider，使用 Tailwind CSS
export default function CustomStylesProvider({ children }) {
  return (
    <div className="font-sans antialiased">
      {children}
    </div>
  );
} 