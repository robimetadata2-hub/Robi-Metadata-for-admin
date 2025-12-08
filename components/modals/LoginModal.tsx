import React from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSignIn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="profile-card w-[330px] bg-white rounded-xl shadow-xl overflow-hidden text-center" onClick={e => e.stopPropagation()}>
        <div className="profile-header bg-[color:var(--theme-color)] h-24 relative">
            <img src="/assets/images/profile.png" alt="Profile" className="w-24 h-24 rounded-full absolute -bottom-12 left-1/2 -translate-x-1/2 border-4 border-white object-cover" />
        </div>
        <div className="profile-body pt-14 pb-6 px-5">
            <h4 className="text-xl font-bold text-gray-800">MD. RABIUL ISLAM</h4>
            <p className="text-sm text-gray-500 mb-5">Professional Digital Marketer</p>
            
            <div className="grid grid-cols-3 gap-y-5 mb-6">
                 <a href="https://www.youtube.com/@robitechnology" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-youtube text-red-600 text-3xl mb-1"></i>Robi Tech..
                </a>
                <a href="https://www.youtube.com/@rtstock" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-youtube text-red-600 text-3xl mb-1"></i>RT Stock
                </a>
                <a href="https://www.youtube.com/@robiadsexpert" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-youtube text-red-600 text-3xl mb-1"></i>Robi Ads..
                </a>
                 <a href="https://www.facebook.com/robitechnology22" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-facebook text-blue-600 text-3xl mb-1"></i>Robi Tech..
                </a>
                <a href="https://www.facebook.com/groups/809434351197208" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-facebook text-blue-600 text-3xl mb-1"></i>FB Group
                </a>
                <a href="https://chat.whatsapp.com/BztzKMpcqHw5Hv2utCgBFN" target="_blank" rel="noopener noreferrer" className="social-box flex flex-col items-center text-xs text-gray-600 font-medium no-underline hover:opacity-80">
                    <i className="bi bi-whatsapp text-green-500 text-3xl mb-1"></i>WhatsApp
                </a>
            </div>

            <button onClick={onSignIn} className="google-btn w-full rounded-full bg-white border border-gray-300 text-gray-700 font-medium flex items-center justify-center gap-2.5 p-2.5 transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" className="w-5 h-5" />
                Sign in with Google
            </button>
        </div>
      </div>
    </div>
  );
};