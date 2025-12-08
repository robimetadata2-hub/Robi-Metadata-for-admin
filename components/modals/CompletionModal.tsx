import React from 'react';
import { GeneratedMetadata } from '../../types';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: { success: number; total: number };
  generatedMetadata: GeneratedMetadata[];
  selectedStockSite: string;
  fileExtension: string;
}

const SocialLink: React.FC<{
  href: string;
  className: string;
  icon: string;
  label: string;
  description: string;
}> = ({ href, className, icon, label, description }) => (
  <div className="flex flex-col items-center text-center">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-16 h-16 rounded-lg text-3xl text-white hover:opacity-90 transition-opacity ${className}`}
      aria-label={label}
    >
      <i className={`bi ${icon}`}></i>
    </a>
    <p className="mt-2 text-sm font-medium text-gray-200">{label}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);


export const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, onClose, stats, generatedMetadata, selectedStockSite, fileExtension }) => {
  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    if (generatedMetadata.length === 0) return;

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
        return; // No toast in modal, just exit
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
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="relative w-full max-w-sm bg-[#202123] rounded-xl border border-gray-700 shadow-2xl p-6 sm:p-8 text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
        
        <h2 className="text-2xl font-bold text-white mb-1.5">Metadata Generated!</h2>
        
        <p className="text-gray-400 mb-6">
          Successfully generated {stats.success} items.
        </p>
        
        <h3 className="text-base font-medium text-gray-300 mb-4">Connect With Us</h3>
        
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 mb-8">
            <SocialLink href="https://www.youtube.com/@robitechnology" className="bg-[#FF0000]" icon="bi-youtube" label="YouTube" description="Robi Tech" />
            <SocialLink href="https://www.facebook.com/groups/809434351197208" className="bg-[#1877F2]" icon="bi-facebook" label="Facebook" description="Our Group" />
            <SocialLink href="https://chat.whatsapp.com/BztzKMpcqHw5Hv2utCgBFN" className="bg-[#25D366]" icon="bi-whatsapp" label="WhatsApp" description="Join Chat" />
            
        </div>
        
        <button onClick={handleDownloadCsv} className="w-full flex items-center justify-center gap-3 py-3 bg-[color:var(--theme-color)] hover:bg-[color:var(--theme-color-hover)] rounded-lg transition-colors text-base font-semibold text-white shadow-lg">
            <i className="bi bi-download"></i>
            <span>Download CSV File</span>
        </button>
      </div>
    </div>
  );
};