import React from 'react';
import { X, Layers, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { ProcessingJob } from '@shared/types';

interface ProcessingQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: ProcessingJob[];
  onCancelJob?: (jobId: string) => void;
}

export const ProcessingQueueModal: React.FC<ProcessingQueueModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onCancelJob
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Processing Queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Concurrent image processing jobs status</p>
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

        {/* List of jobs */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No processing jobs active in queue.
            </div>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3.5 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {job.status === 'processing' && <Clock className="w-4 h-4 text-brand-500 animate-spin" />}
                    {job.status === 'failed' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    {job.status === 'queued' && <Clock className="w-4 h-4 text-amber-500" />}
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      {job.tool}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {job.id.substring(0, 6)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-500">
                      {job.progress}%
                    </span>
                    {job.status === 'processing' && onCancelJob && (
                      <button
                        type="button"
                        onClick={() => onCancelJob(job.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Cancel Job"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'completed'
                        ? 'bg-emerald-500'
                        : job.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-brand-500'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {job.message && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {job.message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
