import React, { useState } from 'react';
import { GeneratedMetadata } from '../types';

interface ResultCardProps {
    data: GeneratedMetadata;
    index: number;
    onDelete: (index: number) => void;
    onRegenerate: (index: number) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, index, onDelete, onRegenerate }) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [copiedField, setCopiedField] = useState<'title' | 'description' | 'keywords' | null>(null);
    
    const handleRegenerate = async () => {
        setIsRegenerating(true);
        await onRegenerate(index);
        setIsRegenerating(false);
    };

    const handleCopy = (text: string, field: 'title' | 'description' | 'keywords') => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
            });
        }
    };
    
    const description = data.description || 'No description';
    const keywords = data.keywords || [];
    const keywordsString = keywords.join(', ');
    const title = data.title || (data.mode === 'metadata' ? 'No title' : '');
    const category = data.category || 'N/A';
    
    const isPromptMode = data.mode === 'prompt';
    const imageUrl = data.apiData ? `data:image/jpeg;base64,${data.apiData.base64Data}` : data.thumbnailUrl;

    return (
        <div className={`result-card flex flex-col ${isPromptMode ? 'sm:h-48' : ''} sm:flex-row gap-4 rounded-lg overflow-hidden shadow-lg bg-[#2a2b2e] p-4`}>
            <div className={`result-card-image-container relative ${isPromptMode ? 'w-full sm:w-48' : 'w-full sm:w-1/3'} flex-shrink-0 ${isPromptMode ? 'aspect-square' : 'aspect-[16/10]'} rounded-md overflow-hidden bg-[#3b3b3e] group`}>
                <img src={imageUrl} alt={data.filename} className="w-full h-full object-cover" />
                <button onClick={() => onDelete(index)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-red-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:text-red-400 z-10" title="Delete">
                    <i className="bi bi-trash-fill"></i>
                </button>
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isRegenerating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isRegenerating ? <div className="spinner-sm"></div> :
                    <button onClick={handleRegenerate} className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--theme-color)] text-white font-semibold text-sm rounded-md hover:bg-[color:var(--theme-color-hover)] transition-colors">
                        <i className="bi bi-arrow-clockwise"></i>
                        <span>Regenerate</span>
                    </button>}
                </div>
            </div>
            <div className="result-card-info flex flex-col gap-3 flex-grow min-w-0">
                {!isPromptMode && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 flex justify-between items-center mb-1">
                            <span className="flex items-center gap-2">
                                Title
                                <button onClick={() => handleCopy(title, 'title')} title="Copy title" className="text-gray-500 hover:text-white transition-colors">
                                    {copiedField === 'title' ? <i className="bi bi-check-lg text-green-500"></i> : <i className="bi bi-clipboard"></i>}
                                </button>
                            </span>
                            <span className="text-xs font-normal text-gray-500">{title.length} Chars</span>
                        </h3>
                        <p className="result-card-text-content text-sm text-gray-200 line-clamp-2 bg-[#202123] p-2 rounded-md border border-gray-700" title={title}>{title}</p>
                    </div>
                )}
                <div className={`flex flex-col ${isPromptMode ? 'flex-grow min-h-0' : ''}`}>
                    <h3 className="text-sm font-semibold text-gray-400 flex justify-between items-center mb-1">
                        <span className="flex items-center gap-2">
                            Description
                             {!isPromptMode && (
                                <button onClick={() => handleCopy(description, 'description')} title="Copy description" className="text-gray-500 hover:text-white transition-colors">
                                    {copiedField === 'description' ? <i className="bi bi-check-lg text-green-500"></i> : <i className="bi bi-clipboard"></i>}
                                </button>
                            )}
                        </span>
                        <span className="text-xs font-normal text-gray-500">{description.split(/\s+/).filter(Boolean).length} Words</span>
                    </h3>
                     <div className={`relative ${isPromptMode ? 'flex-grow' : ''}`}>
                        <p className={`result-card-text-content text-sm text-gray-200 bg-[#202123] p-2 rounded-md border border-gray-700 ${isPromptMode ? 'h-full overflow-y-auto pr-10' : 'line-clamp-3'}`} title={description}>
                            {description}
                        </p>
                        {isPromptMode && (
                            <button onClick={() => handleCopy(description, 'description')} title="Copy description" className="absolute top-2 right-2 z-10 text-gray-400 hover:text-white">
                                {copiedField === 'description' ? <i className="bi bi-check-lg text-green-500 text-base"></i> : <i className="bi bi-clipboard text-base"></i>}
                            </button>
                        )}
                    </div>
                </div>
                {!isPromptMode && (
                    <>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 flex justify-between items-center mb-1">
                                <span className="flex items-center gap-2">
                                    Keywords
                                    <button onClick={() => handleCopy(keywordsString, 'keywords')} title="Copy all keywords" className="text-gray-500 hover:text-white transition-colors">
                                        {copiedField === 'keywords' ? <i className="bi bi-check-lg text-green-500"></i> : <i className="bi bi-clipboard"></i>}
                                    </button>
                                </span>
                                <span className="text-xs font-normal text-gray-500">{keywords.length}</span>
                            </h3>
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
                                {keywords.map((k, i) => <span key={i} className="keyword-tag bg-[#3b3b3e] text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{k}</span>)}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-sm font-semibold text-gray-400 flex justify-between items-center mb-1">
                                <span>Category</span>
                            </h3>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                <span className="keyword-tag bg-sky-800/70 text-sky-200 text-xs font-medium px-2.5 py-1 rounded-full">{category}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

interface ResultsPanelProps {
    metadata: GeneratedMetadata[];
    setMetadata: React.Dispatch<React.SetStateAction<GeneratedMetadata[]>>;
    onRegenerate: (index: number) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ metadata, setMetadata, onRegenerate }) => {
    
    const handleDelete = (index: number) => {
        setMetadata(prev => prev.filter((_, i) => i !== index));
    };
    
    return (
        <div id="results-container" className="panel-bg p-4 sm:p-6 bg-[#202123] border border-[#363636] rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 sm:mb-6">Generated Metadata</h2>
            {metadata.length === 0 ? (
                <p className="text-gray-400 text-center py-6">Upload files and click 'Generate' to see results here.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {metadata.map((data, index) => (
                        <ResultCard key={index} data={data} index={index} onDelete={handleDelete} onRegenerate={onRegenerate} />
                    )).reverse()}
                </div>
            )}
        </div>
    );
};