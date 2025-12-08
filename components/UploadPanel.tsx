import React, { useState, useCallback, useRef, FC } from 'react';
import { StagedFile, GeneratedMetadata } from '../types';
import { generateThumbnail, processFileForApi } from '../services/fileProcessor';
import { GALLERY_DISPLAY_LIMIT } from '../constants';

interface UploadPanelProps {
  stagedFiles: StagedFile[];
  setStagedFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>;
  progress: { percent: number, status: string, currentFile: number, totalFiles: number };
  isGenerating: boolean;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  startGeneration: () => void;
  generatedMetadata: GeneratedMetadata[];
  setProgress: React.Dispatch<React.SetStateAction<{ percent: number, status: string, currentFile: number, totalFiles: number }>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  selectedStockSite: string;
  onStockSiteChange: (site: string) => void;
  fileExtension: string;
  clearAll: () => void;
}

const STOCK_SITES = [
    { key: 'General', name: 'General', logo: '/assets/images/stock-logos/general.png' },
    { key: 'adobe-stock', name: 'Adobe Stock', logo: '/assets/images/stock-logos/adobe-stock.png' },
    { key: 'shutterstock', name: 'Shutterstock', logo: '/assets/images/stock-logos/shutterstock.png' },
    { key: 'freepik', name: 'Freepik', logo: '/assets/images/stock-logos/freepik.png' },
    { key: 'getty', name: 'Getty Images', logo: '/assets/images/stock-logos/general.png' },
    { key: 'istock', name: 'iStock', logo: '/assets/images/stock-logos/general.png' },
    { key: 'dreamstime', name: 'Dreamstime', logo: '/assets/images/stock-logos/dreamstime.png' },
    { key: 'vecteezy', name: 'Vecteezy', logo: '/assets/images/stock-logos/vecteezy.png' },
];

const UploadPrompt: FC = () => (
    <div className="col-span-7 flex flex-col items-center justify-center p-5 text-center">
        <div className="flex space-x-4 sm:space-x-8 mb-4">
            <div className="flex flex-col items-center w-16 text-orange-500">
                <i className="bi bi-image" style={{ fontSize: '40px' }}></i>
                <span className="text-sm font-medium mt-1">Image</span>
            </div>
            <div className="flex flex-col items-center w-16 text-indigo-400">
                <i className="bi bi-film" style={{ fontSize: '40px' }}></i>
                <span className="text-sm font-medium mt-1">Videos</span>
            </div>
            <div className="flex flex-col items-center w-16 text-pink-500">
                <i className="bi bi-file-earmark-code" style={{ fontSize: '40px' }}></i>
                <span className="text-sm font-medium mt-1">EPS</span>
            </div>
        </div>
        <p className="mb-2 text-sm text-center px-4 text-gray-400">
            <span className="font-semibold text-gray-300">Drag & drop files here</span>, or <span className="font-semibold text-teal-400">click to select</span>
        </p>
        <p className="text-xs text-gray-500 px-4 text-center">Supported: JPG, PNG, GIF, MP4, MOV, EPS, AI, PDF</p>
    </div>
);

const GalleryItem: FC<{ fileState: StagedFile, onRemove: (id: string) => void }> = ({ fileState, onRemove }) => {
    let overlay = null;
    if (fileState.status === 'compressing') {
        overlay = <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10"><div className="spinner"></div><span className="text-xs mt-1.5">Preparing...</span></div>;
    } else if (fileState.status === 'processing') {
        overlay = <div className="absolute inset-0 bg-[color:var(--theme-color)]/80 flex flex-col items-center justify-center text-white z-10"><div className="spinner"></div><span className="text-xs mt-1.5">Generating...</span></div>;
    } else if (fileState.status === 'error') {
        overlay = <div className="absolute inset-0 bg-red-800/80 flex flex-col items-center justify-center text-white z-10"><i className="bi bi-exclamation-triangle-fill text-2xl"></i><span className="text-xs mt-1.5">Error</span></div>;
    }

    return (
        <div className="gallery-item group relative w-full aspect-square rounded-lg overflow-hidden bg-[#3b3b3e] shadow-md">
            <img src={fileState.thumbnailDataUrl} alt={fileState.file.name} className="w-full h-full object-cover" />
            {overlay}
            <button onClick={() => onRemove(fileState.id)} className="remove-file-btn absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-lg leading-none cursor-pointer opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-20" title="Remove file">&times;</button>
        </div>
    );
};

export const UploadPanel: React.FC<UploadPanelProps> = (props) => {
    const { stagedFiles, setStagedFiles, progress, isGenerating, isPaused, setIsPaused, startGeneration, generatedMetadata, setProgress, showToast, selectedStockSite, onStockSiteChange, fileExtension, clearAll } = props;
    
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const readyFilesCount = stagedFiles.filter(f => f.status === 'ready').length;
    const isGenerateDisabled = isGenerating || stagedFiles.length === 0 || readyFilesCount !== stagedFiles.length;
    const isExportDisabled = generatedMetadata.length === 0;

    const showOverflow = stagedFiles.length > GALLERY_DISPLAY_LIMIT;
    const filesToDisplay = showOverflow ? stagedFiles.slice(0, GALLERY_DISPLAY_LIMIT - 1) : stagedFiles;
    const overflowCount = stagedFiles.length - (GALLERY_DISPLAY_LIMIT - 1);

    const handleFiles = useCallback(async (files: FileList) => {
        const placeholderThumbnail = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='; // 1x1 gray pixel

        // 1. Filter out duplicates and invalid files, create initial states
        const newFilesToStage: StagedFile[] = [];
        for (const file of Array.from(files)) {
            if (/^(image\/(jpeg|png|gif|svg\+xml)|video\/(mp4|quicktime)|application\/(postscript|pdf))$/.test(file.type)) {
                if (!stagedFiles.some(f => f.file.name === file.name && f.file.lastModified === file.lastModified)) {
                    const fileId = `file-${Date.now()}-${Math.random()}`;
                    newFilesToStage.push({
                        file,
                        id: fileId,
                        status: 'compressing', // Initial status
                        thumbnailDataUrl: placeholderThumbnail,
                        apiData: null
                    });
                }
            } else {
                showToast(`Unsupported file type: "${file.name}"`, 'warning');
            }
        }

        if (newFilesToStage.length === 0) {
            return;
        }
        
        // 2. Add files to state immediately for instant UI feedback
        setStagedFiles(prev => [...prev, ...newFilesToStage]);
        
        // 3. Process each new file sequentially for thumbnails and API data
        const totalToProcess = newFilesToStage.length;
        setProgress({ percent: 0, status: `Preparing 1/${totalToProcess}...`, currentFile: 1, totalFiles: totalToProcess });

        for (let i = 0; i < newFilesToStage.length; i++) {
            const fileState = newFilesToStage[i];
            
            setProgress(p => ({ ...p, status: `Preparing ${i + 1}/${totalToProcess}...`, currentFile: i + 1 }));

            try {
                const thumbnailUrl = await generateThumbnail(fileState.file);
                // Fix: Correctly assign the `thumbnailUrl` variable to the `thumbnailDataUrl` property.
                setStagedFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, thumbnailDataUrl: thumbnailUrl } : f));

                const apiData = await processFileForApi(fileState);
                setStagedFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, apiData, status: 'ready' } : f));

            } catch (error) {
                console.error(`Processing error for ${fileState.file.name}`, error);
                setStagedFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: 'error' } : f));
                showToast(`Failed to prepare ${fileState.file.name}.`, 'error');
            }
            
            setProgress(p => ({ ...p, percent: ((i + 1) / totalToProcess) * 100 }));
        }
        
        setTimeout(() => {
            if (!isGenerating) {
                setProgress({ percent: 0, status: 'Ready.', currentFile: 0, totalFiles: 0 });
            }
        }, 1500);
    }, [stagedFiles, setStagedFiles, setProgress, showToast, isGenerating]);
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
    const onAreaClick = () => { fileInputRef.current?.click(); };
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(e.target.files); };

    const removeStagedFile = (id: string) => {
        setStagedFiles(prev => prev.filter(f => f.id !== id));
    };
    
    const exportToCsv = () => {
        if (generatedMetadata.length === 0) {
            showToast('No metadata available to export.', 'warning');
            return;
        }

        const escapeCsv = (str: string | undefined | number) => `"${(String(str ?? '').replace(/"/g, '""'))}"`;
        const getFilenameWithNewExtension = (originalFilename: string) => {
            if (fileExtension === 'default' || !fileExtension) {
                return originalFilename;
            }
            const lastDotIndex = originalFilename.lastIndexOf('.');
            if (lastDotIndex === -1) {
                return `${originalFilename}.${fileExtension}`;
            }
            const nameWithoutExtension = originalFilename.substring(0, lastDotIndex);
            return `${nameWithoutExtension}.${fileExtension}`;
        };

        let csvContent = "";
        const generationMode = generatedMetadata.length > 0 ? generatedMetadata[0].mode : 'metadata';
        
        if (generationMode === 'prompt') {
            const headers = ['serial number', 'Description'];
            const rows = generatedMetadata
                .filter(item => item.mode === 'prompt')
                .map((item, index) => 
                    [
                        index + 1,
                        item.description
                    ].map(escapeCsv).join(',')
                );
            csvContent = headers.join(',') + '\n' + rows.join('\n');
        } else { // Metadata mode with platform-specific formatting
            let headers: string[] = [];
            let rows: string[] = [];
            const metadataItems = generatedMetadata.filter(item => item.mode === 'metadata');

            switch (selectedStockSite) {
                case 'adobe-stock':
                    headers = ['Filename', 'Title', 'Keywords', 'Category'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.keywords?.join(', '),
                            r.category,
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'shutterstock':
                    headers = ['Filename', 'Description', 'Keywords', 'Categorie'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title, // Description is the Title for Shutterstock
                            r.keywords?.slice(0, 50).join(','),
                            r.category,
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'freepik':
                    headers = ['File name', 'Title', 'Keywords', 'Prompt', 'Category'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.keywords?.join(', '),
                            "", // Empty Prompt
                            r.category,
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'getty':
                    headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.description,
                            r.keywords?.join(', '),
                            r.category,
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'istock':
                    headers = ['filename', 'title', 'keywords', 'category', 'release'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.keywords?.join(', '),
                            r.category,
                            "", // Empty release
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'dreamstime':
                    headers = ['filename', 'title', 'keywords', 'category', 'exclusive', 'editorial', 'model_releases', 'property_releases', 'image_id', 'mr_ids'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.keywords?.join(', '),
                            r.category,
                            "","","","","","",
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'vecteezy':
                    headers = ['Filename', 'Title', 'Description', 'Keywords'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.description,
                            r.keywords?.join(', '),
                        ].map(escapeCsv).join(',')
                    );
                    break;
                case 'General':
                default:
                    headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category'];
                    rows = metadataItems.map(r => 
                        [
                            getFilenameWithNewExtension(r.filename),
                            r.title,
                            r.description,
                            r.keywords?.join(', '),
                            r.category,
                        ].map(escapeCsv).join(',')
                    );
                    break;
            }
            if (rows.length > 0) {
               csvContent = headers.join(',') + '\n' + rows.join('\n');
            }
        }
        
        if (!csvContent.trim()) {
            showToast('No data to export for the selected mode.', 'warning');
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = generationMode === 'prompt' ? `${selectedStockSite}_prompts.csv` : `${selectedStockSite}_metadata.csv`;
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV exported successfully.', 'success');
    };

    const handlePause = () => {
        setIsPaused(p => !p);
    };

  return (
    <div className="panel-bg p-4 sm:p-6 bg-[#202123] border border-[#363636] rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4 sm:mb-6">Upload Files</h2>
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2">
        {STOCK_SITES.map(site => (
          <button 
            key={site.key} 
            onClick={() => onStockSiteChange(site.key)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedStockSite === site.key ? 'text-[color:var(--theme-color)] border-[color:var(--theme-color)] bg-[color:var(--theme-color-active-bg)] shadow-[0_0_5px_var(--theme-color-shadow)]' : 'text-gray-400 border-gray-600 bg-[#2a2b2e] hover:text-white hover:border-gray-500'}`}
          >
            <img src={site.logo} alt={`${site.name} Logo`} className={`w-5 h-5 object-contain transition-all ${selectedStockSite !== site.key ? 'filter grayscale brightness-125' : ''}`}/>
            <span>{site.name}</span>
          </button>
        ))}
      </div>

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onAreaClick}
        className={`relative w-full border-2 border-dashed rounded-lg cursor-pointer bg-gray-800/20 transition-colors ${isDragging ? 'border-[color:var(--theme-color)] bg-[color:var(--theme-color-active-bg)]' : 'border-gray-600 hover:bg-gray-700/30'}`}
      >
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 justify-center items-center p-4 min-h-[200px]">
           {stagedFiles.length === 0 ? (
                <UploadPrompt />
            ) : (
                <>
                {filesToDisplay.map(fs => (
                    <GalleryItem key={fs.id} fileState={fs} onRemove={removeStagedFile} />
                ))}

                {showOverflow && (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#3b3b3e] shadow-md flex items-center justify-center text-white font-bold text-lg text-center p-2" title={`${overflowCount} more files`}>
                    <img 
                        src={stagedFiles[GALLERY_DISPLAY_LIMIT - 1].thumbnailDataUrl}
                        alt="More files background" 
                        className="absolute inset-0 w-full h-full object-cover filter blur-sm brightness-50"
                    />
                    <span className="relative z-10">+{overflowCount} More</span>
                    </div>
                )}
                </>
            )}
        </div>
        <input ref={fileInputRef} onChange={onFileChange} type="file" className="hidden" multiple accept="image/jpeg,image/png,image/gif,image/svg+xml,video/mp4,video/quicktime,application/postscript,application/pdf" />
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-300 truncate pr-2">{progress.status}</span>
            <span className="font-medium text-white flex-shrink-0">{Math.round(progress.percent)}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${progress.percent > 0 && progress.percent < 100 ? 'progress-bar-animated' : ''}`} 
                style={{ width: `${progress.percent}%`, backgroundColor: 'var(--theme-color)' }}
            ></div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button onClick={clearAll} className="flex items-center justify-center space-x-2 py-2.5 px-4 sm:px-5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors text-sm sm:text-base"><i className="bi bi-trash-fill"></i><span className="truncate">Clear All</span></button>
        <button onClick={handlePause} disabled={!isGenerating} className="flex items-center justify-center space-x-2 py-2.5 px-4 sm:px-5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium rounded-lg shadow-md transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {isPaused ? <><i className="bi bi-play-fill"></i><span className="truncate">Resume</span></> : <><i className="bi bi-pause-fill"></i><span className="truncate">Pause</span></>}
        </button>
        <button onClick={startGeneration} disabled={isGenerateDisabled} className="flex items-center justify-center space-x-2 py-2.5 px-4 sm:px-5 bg-[color:var(--theme-color)] hover:bg-[color:var(--theme-color-hover)] text-white font-medium rounded-lg shadow-md transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {isGenerating ? <div className="spinner-sm"></div> : <i className="bi bi-stars"></i>}
            <span className="truncate">{isGenerating ? 'Generating...' : `Generate (${readyFilesCount})`}</span>
        </button>
        <button onClick={exportToCsv} disabled={isExportDisabled} className="flex items-center justify-center space-x-2 py-2.5 px-4 sm:px-5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"><i className="bi bi-download"></i><span className="truncate">Export CSV</span></button>
        <button onClick={() => { if(generatedMetadata.length > 0) document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth' }); else showToast('No history yet. Generate metadata first.', 'info'); }} className="flex items-center justify-center space-x-2 py-2.5 px-4 sm:px-5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition-colors text-sm sm:text-base col-span-2 sm:col-span-1 lg:col-span-1"><i className="bi bi-clock-history"></i><span className="truncate">History</span></button>
      </div>
    </div>
  );
};