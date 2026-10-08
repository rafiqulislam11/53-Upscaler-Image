import React from 'react';
import {
  Maximize2,
  Palette,
  Sparkles,
  Eye,
  ArrowRight,
  ShieldCheck,
  Zap,
  Printer
} from 'lucide-react';
import { ToolId } from '@shared/types';
import { TOOLS } from '../registry/toolRegistry';

interface DashboardProps {
  onSelectTool: (toolId: ToolId) => void;
  onSelectSample: (samplePath: string, name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTool, onSelectSample }) => {
  const getToolIcon = (id: ToolId) => {
    switch (id) {
      case 'upscale': return <Maximize2 className="w-6 h-6 text-cyan-400" />;
      case 'gradient': return <Palette className="w-6 h-6 text-purple-400" />;
      case 'noise': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'blur': return <Eye className="w-6 h-6 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-brand-950 p-8 sm:p-10 border border-slate-200/20 dark:border-dark-700 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold font-mono tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>4-IN-1 PROFESSIONAL IMAGE PROCESSING SUITE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Next-Gen Image Editing & AI Super-Resolution
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Upscale to crisp 4K & 8K Ultra HD, extract high-end gradients, apply authentic 35mm film grain, and create optical blur with guaranteed 72 to 300 PPI print readiness.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTool('upscale')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
            >
              <span>Launch 4K/8K Upscaler</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-2 bg-black/30 rounded-xl border border-white/5">
              <Printer className="w-4 h-4 text-brand-400" />
              <span>72–300 PPI DPI Density Embedding</span>
            </div>
          </div>
        </div>

        {/* Ambient Decorative Shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-60 h-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Tool Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Professional Image Workspaces
          </h3>
          <span className="text-xs text-slate-400">Select any tool to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TOOLS.map(tool => (
            <div
              key={tool.id}
              className="group bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 hover:border-brand-500 dark:hover:border-brand-500/70 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    {getToolIcon(tool.id)}
                  </div>
                  {tool.badge && (
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-xs font-mono text-brand-600 dark:text-brand-400 mt-0.5">
                    {tool.tagline}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-1.5 pt-2">
                  {tool.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Ready for editing</span>
                <button
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-800 dark:text-slate-200 transition-all shadow-xs"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Sample Selector */}
      <div className="bg-white dark:bg-dark-850 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Want to test right now without an upload?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Load high-definition demo samples in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelectSample('/samples/cyberpunk.jpg', 'cyberpunk.jpg')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            🌆 Cyberpunk (4K City)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('/samples/portrait.jpg', 'portrait.jpg')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            👤 Portrait (Studio)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('/samples/nature.jpg', 'nature.jpg')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            🏔️ Alpine Lake
          </button>
        </div>
      </div>
    </div>
  );
};
