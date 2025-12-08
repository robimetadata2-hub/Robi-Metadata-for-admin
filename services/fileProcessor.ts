
import { StagedFile } from '../types';

const createImageFromFile = (file: File | Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        img.src = url;
    });
};

const compressImage = async (file: File, maxWidth: number, quality: number): Promise<string> => {
    const image = await createImageFromFile(file);
    const canvas = document.createElement('canvas');
    let { width, height } = image;
    
    if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    const isPng = file.type === 'image/png';

    // Only add a white background for non-PNG images to preserve transparency
    if (!isPng) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.drawImage(image, 0, 0, width, height);
    
    // Return PNG data URL for PNGs, otherwise JPEG
    if (isPng) {
        return canvas.toDataURL('image/png');
    } else {
        return canvas.toDataURL('image/jpeg', quality);
    }
};

const rasterizeSvg = async (file: File, width: number): Promise<string> => {
    const text = await file.text();
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    // When rasterizing SVG, we treat it like a generic image, which compressImage will convert to jpeg
    return compressImage(new File([blob], file.name, {type: "image/svg+xml"}), width, 0.7);
};

const getVideoFrame = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(file);

        video.onloadeddata = () => {
            video.currentTime = Math.min(1.0, video.duration / 2); // Seek to middle or 1s
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            let { videoWidth, videoHeight } = video;
            
            if (videoWidth > maxWidth) {
                videoHeight = (maxWidth / videoWidth) * videoHeight;
                videoWidth = maxWidth;
            }

            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Could not get canvas context"));

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, videoWidth, videoHeight);
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
        };

        video.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };

        video.src = url;
    });
};

export const generateThumbnail = async (file: File): Promise<string> => {
    const maxWidth = 300;
    if (/^image\/(jpeg|png|gif)$/.test(file.type)) {
        return await compressImage(file, maxWidth, 0.7);
    }
    if (file.type === 'image/svg+xml') {
        return await rasterizeSvg(file, maxWidth);
    }
    if (file.type.startsWith('video/')) {
        return await getVideoFrame(file, maxWidth);
    }
    if (file.type === 'application/postscript' || file.type === 'application/pdf') {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'Vector';
        return `https://placehold.co/300x300/ffffff/333333?text=${ext}`;
    }
    throw new Error("Unsupported file type for thumbnail generation.");
};

export const processFileForApi = async (fileState: StagedFile): Promise<{ base64Data: string; mimeType: string; }> => {
    const maxWidth = 800;
    const file = fileState.file;
    let dataUrl: string;
    let mimeType = 'image/jpeg'; // Default to jpeg

    if (/^image\/(jpeg|png|gif)$/.test(file.type)) {
        dataUrl = await compressImage(file, maxWidth, 0.7);
        if (file.type === 'image/png') {
            mimeType = 'image/png';
        }
    } else if (file.type === 'image/svg+xml') {
        dataUrl = await rasterizeSvg(file, maxWidth);
    } else if (file.type.startsWith('video/')) {
        dataUrl = await getVideoFrame(file, maxWidth);
    } else if (file.type === 'application/postscript' || file.type === 'application/pdf') {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context for placeholder.");
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vector File', 50, 50);
        dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    } else {
        throw new Error("Unsupported file type for API processing.");
    }
    
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) throw new Error("Failed to extract base64 data from data URL.");
    
    return { base64Data, mimeType };
};
