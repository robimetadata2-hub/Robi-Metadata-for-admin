import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: string[];
  setApiKeys: React.Dispatch<React.SetStateAction<string[]>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  themeColor: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, apiKeys, setApiKeys, selectedModel, setSelectedModel, showToast, themeColor }) => {
  const [newApiKey, setNewApiKey] = useState('');
  const [localSelectedModel, setLocalSelectedModel] = useState(selectedModel);
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedModel(selectedModel);
      setVisibleKeys({}); // Reset visibility when modal opens
    }
  }, [isOpen, selectedModel]);
  
  if (!isOpen) return null;

  const handleSaveNewKey = () => {
    if (!newApiKey.trim()) {
        showToast('Please enter an API key.', 'warning');
        return;
    }
    if (apiKeys.includes(newApiKey.trim())) {
      showToast('API Key already exists.', 'warning');
      return;
    }
    const updatedKeys = [...apiKeys, newApiKey.trim()];
    setApiKeys(updatedKeys);
    localStorage.setItem('geminiApiKeys', JSON.stringify(updatedKeys));
    setNewApiKey('');
    showToast('API Key saved successfully.', 'success');
  };

  const handleClose = () => {
    if (localSelectedModel !== selectedModel) {
        setSelectedModel(localSelectedModel);
        localStorage.setItem('geminiModel', localSelectedModel);
        showToast('Model selection saved.', 'success');
    }
    onClose();
  };

  const handleDelete = (index: number) => {
    const updatedKeys = apiKeys.filter((_, i) => i !== index);
    setApiKeys(updatedKeys);
    localStorage.setItem('geminiApiKeys', JSON.stringify(updatedKeys));
    showToast('API Key deleted.', 'success');
  };

  const toggleKeyVisibility = (index: number) => {
    setVisibleKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const lightenDarkenColor = (col: string, amt: number) => {
    let usePound = false;
    if (col[0] === "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={handleClose}>
      <div className="w-full max-w-md bg-[#202123] rounded-xl border border-gray-700/80 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-700/80">
          <h2 className="text-lg font-semibold text-white">Manage API Keys & Model</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">Select Gemini Model</label>
            <select
              id="model-select"
              value={localSelectedModel}
              onChange={(e) => setLocalSelectedModel(e.target.value)}
              className="bg-[#2c2d2f] border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              
              <option value="gemini-robotics-er-1.5-preview">Gemini Api</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Saved API Keys</label>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
              {apiKeys.length === 0 ? (
                <div className="flex items-center justify-center p-3 bg-[#2c2d2f] rounded-md">
                  <p className="text-sm text-gray-500">No API keys saved.</p>
                </div>
              ) : (
                apiKeys.map((key, index) => (
                  <div key={index} className="flex justify-between items-center p-2 pl-4 bg-[#2c2d2f] rounded-md">
                    <span className="text-sm text-gray-300 font-mono flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap pr-2">
                      {visibleKeys[index] ? key : `••••••••••••••••••••••••••••••${key.slice(-6)}`}
                    </span>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <button onClick={() => toggleKeyVisibility(index)} className="text-gray-400 hover:text-white" title={visibleKeys[index] ? 'Hide key' : 'Show key'}>
                            <i className={`bi ${visibleKeys[index] ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </button>
                        <button onClick={() => handleDelete(index)} className="text-red-500 hover:text-red-400" title="Delete key">
                            <i className="bi bi-trash-fill"></i>
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label htmlFor="new-api-key-input" className="block text-sm font-medium text-gray-300 mb-2">Enter new API key</label>
            <div className="flex space-x-3">
              <input
                type="password"
                id="new-api-key-input"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="bg-[#2c2d2f] border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Enter new API key"
              />
              <button 
                onClick={handleSaveNewKey} 
                className="py-2.5 px-6 text-white font-medium rounded-lg shadow-md transition-colors"
                // Fix: Cast style object to React.CSSProperties to allow for custom CSS properties.
                style={{ backgroundColor: themeColor, '--hover-color': lightenDarkenColor(themeColor, -20) } as React.CSSProperties}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = e.currentTarget.style.getPropertyValue('--hover-color')}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = themeColor}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700/80">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors">
            <i className="bi bi-key-fill mr-2.5"></i>Get API Key from Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );
};