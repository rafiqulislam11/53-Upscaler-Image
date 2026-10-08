import React from 'react';
import { History, Trash2, RotateCcw, Download, Calendar, Maximize2 } from 'lucide-react';
import { HistoryItem, ToolId } from '@shared/types';

interface HistoryPageProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onSelectTool: (toolId: ToolId) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onClearHistory,
  onRemoveItem,
  onSelectTool
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            <span>Recent Processing History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View previously processed images, dimensions, PPI density, and reuse configurations.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 p-12 text-center space-y-3">
          <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No processing history yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you apply any of the 4 tools (Upscale, Gradient, Noise, Blur), your processed outputs will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-dark-800 flex-shrink-0 border border-slate-200 dark:border-dark-700">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                      {item.toolName}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={item.originalName}>
                    {item.originalName}
                  </h4>

                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>
                      {item.dimensions.result.width} × {item.dimensions.result.height} px
                    </div>
                    <div className="text-brand-500 font-bold">
                      {item.ppi || 300} PPI Print Density
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTool(item.tool)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-dark-800 hover:bg-brand-600 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reuse Tool</span>
                  </button>
                  <a
                    href={item.resultUrl}
                    download={item.filename}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
