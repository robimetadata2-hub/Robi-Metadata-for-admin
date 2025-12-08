import React, { useRef, useEffect, useCallback } from 'react';
import { ControlSettings, Tab } from '../types';

interface ControlPanelProps {
  settings: ControlSettings;
  onSettingsChange: (settings: ControlSettings) => void;
  onSave: () => void;
  onApiKeyClick: () => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
  fileExtension: string;
  onFileExtensionChange: (ext: string) => void;
}

const CustomSlider: React.FC<{
  id: string;
  min: number;
  max: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  themeColor: string;
}> = ({ id, min, max, value, onChange, themeColor }) => {
  const fillPercentage = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      id={id}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="w-full h-2 rounded-lg cursor-pointer slider-custom"
      style={{ '--fill-percentage': `${fillPercentage}%`, '--theme-color': themeColor } as React.CSSProperties}
    />
  );
};


const CustomSwitch: React.FC<{
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    tooltip?: string;
}> = ({ id, checked, onChange, label, tooltip }) => (
    <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm text-gray-400 flex items-center cursor-pointer">
            {label}
            {tooltip && (
                 <div className="info-icon group relative ml-1.5">
                    <i className="bi bi-info-circle-fill text-gray-500"></i>
                    <span className="tooltip invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#17181a] text-white text-xs rounded-md p-2 border border-gray-600 shadow-lg z-10">
                        {tooltip}
                    </span>
                </div>
            )}
        </label>
        <div className="switch relative inline-block w-10 h-6 flex-shrink-0">
            <input type="checkbox" id={id} checked={checked} onChange={onChange} />
            <label htmlFor={id} className="slider cursor-pointer"></label>
        </div>
    </div>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    settings, onSettingsChange, onSave, onApiKeyClick, themeColor, onThemeColorChange, fileExtension, onFileExtensionChange
}) => {
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const tabIndicatorRef = useRef<HTMLDivElement>(null);
    const tabMetadataRef = useRef<HTMLButtonElement>(null);
    const tabPromptRef = useRef<HTMLButtonElement>(null);

    const updateIndicator = useCallback(() => {
        if (!tabContainerRef.current || !tabIndicatorRef.current) return;
        const activeTabRef = settings.activeTab === 'metadata' ? tabMetadataRef : tabPromptRef;
        if (!activeTabRef.current) return;

        const containerRect = tabContainerRef.current.getBoundingClientRect();
        const tabRect = activeTabRef.current.getBoundingClientRect();

        tabIndicatorRef.current.style.left = `${tabRect.left - containerRect.left}px`;
        tabIndicatorRef.current.style.width = `${tabRect.width}px`;
    }, [settings.activeTab]);

    useEffect(() => {
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);


    const handleTabChange = (tab: Tab) => {
        onSettingsChange({ ...settings, activeTab: tab });
    };

    const handleFieldChange = <K extends keyof ControlSettings>(key: K, value: ControlSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };
    
    const handleAdvanceChange = <K extends keyof ControlSettings['advanceTitle']>(key: K, value: boolean) => {
        onSettingsChange({ ...settings, advanceTitle: {...settings.advanceTitle, [key]: value} });
    };
    
    const handlePromptSwitchChange = <K extends keyof ControlSettings['promptSwitches']>(key: K, value: boolean) => {
        onSettingsChange({ ...settings, promptSwitches: {...settings.promptSwitches, [key]: value} });
    };

  return (
    <div className="panel-bg p-4 sm:p-6 lg:sticky top-[88px] bg-[#202123] border border-[#363636] rounded-xl shadow-lg lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Generation Controls</h2>
        <button onClick={onApiKeyClick} title="Manage API Keys & Model" className="flex items-center space-x-2 bg-white text-gray-800 px-3 py-1.5 rounded-lg font-medium shadow-sm hover:bg-gray-100 transition-colors text-sm">
          <i className="bi bi-key-fill"></i>
          <span>API Key</span>
        </button>
      </div>
      
      <div ref={tabContainerRef} className="relative border-b border-gray-700 mb-6">
        <div className="flex space-x-4">
          <button ref={tabMetadataRef} onClick={() => handleTabChange('metadata')} className={`tab-btn py-2 px-1 hover:text-gray-200 font-medium transition-colors ${settings.activeTab === 'metadata' ? 'text-[color:var(--theme-color)]' : 'text-gray-400'}`}>Metadata</button>
          <button ref={tabPromptRef} onClick={() => handleTabChange('prompt')} className={`tab-btn py-2 px-1 hover:text-gray-200 font-medium transition-colors ${settings.activeTab === 'prompt' ? 'text-[color:var(--theme-color)]' : 'text-gray-400'}`}>Prompt</button>
        </div>
        <div ref={tabIndicatorRef} className="absolute bottom-[-1px] h-0.5 bg-[color:var(--theme-color)] transition-all duration-300 ease-in-out"></div>
      </div>

      {/* Metadata Controls */}
      <div className={`${settings.activeTab === 'metadata' ? 'block' : 'hidden'} space-y-6`}>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="batch-size" className="text-sm font-medium text-gray-300">Processing Batch Size</label>
                <span className="text-sm font-semibold text-white">{settings.batchSize || 3} Files</span>
            </div>
            <CustomSlider id="batch-size" min={1} max={10} value={settings.batchSize || 3} onChange={(e) => handleFieldChange('batchSize', parseInt(e.target.value))} themeColor={themeColor} />
            <p className="text-xs text-gray-500 mt-1">Number of images to process simultaneously.</p>
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="title-length" className="text-sm font-medium text-gray-300">Title Length</label>
                <span className="text-sm font-semibold text-white">{settings.titleLength} Chars</span>
            </div>
            <CustomSlider id="title-length" min={20} max={200} value={settings.titleLength} onChange={(e) => handleFieldChange('titleLength', parseInt(e.target.value))} themeColor={themeColor} />
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="desc-length" className="text-sm font-medium text-gray-300">Description Character Length</label>
                <span className="text-sm font-semibold text-white">{settings.descLength} Chars</span>
            </div>
            <CustomSlider id="desc-length" min={50} max={500} value={settings.descLength} onChange={(e) => handleFieldChange('descLength', parseInt(e.target.value))} themeColor={themeColor} />
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="keywords-count" className="text-sm font-medium text-gray-300">Keywords Count</label>
                <span className="text-sm font-semibold text-white">{settings.keywordsCount} Keywords</span>
            </div>
            <CustomSlider id="keywords-count" min={5} max={50} value={settings.keywordsCount} onChange={(e) => handleFieldChange('keywordsCount', parseInt(e.target.value))} themeColor={themeColor} />
        </div>
        <div className="space-y-4">
            <button onClick={() => handleFieldChange('isAdvanceContentHidden', !settings.isAdvanceContentHidden)} className="flex justify-between items-center w-full text-left">
                <span className="text-sm font-medium text-gray-300">Advance Title</span>
                <span className="text-sm font-medium text-[color:var(--theme-color)] hover:text-[color:var(--theme-color-hover)]">{settings.isAdvanceContentHidden ? 'Expand' : 'Collapse'}</span>
            </button>
            {!settings.isAdvanceContentHidden && (
                <div className="space-y-4 pl-2">
                    <CustomSwitch id="toggle-transparent-bg" label="isolated on transparent background" checked={settings.advanceTitle.transparentBg} onChange={e => handleAdvanceChange('transparentBg', e.target.checked)} />
                    <CustomSwitch id="toggle-white-bg" label="isolated on white background" checked={settings.advanceTitle.whiteBg} onChange={e => handleAdvanceChange('whiteBg', e.target.checked)} />
                    <CustomSwitch id="toggle-vector" label="Vector" checked={settings.advanceTitle.vector} onChange={e => handleAdvanceChange('vector', e.target.checked)} />
                    <CustomSwitch id="toggle-illustration" label="illustration" checked={settings.advanceTitle.illustration} onChange={e => handleAdvanceChange('illustration', e.target.checked)} />
                </div>
            )}
        </div>
        <div className="space-y-4">
            <label htmlFor="custom-prompt-select" className="block text-sm font-medium text-gray-300 mb-2">Custom Prompt</label>
            <select id="custom-prompt-select" value={settings.customPromptSelect} onChange={(e) => handleFieldChange('customPromptSelect', e.target.value as 'default' | 'set_custom')} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-[color:var(--theme-color)] focus:border-[color:var(--theme-color)] block w-full p-2.5">
                <option value="default">Default (Recommended)</option>
                <option value="set_custom">Set Custom Prompt</option>
            </select>
            {settings.customPromptSelect === 'set_custom' && (
                <textarea value={settings.customPromptEntry} onChange={(e) => handleFieldChange('customPromptEntry', e.target.value)} rows={4} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-[color:var(--theme-color)] focus:border-[color:var(--theme-color)] block w-full p-2.5" placeholder="Enter your custom prompt here..."></textarea>
            )}
        </div>
        <div className="space-y-2">
            <label htmlFor="file-extension-select" className="block text-sm font-medium text-gray-300">Change File extension</label>
            <select id="file-extension-select" value={fileExtension} onChange={e => onFileExtensionChange(e.target.value)} className="bg-[#4a4a4a] border border-[#6b6b6b] text-[#d1d1d1] text-sm rounded-md p-2 w-full appearance-none bg-no-repeat bg-right-2" style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a0a0a0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")"}}>
                <option value="default">Default</option>
                <option value="jpg">jpg</option><option value="jpeg">jpeg</option><option value="png">png</option><option value="svg">svg</option><option value="eps">eps</option><option value="ai">ai</option><option value="mp4">mp4</option>
            </select>
        </div>
        <div className="flex items-center justify-between">
            <label htmlFor="theme-color-picker" className="text-sm font-medium text-gray-300">Theme Color :</label>
            <div>
                <input type="color" value={themeColor} onChange={(e) => onThemeColorChange(e.target.value)} className="absolute opacity-0 w-0 h-0 p-0 border-none" id="theme-color-picker" />
                <label htmlFor="theme-color-picker" style={{ backgroundColor: themeColor }} className="inline-block w-8 h-8 rounded-full cursor-pointer align-middle" title="Change theme color"></label>
            </div>
        </div>
      </div>

      {/* Prompt Controls */}
      <div className={`${settings.activeTab === 'prompt' ? 'block' : 'hidden'} space-y-6`}>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="desc-words-slider" className="text-sm font-medium text-gray-300 flex items-center">
                    Max Description Words
                </label>
                <span className="text-sm font-semibold text-white bg-gray-700 px-2 py-0.5 rounded-md">{settings.descWords}</span>
            </div>
            <CustomSlider id="desc-words-slider" min={10} max={100} value={settings.descWords} onChange={(e) => handleFieldChange('descWords', parseInt(e.target.value))} themeColor={themeColor} />
        </div>
        <div className="space-y-4 pt-4 border-t border-gray-700">
            <CustomSwitch id="toggle-silhouette" label="SILHOUETTE" checked={settings.promptSwitches.silhouette} onChange={e => handlePromptSwitchChange('silhouette', e.target.checked)} tooltip="Use this for silhouette-style images to improve their discoverability in marketplaces."/>
            <CustomSwitch id="toggle-white-bg-prompt" label="White Background" checked={settings.promptSwitches.whiteBg} onChange={e => handlePromptSwitchChange('whiteBg', e.target.checked)} tooltip="Optimize metadata for isolated objects on white background to improve their discoverability in search results."/>
            <CustomSwitch id="toggle-transparent-bg-prompt" label="Transparent Background" checked={settings.promptSwitches.transparentBg} onChange={e => handlePromptSwitchChange('transparentBg', e.target.checked)} tooltip="Optimize metadata for isolated objects on transparent background to improve their discoverability in search results."/>
            <CustomSwitch id="toggle-custom-prompt-prompt" label="CUSTOM PROMPT" checked={settings.promptSwitches.customPrompt} onChange={e => handlePromptSwitchChange('customPrompt', e.target.checked)} tooltip="Create your own custom prompt for AI-generated metadata. This will override the default prompts while still ensuring proper formatting and keyword count."/>
        </div>
        {settings.promptSwitches.customPrompt && (
            <div className="space-y-2">
                <label htmlFor="custom-prompt-entry-prompt" className="block text-sm font-medium text-gray-300">Custom Prompt Text</label>
                <textarea id="custom-prompt-entry-prompt" value={settings.customPromptEntryPrompt} onChange={(e) => handleFieldChange('customPromptEntryPrompt', e.target.value)} rows={4} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-[color:var(--theme-color)] focus:border-[color:var(--theme-color)] block w-full p-2.5" placeholder="Enter your custom prompt here..."></textarea>
            </div>
        )}
      </div>

      <div className="mt-6">
        <button onClick={onSave} className="w-full py-2.5 px-5 bg-[color:var(--theme-color)] hover:bg-[color:var(--theme-color-hover)] text-white font-medium rounded-lg shadow-md transition-colors text-sm">Save All Settings</button>
      </div>
    </div>
  );
};