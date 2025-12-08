import React from 'react';

interface HeaderProps {
    onTutorialClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onTutorialClick }) => {
  return (
    <header className="bg-[#1f2022] border-b border-gray-700/50 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 lg:px-6 py-4 flex justify-between items-center">
        <img src="/assets/images/logo.png" alt="Robi Technology Logo" style={{ width: 100, height: 45 }} />
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <a href="https://robitechnology.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">OUR SERVICE</a>
            <a href="https://robiaistore.com/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">BUY AI</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">CONTACT US</a>
          </div>

          <button 
            onClick={onTutorialClick}
            className="relative overflow-hidden bg-gradient-to-r from-red-700 to-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-lg transition-transform hover:scale-105 hover:shadow-red-500/30 flex items-center gap-2 group border border-red-500/50"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
            <i className="bi bi-play-circle-fill animate-pulse"></i>
            Tutorial
          </button>
        </div>
      </nav>
    </header>
  );
};