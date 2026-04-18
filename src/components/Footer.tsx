import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 text-center">
      <a
        href="https://ko-fi.com/yairhasfari"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        ☕ אפשר להזמין אותי לקפה
      </a>
    </footer>
  );
};