import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { ImageMetadata } from '@shared/types';
import { ApiService } from '../../services/api.service';

interface UniversalImageUploaderProps {
  currentImage: ImageMetadata | null;
  onImageUploaded: (image: ImageMetadata) => void;
  onImageRemoved: () => void;
  isLoading?: boolean;
}

export const UniversalImageUploader: React.FC<UniversalImageUploaderProps> = ({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  isLoading = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validation 1: Format
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|tiff?|bmp)$/i)) {
      setErrorMessage('Unsupported file format. Please upload JPG, PNG, WebP or TIFF.');
      return;
    }

    // Validation 2: Max Size 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Your image is too large. Maximum supported size is 50 MB.');
      return;
    }

    try {
      setUploadProgress(20);
      const timer = setInterval(() => {
        setUploadProgress(prev => (prev && prev < 85 ? prev + 15 : prev));
      }, 100);

      const metadata = await ApiService.uploadImage(file);
      clearInterval(timer);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(null);
        onImageUploaded(metadata);
      }, 250);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMessage(err.message || 'Something went wrong while processing the image. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (currentImage) {
    return (
      <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-dark-800 flex-shrink-0 border border-slate-200 dark:border-dark-700 relative">
            <img
              src={currentImage.url}
              alt={currentImage.originalName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {currentImage.originalName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              <span>{currentImage.width} × {currentImage.height}</span>
              <span>•</span>
              <span>{formatFileSize(currentImage.size)}</span>
              <span>•</span>
              <span className="text-brand-500 font-bold">{currentImage.ppi || 72} PPI</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-dark-750 hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace</span>
          </button>
          <button
            type="button"
            onClick={onImageRemoved}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp"
        className="hidden"
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-850 hover:border-brand-400 dark:hover:border-brand-500'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-dark-750 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3.5 shadow-sm group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Drag & Drop Image Here
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          or click to browse from your computer (Paste with Ctrl+V)
        </p>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Browse Image</span>
        </button>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-mono">
          JPG • PNG • WEBP • TIFF (up to 50MB)
        </span>

        {uploadProgress !== null && (
          <div className="absolute inset-0 bg-white/90 dark:bg-dark-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 z-10">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Uploading image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
