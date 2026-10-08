import React from 'react';
import { Undo2, Redo2, RotateCcw, Eye, Play, Download } from 'lucide-react';

interface CommonControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onApply: () => void;
  onDownload: () => void;
  isProcessing?: boolean;
}

export const CommonControls: React.FC<CommonControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onApply,
  onDownload,
  isProcessing = false
}) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-xl shadow-xs">
      {/* Undo / Redo / Reset */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo || isProcessing}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-dark-700 mx-1" />
        <button
          type="button"
          onClick={onReset}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
          title="Reset to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Apply & Download */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
          title="Download (Ctrl+S)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
