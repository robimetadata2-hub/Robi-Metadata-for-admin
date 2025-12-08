import React from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // REPLACE 'YOUR_VIDEO_ID' WITH THE ACTUAL YOUTUBE VIDEO ID YOU WANT TO SHOW
  const VIDEO_ID = 'dQw4w9WgXcQ'; 

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-[#202123] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#2a2b2e]">
             <div className="flex items-center gap-2 text-white">
                <i className="bi bi-youtube text-red-500 text-xl"></i>
                <h3 className="font-semibold text-lg">Tutorial Video</h3>
             </div>
             <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
             >
                <i className="bi bi-x-lg"></i>
             </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          <iframe 
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
            title="Tutorial Video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};