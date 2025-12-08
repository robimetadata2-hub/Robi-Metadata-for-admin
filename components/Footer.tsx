
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1f2022] border-t border-gray-700/50 mt-12">
      <div className="container mx-auto px-4 lg:px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <p>&copy; 2025 Robi Technology. All rights reserved. Robi Technology Privacy Policy</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Facebook</a>
          <a href="#" className="hover:text-white transition-colors">YouTube</a>
        </div>
      </div>
    </footer>
  );
};
