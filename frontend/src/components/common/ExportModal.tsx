import React, { useState } from 'react';
import { X, Download, FileImage, Sliders, CheckCircle2 } from 'lucide-react';
import { ExportFormat, ExportResolution, ExportOptions } from '@shared/types';
import { ApiService } from '../../services/api.service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceFilename: string;
  defaultName?: string;
  defaultResolution?: ExportResolution;
  defaultPPI?: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sourceFilename,
  defaultName = 'processed-image',
  defaultResolution = 'original',
  defaultPPI = 300
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(95);
  const [resolution, setResolution] = useState<ExportResolution>(defaultResolution);
  const [ppi, setPpi] = useState<number>(defaultPPI); // 72 to 300 PPI
  const [filename, setFilename] = useState(defaultName);
  const [isExporting, setIsExporting] = useState(false);
  const [exportCompleteUrl, setExportCompleteUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const options: ExportOptions = {
        format,
        quality,
        resolution,
        ppi,
        filename: filename.trim() || 'image'
      };

      const result = await ApiService.exportImage(sourceFilename, options);
      setExportCompleteUrl(result.outputUrl);

      // Trigger automatic browser download
      const link = document.createElement('a');
      link.href = result.outputUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Export Image</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">High-resolution & print density rendering</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              File Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['png', 'jpeg', 'webp', 'tiff'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 text-xs font-semibold uppercase rounded-lg border transition-all ${
                    format === fmt
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                  }`}
                >
                  {fmt === 'jpeg' ? 'JPG' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality (for JPG / WEBP) */}
          {format !== 'png' && (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Compression Quality</span>
                <span className="font-mono text-brand-500">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Resolution Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Resolution Scale
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['original', '2x', '4x', '4k', '8k'] as ExportResolution[]).map(res => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={`py-1.5 px-2 text-xs font-semibold uppercase rounded-lg border transition-all ${
                    resolution === res
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                  }`}
                >
                  {res === 'original' ? '1X' : res}
                </button>
              ))}
            </div>
          </div>

          {/* PPI / DPI (72 to 300) Requirement */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Print Density (PPI / DPI)
              </label>
              <span className="text-xs font-mono font-bold text-brand-500 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                {ppi} PPI
              </span>
            </div>
            
            {/* Quick Presets for PPI */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPpi(72)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  ppi === 72
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                72 (Screen/Web)
              </button>
              <button
                type="button"
                onClick={() => setPpi(150)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  ppi === 150
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                150 (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPpi(300)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  ppi === 300
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                300 (Print Ready)
              </button>
            </div>

            <input
              type="range"
              min="72"
              max="300"
              step="1"
              value={ppi}
              onChange={e => setPpi(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Embedded into EXIF/JFIF density metadata for print fidelity.
            </p>
          </div>

          {/* Filename */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              placeholder="my-processed-image"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download ({ppi} PPI)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
