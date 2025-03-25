import React from 'react';

export default function AppStyleProvider({ children }) {
  return (
    <div className="font-sans antialiased">
      {children}
    </div>
  );
} 