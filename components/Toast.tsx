
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500); // Wait for fade-out transition
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const typeStyles = {
    success: { bg: 'bg-green-600', icon: 'bi-check-circle-fill' },
    error: { bg: 'bg-red-600', icon: 'bi-x-octagon-fill' },
    warning: { bg: 'bg-yellow-500 text-black', icon: 'bi-exclamation-triangle-fill' },
    info: { bg: 'bg-blue-600', icon: 'bi-info-circle-fill' },
  };

  const { bg, icon } = typeStyles[type];

  return (
    <div 
      className={`fixed right-5 z-[101] flex items-center min-w-[250px] max-w-sm p-4 rounded-lg shadow-lg text-white transition-all duration-500 ease-out ${bg} ${visible ? 'top-5 opacity-100' : '-top-full opacity-0'}`}
    >
      <i className={`bi ${icon} text-xl mr-3`}></i>
      <span>{message}</span>
    </div>
  );
};
